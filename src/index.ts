import 'reflect-metadata';
import path from 'path';
import './models'; 
import logger from './utils/logger';
import { CsvReader } from './utils/CsvReader';
import { ParseHandler, TransformationHandler, ValidationHandler, CsvSaveHandler, DeduplicationHandler, SqlSaveHandler } from './pipeline/ConcreteHandlers';
import { PipelineContext } from './pipeline/Handler';
import { Deduplicator } from './core/Deduplicator';
import { AppDataSource, initializeDatabase } from './config/database/typeormConfig';

async function main() {

    // 1. CẤU HÌNH PIPELINE
    const parser = new ParseHandler();
    const transformer = new TransformationHandler();
    const deduplicator = new DeduplicationHandler(); // Đã thêm Deduplicator vào chain
    const validator = new ValidationHandler();
    const saver = new CsvSaveHandler();
    const sqlSaver = new SqlSaveHandler();

    // Sắp xếp Chain of Responsibility:
    // Parse -> Transform -> Deduplicate -> Validate -> Save CSV -> Save SQL
    parser
        .setNext(transformer)
        .setNext(deduplicator) 
        .setNext(validator)
        .setNext(saver)
        .setNext(sqlSaver);

    // 2. KHỞI TẠO READER
    const csvDir = path.join(__dirname, '../resource/data_csv/staging');
    const reader = new CsvReader(csvDir);

    // --- BIẾN THỐNG KÊ TOÀN CỤC ---
    let totalFilesProcessed = 0;
    let globalTotalRecords = 0;
    let globalPass = 0;
    let globalFail = 0;
    // [NEW] Thêm biến thống kê
    let globalSkip = 0;     // Đếm số bản ghi trùng lặp
    let globalDbSaved = 0;  // Đếm số bản ghi vào DB thành công

    // --- BIẾN THEO DÕI FILE HIỆN TẠI ---
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
        await Deduplicator.loadHistory();

        for await (const { tableName, data } of reader.readAll()) {
            // CHUYỂN FILE: Tổng kết file cũ và reset biến
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

                logger.info(`\n📂 Đang xử lý file: ${tableName}.csv`);
            }

            currentFileRecordIndex++;
            globalTotalRecords++;
            logger.info(`\n--- Record ${currentFileRecordIndex} ---`);

            const context: PipelineContext = {
                tableName: tableName,
                fileName: `${tableName}.csv`,
                recordIndex: currentFileRecordIndex,
                rawData: data
            };

            try {
                // RUN PIPELINE
                await parser.handle(context);

                // --- [UPDATED] LOGIC THỐNG KÊ ---
                if (context.isSkipped) {
                    // Trường hợp bị Duplicate
                    currentFileSkip++;
                    globalSkip++;
                    // Skip thì coi như không Pass cũng không Fail validation (hoặc tùy định nghĩa của bạn)
                    // Ở đây ta tách riêng Skip ra khỏi Pass/Fail
                } else if (context.isValid) {
                    // Trường hợp Hợp lệ
                    currentFilePass++;
                    globalPass++;

                    // Kiểm tra xem có lưu vào DB thành công không
                    if (context.isSavedToDB) {
                        currentFileDbSaved++;
                        globalDbSaved++;
                    }
                } else {
                    // Trường hợp Lỗi Validation hoặc Lỗi SQL
                    currentFileFail++;
                    globalFail++;
                }

            } catch (err) {
                console.error(`Lỗi hệ thống nghiêm trọng tại dòng ${currentFileRecordIndex}:`, err);
            }
        }

        // Tổng kết file 
        if (currentTableName !== "") {
            printFileSummary(currentTableName, currentFileRecordIndex, currentFilePass, currentFileFail, currentFileSkip, currentFileDbSaved);
        }

        // --- IN LOG TỔNG KẾT TOÀN CỤC ---
        logger.info("\n========================================");
        logger.info("       TỔNG KẾT TOÀN BỘ QUÁ TRÌNH       ");
        logger.info("========================================");
        logger.info(`Số file đã xử lý : ${totalFilesProcessed}`);
        logger.info(`Tổng số bản ghi  : ${globalTotalRecords}`);
        logger.info(`Tổng Valid       : ${globalPass}`);
        logger.info(`Tổng Invalid     : ${globalFail}`);
        logger.info(`Tổng Skipped    : ${globalSkip} (Trùng lặp)`);
        logger.info(`Tổng record Đã Lưu DB  : ${globalDbSaved}`);
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

// [UPDATED] Hàm in log chi tiết file
function printFileSummary(tableName: string, total: number, pass: number, fail: number, skip: number, dbSaved: number) {
    logger.info(`\n------- KẾT QUẢ FILE: ${tableName} -------`);
    logger.info(`  • Tổng dòng : ${total}`);
    logger.info(`  • Valid     : ${pass}`);
    logger.info(`  • Invalid   : ${fail}`);
    logger.info(`  • Skipped   : ${skip} (Duplicate)`);
    logger.info(`  • Saved DB  : ${dbSaved}`);
    logger.info(`------------------------------------------\n`);
}

main().catch(err => logger.error("Fatal Error:", err));