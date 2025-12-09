import 'reflect-metadata';
import path from 'path';
import './models'; 
import logger from './utils/logger';
import { CsvReader } from './utils/CsvReader';
import { ParseHandler, TransformationHandler, ValidationHandler, CsvSaveHandler, DeduplicationHandler, SqlSaveHandler } from './pipeline/ConcreteHandlers';
import { PipelineContext } from './pipeline/Handler';
import { Deduplicator } from './core/Deduplicator';
import { AppDataSource, initializeDatabase } from './config/database/typeormConfig';
import { EntityFactory } from './core/EntityFactory';

async function main() {

    // 1. CẤU HÌNH PIPELINE
    const parser = new ParseHandler();
    const transformer = new TransformationHandler();
    const deduplicator = new DeduplicationHandler();
    const validator = new ValidationHandler();
    const saver = new CsvSaveHandler();
    const sqlSaver = new SqlSaveHandler();

    // Sắp xếp Chain
    parser
        .setNext(transformer)
        .setNext(deduplicator) 
        .setNext(validator)
        .setNext(saver)
        .setNext(sqlSaver);

    // 2. KHỞI TẠO READER
    const csvDir = path.join(__dirname, '../resource/data_csv/staging');
    const reader = new CsvReader(csvDir);

    // 3. ĐỊNH NGHĨA THỨ TỰ ƯU TIÊN (Priority List)
    const ORDERED_ENTITIES = [
        // Nhóm 1: Master Data (Không phụ thuộc)
        "LoaiHang", "NhaCungCap", "KhoHang", "Thue", "KhuyenMai",
        "Web1_TaiKhoan", "SanPham", 

        // Nhóm 2: Bảng Trung Gian & Chi tiết Master
        "SanPham_KhuyenMai", "AnhSanPham", "ViTriKho", "Web1_SoDiaChi",

        // Nhóm 3: Nghiệp vụ Kho (Nhập/Xuất/Tồn)
        "Kho1_TonKho",
        "Kho1_TonKhoChiTiet", 
        "Kho1_PhieuNhap", "Kho1_ChiTietPhieuNhap",
        "Kho1_PhieuXuat", "Kho1_ChiTietPhieuXuat",
        "Kho1_PhieuKiemKe", "Kho1_ChiTietKiemKe",
        
        // Nhóm 4: Nghiệp vụ Bán Hàng (Hóa đơn phải có trước)
        "Web1_HoaDon",          
        "Web1_ChiTietHoaDon",
        "Web1_GioHang",
        "Web1_DanhGia",
        
        // Nhóm 5: Các bảng phụ thuộc Hóa Đơn
        "Web1_ThanhToan",       
        "Web1_LichSuDonHang",   
        "Kho1_VanDon",          
        "Kho1_PhieuTraHang",    
        "Kho1_ChiTietTraHang"
    ];

    // Lấy danh sách các Model đã đăng ký
    const registeredEntities = EntityFactory.getRegisteredEntityNames();

    // Lọc ra các bảng cần chạy theo thứ tự ưu tiên
    const executionList = ORDERED_ENTITIES.filter(name => registeredEntities.includes(name));

    // Tìm các bảng bị sót
    const missingEntities = registeredEntities.filter(x => !ORDERED_ENTITIES.includes(x));
    if (missingEntities.length > 0) {
        logger.warn(`⚠️ Các bảng sau chưa được xếp thứ tự (sẽ chạy cuối): ${missingEntities.join(', ')}`);
        executionList.push(...missingEntities);
    }

    logger.info(`📋 Danh sách thực thi (${executionList.length} bảng):\n${executionList.join(' -> ')}`);

    // --- BIẾN THỐNG KÊ ---
    let totalFilesProcessed = 0;
    let globalTotalRecords = 0;
    let globalPass = 0;
    let globalFail = 0;
    let globalSkip = 0;    
    let globalDbSaved = 0; 

    let currentTableName = "";
    let currentFileRecordIndex = 0;
    let currentFilePass = 0;
    let currentFileFail = 0;
    let currentFileSkip = 0;
    let currentFileDbSaved = 0;

    logger.info("========================================");
    logger.info("HỆ THỐNG BẮT ĐẦU XỬ LÝ DỮ LIỆU");
    logger.info("========================================");

    try {
        await initializeDatabase();
        await Deduplicator.resetCache();
        await Deduplicator.loadHistory();

        // [QUAN TRỌNG] Sử dụng readCustomList thay vì readAll để đảm bảo thứ tự
        for await (const { tableName, data } of reader.readCustomList(executionList)) {
            
            if (tableName !== currentTableName) {
                if (currentTableName !== "") {
                    printFileSummary(currentTableName, currentFileRecordIndex, currentFilePass, currentFileFail, currentFileSkip, currentFileDbSaved);
                }
                
                currentTableName = tableName;
                currentFileRecordIndex = 0;
                currentFilePass = 0;
                currentFileFail = 0;
                currentFileSkip = 0;
                currentFileDbSaved = 0;
                totalFilesProcessed++;
            }

            currentFileRecordIndex++;
            globalTotalRecords++;
            logger.info(`\n--- Record ${currentFileRecordIndex} ---`);

            const context: PipelineContext = {
                tableName: tableName,
                fileName: `${tableName}.csv`,
                entityName: tableName, // [QUAN TRỌNG] Phải có field này để Handler biết xử lý cho Entity nào
                recordIndex: currentFileRecordIndex,
                rawData: data
            };

            try {
                // RUN PIPELINE
                await parser.handle(context);

                // THỐNG KÊ
                if (context.isSkipped) {
                    currentFileSkip++;
                    globalSkip++;
                } else if (context.isValid) {
                    currentFilePass++;
                    globalPass++;
                    if (context.isSavedToDB) {
                        currentFileDbSaved++;
                        globalDbSaved++;
                    }
                } else {
                    currentFileFail++;
                    globalFail++;
                }

            } catch (err) {
                logger.error(`Lỗi hệ thống nghiêm trọng tại dòng ${currentFileRecordIndex}:`, err);
            }
        }

        // Tổng kết file cuối cùng
        if (currentTableName !== "") {
            printFileSummary(currentTableName, currentFileRecordIndex, currentFilePass, currentFileFail, currentFileSkip, currentFileDbSaved);
        }

        logger.info("\n========================================");
        logger.info("       TỔNG KẾT TOÀN BỘ QUÁ TRÌNH       ");
        logger.info("========================================");
        logger.info(`Số file đã xử lý         : ${totalFilesProcessed}`);
        logger.info(`Tổng số bản ghi          : ${globalTotalRecords}`);
        logger.info(`Tổng bản ghi hợp lệ      : ${globalPass}`);
        logger.info(`Tổng bản ghi không hơp lệ: ${globalFail}`);
        logger.info(`Tổng bản ghi đã bỏ qua   : ${globalSkip} (Trùng lặp)`);
        logger.info(`Tổng record đã lưu DB    : ${globalDbSaved}`);
        logger.info("========================================");

    } catch (error) {
        logger.error("Lỗi không mong muốn:", error);
    } finally {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
            logger.info("Đã đóng kết nối TypeORM.");
        }
    }
}

function printFileSummary(tableName: string, total: number, pass: number, fail: number, skip: number, dbSaved: number) {
    logger.info(`\n------- KẾT QUẢ FILE: ${tableName} -------`);
    logger.info(`  • Tổng bản ghi đã xử lý    : ${total}`);
    logger.info(`  • Tổng bản ghi hợp lệ      : ${pass}`);
    logger.info(`  • Tổng bản ghi không hợp lệ: ${fail}`);
    logger.info(`  • Tổng bản ghi đã bỏ qua   : ${skip} (Duplicate)`);
    logger.info(`  • Tổng bản ghi đã xuống DB : ${dbSaved}`);
    logger.info(`------------------------------------------\n`);
}

main().catch(err => logger.error("Fatal Error:", err));