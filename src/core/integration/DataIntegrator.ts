import fs from 'fs';
import path from 'path';
import Fuse from 'fuse.js';
import { IdRegistry } from './IdRegistry';
import { SOURCE_HEADERS, FIELD_MAPPING, IDENTITY_FIELDS, FK_RELATIONS, SOURCE_ALIASES } from './SchemaConfig';
import logger from '../../utils/logger';

// const STAGING_DIR = path.resolve(__dirname, "../../../resource/data_csv/staging");
const STAGING_DIR = path.resolve(__dirname, "../../../resource/data_csv/staging");

export class DataIntegrator {
    // Cache dữ liệu staging để check trùng (Fuzzy Matching)
    private static stagingCache: Map<string, any[]> = new Map();

    /**
     * Xử lý một dòng dữ liệu thô từ RabbitMQ
     */
    static async processRecord(sourceName: string, originalTable: string, targetModel: string, rowData: string) {
        logger.info(`processRecord: source=${sourceName} originalTable=${originalTable} targetModel=${targetModel}`);
        // 1. Lấy Header cấu hình cho nguồn này
        // Nếu originalTable có đuôi .csv thì loại bỏ để khớp với keys trong SchemaConfig
        const tableName = originalTable.replace(/\.csv$/i, '').trim();
        const sourceKey = `${sourceName}_${tableName}`;
        logger.info(`processRecord: normalized sourceKey=${sourceKey}`);
        let headers = SOURCE_HEADERS[sourceKey];

        // Nếu không tìm thấy header, thử lookup qua alias map
        if (!headers) {
            const aliasKey = SOURCE_ALIASES[sourceKey];
            if (aliasKey) {
                headers = SOURCE_HEADERS[aliasKey];
                if (headers) {
                    logger.info(`INFO: Dùng alias header ${aliasKey} cho ${sourceKey}`);
                }
            }
        }

        // Nếu vẫn không tìm thấy, cố gắng tìm tự động bằng cách match phần tên bảng (case-insensitive)
        if (!headers) {
            const tableLower = tableName.toLowerCase();
            const candidates = Object.keys(SOURCE_HEADERS).filter(k => {
                const keyLower = k.toLowerCase();
                return keyLower.endsWith(`_${tableLower}`) || keyLower.includes(`_${tableLower}_`) || keyLower.includes(tableLower);
            });
            if (candidates.length > 0) {
                const matched = candidates[0];
                headers = SOURCE_HEADERS[matched];
                logger.info(`INFO: Tự động khớp header ${matched} cho ${sourceKey}`);
            }
        }

        if (!headers) {
            // Nếu chưa config header, log warn và bỏ qua (hoặc dùng default append nếu muốn)
            logger.warn(`⚠️ Chưa cấu hình Header cho ${sourceKey}. Skip.`);
            return;
        }
        // 2. Parse CSV
        const values = this.parseCsvLine(rowData);
        if (values.length === 0) return;

        // Map mảng values vào object { ColName: Value }
        const sourceObj: any = {};
        headers.forEach((h, i) => { sourceObj[h] = values[i]; });

        // Skip dòng Header nếu nó lặp lại trong content
        if (sourceObj[headers[0]] === headers[0]) return;

        // 3. Chuẩn hóa dữ liệu sang Target Model (DB3)
        const targetData = this.mapToTarget(targetModel, sourceObj);
        
        // 4. Xác định ID Cũ (Old ID)
        // Giả định cột đầu tiên trong header nguồn luôn là ID gốc (MaSP, MaDM...)
        const oldId = sourceObj[headers[0]];
        if (!oldId) return;

        // 5. FUZZY MATCHING (Kiểm tra trùng lặp)
        // Load cache nếu cần
        if (!this.stagingCache.has(targetModel)) {
            this.stagingCache.set(targetModel, []); // Ban đầu rỗng (hoặc load từ file nếu resume)
        }
        const currentStaging = this.stagingCache.get(targetModel)!;

        let matchedId: number | null = null;
        const identityFields = IDENTITY_FIELDS[targetModel];

        if (identityFields && identityFields.length > 0) {
            const fuse = new Fuse(currentStaging, {
                keys: identityFields,
                threshold: 0.3 // Độ chính xác trùng lặp
            });
            
            // Tìm kiếm dựa trên giá trị của trường định danh (VD: TenSP)
            const searchVal = targetData[identityFields[0]]; 
            if (searchVal) {
                const results = fuse.search(String(searchVal));
                if (results.length > 0) {
                    // TÌM THẤY TRÙNG!
                    const existingRecord = results[0].item as any;
                    // Lấy ID mới của bản ghi đã tồn tại trong Staging (thường là cột đầu tiên của staging)
                    // Ở đây ta quy ước ID mới nằm ở key "NewID" hoặc field đầu tiên trong DB3
                    // Để đơn giản, ta lấy từ IdRegistry bằng cách reverse lookup hoặc lưu ID vào cache object
                    matchedId = existingRecord._systemId; 
                    logger.info(`🔗 GỘP: "${searchVal}" (${sourceName}) -> ID ${matchedId} (Đã có)`);
                }
            }
        }

        // 6. RE-ID & REMAP
        let finalId: number;

        if (matchedId) {
            // Case A: Trùng lặp -> Map ID cũ sang ID đã tồn tại
            finalId = matchedId;
            // Chỉ lưu map, KHÔNG ghi thêm vào file staging
            IdRegistry.getOrGenerateId(targetModel, sourceName, oldId); // Cập nhật state map (nếu cần logic force)
            (IdRegistry as any).setMapping(targetModel, sourceName, oldId, finalId);

        } else {
            // Case B: Mới -> Sinh ID mới
            finalId = IdRegistry.getOrGenerateId(targetModel, sourceName, oldId);
            targetData._systemId = finalId;
            
            // Update lại cột PK trong object targetData (Cần biết tên cột PK, VD: MaSP)
            const pkField = this.getPrimaryKey(targetModel); 
            targetData[pkField] = finalId;

            // 7. REMAP FOREIGN KEY (Quan trọng nhất)
            const fkConfig = FK_RELATIONS[targetModel];
            if (fkConfig) {
                for (const [fkField, refModel] of Object.entries(fkConfig)) {
                    // Giá trị FK cũ (VD: MaLoaiHang = 5)
                    const oldFkVal = targetData[fkField]; 
                    if (oldFkVal) {
                        // Tìm ID mới của LoaiHang 5
                        const newFkVal = IdRegistry.lookupId(refModel, sourceName, oldFkVal);
                        if (newFkVal) {
                            targetData[fkField] = newFkVal; // Thay thế: 5 -> 15
                        } else {
                            // Nếu không tìm thấy (do chạy sai thứ tự ưu tiên), log warn
                            logger.warn(`⚠️ Mất liên kết FK: ${targetModel}.${fkField}=${oldFkVal} -> ${refModel} (Chưa có trong Map)`);
                            // Có thể set null để tránh lỗi DB
                            targetData[fkField] = null;
                        }
                    }
                }
            }

            // 8. Ghi xuống File Staging
            this.appendToCsv(targetModel, targetData);
            
            // Cập nhật Cache để các record sau check trùng
            currentStaging.push(targetData);
        }
    }

