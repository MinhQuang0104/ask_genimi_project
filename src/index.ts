
import 'reflect-metadata';
import path from 'path';
import './models'; // Import models để register factory
import logger from './utils/logger';
import { CsvReader } from './utils/CsvReader';
import { ParseHandler, TransformationHandler, ValidationHandler, CsvSaveHandler, DeduplicationHandler, SqlSaveHandler } from './pipeline/ConcreteHandlers';
import { PipelineContext } from './pipeline/Handler';
import { Deduplicator } from './core/Deduplicator';
// import { SqlSaveHandler } from './pipeline/ConcreteHandlers/SqlSaveHandler'; 
import { AppDataSource, initializeDatabase } from './config/database/typeormConfig';
async function main() {

    // 1. CẤU HÌNH PIPELINE
    const parser = new ParseHandler();
    const transformer = new TransformationHandler();
    const deduplicator = new DeduplicationHandler();
    const validator = new ValidationHandler();
    const saver = new CsvSaveHandler();
    const sqlSaver = new SqlSaveHandler();

    parser
        .setNext(transformer)
        // .setNext(deduplicator)
        .setNext(validator)
        .setNext(saver)
        .setNext(sqlSaver);

    // 2. KHỞI TẠO READER
    const csvDir = path.join(__dirname, '../resource/data_csv/staging');
    const reader = new CsvReader(csvDir);

    // --- BIẾN THỐNG KÊ TOÀN CỤC ---
    let totalFilesProcessed = 0;
    let globalPass = 0;
    let globalFail = 0;
    let globalSkip = 0;

    // --- BIẾN THEO DÕI FILE HIỆN TẠI ---
    let currentTableName = "";
    let currentFileRecordIndex = 0;
    let currentFilePass = 0;
    let currentFileFail = 0;
    let currentFileSkip = 0;

    logger.info("========================================");
    logger.info("HỆ THỐNG BẮT ĐẦU XỬ LÝ DỮ LIỆU");
    logger.info("========================================");

    //  Bắt đầu khối try...finally để quản lý kết nối DB
    try {
        // Khởi tạo kết nối TypeORM
        await initializeDatabase();
        // Load lịch sử trước khi chạy vòng lặp
        await Deduplicator.loadHistory();

        for await (const { tableName, data } of reader.readAll()) {
            // KIỂM TRA CHUYỂN FILE (Nếu tableName thay đổi so với vòng lặp trước)
            if (tableName !== currentTableName) {
                // Tổng kết file cũ (nếu không phải lần đầu tiên chạy)
                if (currentTableName !== "") {
                    printFileSummary(currentTableName, currentFileRecordIndex, currentFilePass, currentFileFail);
                }
                //Reset bộ đếm cho file mới
                currentTableName = tableName;
                currentFileRecordIndex = 0;
                currentFilePass = 0;
                currentFileFail = 0;
                currentFileSkip = 0;
                totalFilesProcessed++;

                // C. Log bắt đầu file mới
                logger.info(`\nĐang xử lý file: ${tableName}.csv`);
            }

            // Tăng đếm bản ghi
            currentFileRecordIndex++;
            logger.info(`\nXử lý bản ghi thứ ${currentFileRecordIndex}:`);

            // TẠO CONTEXT
            const context: PipelineContext = {
                tableName: tableName,
                fileName: `${tableName}.csv`,
                recordIndex: currentFileRecordIndex,
                rawData: data
            };

            // KÍCH HOẠT PIPELINE
            try {
                await parser.handle(context);

                // CẬP NHẬT THỐNG KÊ DỰA TRÊN KẾT QUẢ
                if (context.isValid) {
                    currentFilePass++;
                    globalPass++;
                } else {
                    currentFileFail++;
                    globalFail++;
                }
            } catch (err) {
                console.error(`Lỗi hệ thống nghiêm trọng tại dòng ${currentFileRecordIndex}:`, err);
            }
        }

        // LOG TỔNG KẾT FILE CUỐI CÙNG
        if (currentTableName !== "") {
            printFileSummary(currentTableName, currentFileRecordIndex, currentFilePass, currentFileFail);
        }

        logger.info("\n========================================");
        logger.info("TỔNG KẾT TOÀN BỘ QUÁ TRÌNH");
        logger.info(`- Đã xử lý: ${totalFilesProcessed} file`);
        logger.info(`- Tổng Pass: ${globalPass} record`);
        logger.info(`- Tổng Fail: ${globalFail} record`);
        logger.info("========================================");

    } catch (error) {
        logger.error("Lỗi không mong muốn trong quá trình xử lý chính:", error);
    } finally {
        // Đóng kết nối TypeORM khi xong
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
            logger.info("Đã đóng kết nối TypeORM.");
        }
    }
}

// Hàm phụ trợ in log tổng kết file
function printFileSummary(tableName: string, total: number, pass: number, fail: number) {
    logger.info(`------- KẾT QUẢ FILE ${tableName}.csv -------`);
    logger.info(`  • Tổng số bản ghi: ${total}`);
    logger.info(`  • Pass: ${pass}`);
    logger.info(`  • Fail: ${fail}`);
    logger.info(`------------------------------------------`);
}

main().catch(err => logger.error("Fatal Error:", err));