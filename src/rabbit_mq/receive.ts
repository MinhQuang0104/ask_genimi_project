import fs from "fs";
import path from "path";
import * as rabbit from "rabbitmq-stream-js-client";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

import { DataIntegrator } from "../core/integration/DataIntegrator";
import { MergeService } from "../services/MergeService"; // Sửa đường dẫn import nếu cần
import { CSV_CONFIG } from "../config/CsvMappingConfig";
import logger from "../utils/logger";

const ROOT_DIR = path.resolve(__dirname, "../../");
const STAGING_DIR = path.join(ROOT_DIR, "resource", "data_csv", "staging");

// 1. ĐỊNH NGHĨA THỨ TỰ ƯU TIÊN (PHASES)
// Tên ở đây PHẢI KHỚP với targetModel trong CsvMappingConfig.ts và tên Class trong src/models
const PHASES = [
    // PHASE 1: MASTER DATA (Dữ liệu nền tảng - Độc lập)
    [
        "LoaiHang", 
        "NhaCungCap", 
        "KhoHang", 
        "ViTriKho", 
        "Thue", 
        "KhuyenMai", 
        "Web1_TaiKhoan", 
        "Web1_SoDiaChi"
    ],
    
    // PHASE 2: PRODUCT DATA (Phụ thuộc Phase 1)
    [
        "SanPham", 
        "AnhSanPham", 
        "SanPham_Thue",
        "SanPham_KhuyenMai"
    ],
    
    // PHASE 3: INVENTORY & OPS (Phụ thuộc Product & Kho)
    [
        "Kho1_TonKho",
        "Kho1_PhieuNhap", "Kho1_ChiTietPhieuNhap",
        "Kho1_PhieuXuat", "Kho1_ChiTietPhieuXuat",
        "Kho1_VanDon",
        "Kho1_PhieuKiemKe", "Kho1_ChiTietKiemKe",
        "Kho1_PhieuTraHang", "Kho1_ChiTietTraHang"
    ],
    
    // PHASE 4: TRANSACTION (Giao dịch Web - Phụ thuộc User & Product)
    [
        "Web1_HoaDon", 
        "Web1_ChiTietHoaDon", 
        "Web1_GioHang", 
        "Web1_DanhGia", 
        "Web1_ThanhToan", 
        "Web1_LichSuDonHang"
    ]
];

// Helper: Tạo key để tra cứu trong Config (VD: SOURCE1_ViTriKho)
function getConfigKey(source: string, rawTable: string): string {
    const cleanTable = rawTable.replace(/\.csv$/i, '').trim();
    return `${source}_${cleanTable}`; 
}

// Helper: Lấy tên clean để log fallback (chỉ dùng khi quên config)
function getRawNameForLog(rawTable: string): string {
    return rawTable.replace(/\.csv$/i, '').replace(/^SOURCE\d+_?/i, '').trim();
}