    // --- Helper Methods ---

    private static parseCsvLine(line: string): string[] {
        // Regex xử lý CSV có dấu phẩy trong ngoặc kép
        const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
        return line.split(regex).map(s => s.replace(/^"|"$/g, '').trim());
    }

    private static mapToTarget(model: string, sourceObj: any): any {
        const mapping = FIELD_MAPPING[model];
        const result: any = {};
        
        if (!mapping) {
            // Nếu không có mapping, copy nguyên xi (fallback)
            return { ...sourceObj };
        }

        for (const [targetField, sourceFieldCandidate] of Object.entries(mapping)) {
            if (Array.isArray(sourceFieldCandidate)) {
                // Tìm trường đầu tiên có dữ liệu trong source
                for (const f of sourceFieldCandidate) {
                    if (sourceObj[f] !== undefined && sourceObj[f] !== "") {
                        result[targetField] = sourceObj[f];
                        break;
                    }
                }
            } else {
                result[targetField] = sourceObj[sourceFieldCandidate as string];
            }
        }
        return result;
    }

    private static getPrimaryKey(model: string): string {
        // Mapping từ @PrimaryGeneratedColumn decorators trong src/models:
        if (model === "LoaiHang") return "MaLoaiHang";
        if (model === "SanPham") return "MaSP";
        if (model === "NhaCungCap") return "MaNCC";
        if (model === "KhoHang") return "MaKho";
        if (model === "ViTriKho") return "MaVT";
        if (model === "KhuyenMai") return "MaKM";
        if (model === "Thue") return "MaThue";
        if (model === "AnhSanPham") return "MaAnh";
        if (model === "Web1_TaiKhoan") return "MaTK";
        if (model === "Web1_SoDiaChi") return "MaDC";
        if (model === "Web1_HoaDon") return "MaHD";
        if (model === "Web1_GioHang") return "MaGH";
        if (model === "Web1_DanhGia") return "MaDG";
        if (model === "Web1_ChiTietHoaDon") return "MaCTHD";
        if (model === "Web1_ThanhToan") return "MaTT";
        if (model === "Web1_LichSuDonHang") return "MaLSDH";
        if (model === "Kho1_TonKho") return "MaTK";
        if (model === "Kho1_TonKhoChiTiet") return "MaTKCT";
        if (model === "Kho1_PhieuNhap") return "MaPN";
        if (model === "Kho1_ChiTietPhieuNhap") return "MaCTPN";
        if (model === "Kho1_PhieuXuat") return "MaPX";
        if (model === "Kho1_ChiTietPhieuXuat") return "MaCTPX";
        if (model === "Kho1_VanDon") return "MaVD";
        if (model === "Kho1_PhieuKiemKe") return "MaKK";
        if (model === "Kho1_ChiTietKiemKe") return "MaCTKK";
        if (model === "Kho1_PhieuTraHang") return "MaPTH";
        if (model === "Kho1_ChiTietTraHang") return "MaCTPTH";
        // Default fallback
        return "Id"; 
    }

    private static appendToCsv(model: string, data: any) {
        const filePath = path.join(STAGING_DIR, `${model}.csv`);
        logger.info(`Staging write: model=${model} file=${filePath}`);
        
        // Loại bỏ field nội bộ _systemId trước khi ghi
        const { _systemId, ...csvData } = data;
        
        // Lấy values theo thứ tự nào? 
        // Tốt nhất là nên có header chuẩn cho Staging. 
        // Ở đây ta ghi values dynamic, nhưng pipeline đọc cần header.
        // TODO: Logic ghi header nếu file chưa tồn tại.
        
        const exists = fs.existsSync(filePath);
        const keys = Object.keys(csvData);
        const values = Object.values(csvData).map(v => 
            (typeof v === 'string' && v.includes(',')) ? `"${v}"` : v
        );

        if (!exists) {
            logger.info(`Staging write: creating file and header -> ${filePath}`);
            fs.writeFileSync(filePath, keys.join(",") + "\n"); // Ghi Header
        }
        logger.info(`Staging write: appending ${values.length} values to ${filePath}`);
        fs.appendFileSync(filePath, values.join(",") + "\n");
    }
}