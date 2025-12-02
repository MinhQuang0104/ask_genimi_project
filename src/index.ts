import path from 'path';
import './models';
import logger from './utils/logger'
import { CsvReader } from './utils/CsvReader';
import { ParseHandler, TransformationHandler , ValidationHandler,  CsvSaveHandler} from './pipeline/ConcreteHandlers';
import { PipelineContext } from './pipeline/Handler';

async function main() {
// 1. CẤU HÌNH PIPELINE (Giữ nguyên logic COR)
    const parser = new ParseHandler();
    const transformer = new TransformationHandler();
    const validator = new ValidationHandler();
    const saver = new CsvSaveHandler();
    // Thiết lập chuỗi: Parse -> Validate -> Save
    parser
        .setNext(transformer)
        .setNext(validator)
        .setNext(saver);

    // 2. KHỞI TẠO READER
    const csvDir = path.join(__dirname, '../resource/data_csv/staging')
    const reader = new CsvReader(csvDir);

    logger.info("========================================");
    logger.info("HỆ THỐNG BẮT ĐẦU XỬ LÝ DỮ LIỆU");
    logger.info("========================================");
    // 3. VÒNG LẶP CHÍNH (Đọc -> Xử lý)
    let count = 0;
    for await (const { tableName, data } of reader.readAll()) {
        count++;
        // Tạo Context cho từng dòng
        const context: PipelineContext = {
            tableName: tableName, // VD: "TaiKhoan"
            rawData: data         // VD: { MaTK: "...", ... }
        };
        // Kích hoạt Pipeline
        try {
            await parser.handle(context);
        } catch (err) {
            console.error(`Lỗi hệ thống tại dòng ${count}:`, err);
        }
    }

    console.log(`\nHOÀN TẤT! Đã xử lý tổng cộng ${count} bản ghi.`);
}

main();