async function consumePhase(client: rabbit.Client, streams: string[], targetTables: string[]) {
    logger.info(`\n🚀 BẮT ĐẦU PHASE: [${targetTables.join(", ")}]`);
    
    const promises = streams.map(streamName => {
        return new Promise<void>(async (resolve) => {
            const sourceName = streamName.includes("datasource1") ? "SOURCE1" : "SOURCE2";
            let consumer: any;
            let idleTimer: NodeJS.Timeout;

            // Hàm kết thúc consumer khi stream tạm nghỉ (idle)
            const finish = async () => {
                clearTimeout(idleTimer);
                if (consumer) await consumer.close();
                resolve();
            };

            const resetIdleTimer = () => {
                if (idleTimer) clearTimeout(idleTimer);
                // Nếu 2s không có tin nhắn mới -> Coi như hết Phase hiện tại
                idleTimer = setTimeout(finish, 2000); 
            };

            consumer = await client.declareConsumer(
                { stream: streamName, offset: rabbit.Offset.first() },
                async (msg) => {
                    resetIdleTimer();
                    try {
                        const text = msg.content.toString();
                        const firstColon = text.indexOf(":");
                        if (firstColon === -1) return;

                        const rawTable = text.substring(0, firstColon).trim(); // VD: SOURCE1_ViTriKho.csv
                        let rowData = text.substring(firstColon + 1);

                        // 1. Xác định Config Key
                        const configKey = getConfigKey(sourceName, rawTable);
                        const config = CSV_CONFIG[configKey];

                        // 2. Xác định Model đích (Target Model)
                        let targetModel = "";

                        if (config && config.targetModel) {
                            // [UPDATE] Lấy trực tiếp từ Config (Chính xác 100%)
                            targetModel = config.targetModel;
                        } else {
                            // Fallback: Nếu quên config thì đoán (Log warn để biết đường sửa)
                            targetModel = getRawNameForLog(rawTable);
                            // logger.warn(`⚠️ Chưa cấu hình targetModel cho ${configKey}. Fallback sang: ${targetModel}`);
                        }

                        // 3. Kiểm tra: Model này có thuộc Phase đang chạy không?
                        if (targetTables.includes(targetModel)) {
                            
                            // === LOGIC GỘP DỮ LIỆU & ÁNH XẠ ID ===
                            if (config) {
                                const rows = parse(rowData, { relax_column_count: true, skip_empty_lines: true });
                                if (rows.length > 0) {
                                    let cols = rows[0]; 
                                    
                                    const oldId = cols[config.idIndex];
                                    const rawName = cols[config.nameIndex];

                                    if (oldId && rawName) {
                                        // A. Gọi Service để Chuẩn hóa Tên & Lấy ID thống nhất
                                        const result = MergeService.processRecord(targetModel, sourceName, oldId, rawName);

                                        // B. Cập nhật lại CSV (ID mới + Tên chuẩn)
                                        cols[config.idIndex] = result.newId; 
                                        cols[config.nameIndex] = result.newName;

                                        // C. Xử lý Khóa Ngoại (Foreign Keys)
                                        if (config.foreignKeys) {
                                            for (const fk of config.foreignKeys) {
                                                const fkOldVal = cols[fk.colIndex];
                                                // Dịch ID ngoại: Tìm ID mới của bảng cha dựa trên ID cũ
                                                const fkNewVal = MergeService.translateForeignKey(fk.parentModel, sourceName, fkOldVal);
                                                cols[fk.colIndex] = fkNewVal;
                                            }
                                        }

                                        // Đóng gói lại thành chuỗi CSV
                                        rowData = stringify([cols]).trim();
                                    }
                                }
                            }
                            // === KẾT THÚC LOGIC GỘP ===

                            // Đẩy vào Pipeline xử lý tiếp (Parse -> Validate -> Save DB)
                            // Lúc này targetModel đã là tên chuẩn (VD: Web1_TaiKhoan)
                            await DataIntegrator.processRecord(sourceName, rawTable, targetModel, rowData);
                        }

                    } catch (e) {
                        logger.error(`Error processing msg: ${e}`);
                    }
                }
            );
            
            // Khởi động timer lần đầu
            resetIdleTimer();
        });
    });

    await Promise.all(promises);
    logger.info(`✅ HOÀN TẤT PHASE.`);
}

async function main() {
    // 0. Dọn dẹp Staging cũ
    if (fs.existsSync(STAGING_DIR)) {
        fs.rmSync(STAGING_DIR, { recursive: true, force: true });
        fs.mkdirSync(STAGING_DIR, { recursive: true });
    }

    // 1. Reset bộ nhớ đệm của MergeService (Xóa ID mapping cũ)
    MergeService.clear();

    // 2. Kết nối RabbitMQ Stream
    const client = await rabbit.connect({
        hostname: "localhost",
        port: 5552,
        username: "guest",
        password: "guest",
        vhost: "/"
    });

    // Tên các stream trong RabbitMQ
    const streams = ["data_source1_kho_stream", "data_source2_web_stream"];

    logger.info("🔥 BẮT ĐẦU QUÁ TRÌNH INTEGRATION VỚI MERGE SERVICE...");

    // 3. CHẠY TUẦN TỰ TỪNG PHASE
    // Phase 1 chạy xong mới chạy Phase 2 -> Đảm bảo khóa ngoại luôn tìm thấy khóa chính
    for (const phaseTables of PHASES) {
        await consumePhase(client, streams, phaseTables);
    }

    logger.info("🎉 TOÀN BỘ QUÁ TRÌNH TÍCH HỢP HOÀN TẤT.");
    process.exit(0);
}

main().catch(console.error);