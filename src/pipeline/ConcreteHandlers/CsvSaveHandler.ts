import * as fs from 'fs';
import * as path from 'path';
// Thêm chữ /sync vào cuối đường dẫn import
import { stringify } from 'csv-stringify/sync';
import { Handler, PipelineContext } from '../Handler';
import logger from "../../utils/logger";

// Định nghĩa thư mục output
const OUTPUT_DIR = path.join(__dirname, '../../../resource/data_csv/quality_data');
const PASSED_DIR = path.join(OUTPUT_DIR, 'passed');
const FAILED_DIR = path.join(OUTPUT_DIR, 'failed');

// Tạo thư mục nếu chưa có
[PASSED_DIR, FAILED_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

export class CsvSaveHandler extends Handler {
    
    async handle(context: PipelineContext): Promise<void> {
        const { tableName, entity, isValid, errors, rawData } = context;

        // 1. Xác định file đích và dữ liệu cần ghi
        let targetDir = '';
        let targetFile = '';
        let dataToSave: any = {};

        if (isValid) {
            // CASE: Hợp lệ -> Lưu vào folder passed
            targetDir = PASSED_DIR;
            targetFile = path.join(targetDir, `${tableName}_passed.csv`);
            
            // Lưu Entity đã được Transform sạch đẹp
            dataToSave = entity;
        } else {
            // CASE: Lỗi -> Lưu vào folder failed
            targetDir = FAILED_DIR;
            targetFile = path.join(targetDir, `${tableName}_failed.csv`);
            
            // Lưu Raw Data gốc + Cột Error
            dataToSave = { 
                ...rawData, 
                Error_Message: errors ? errors.join('; ') : 'Unknown Error' 
            };
        }

        // 2. Xử lý Header (Nếu file chưa tồn tại thì phải ghi header trước)
        const fileExists = fs.existsSync(targetFile);
        
        try {
            // Chuyển Object thành CSV string
            const csvRow = stringify([dataToSave], {
                header: !fileExists, // Chỉ ghi header nếu file mới tạo
                columns: Object.keys(dataToSave) // Tự động lấy tên cột từ object
            });

            // 3. Ghi nối (Append) vào file
            fs.appendFileSync(targetFile, csvRow);

            // Log nhẹ (chỉ log khi lỗi hoặc debug, tránh spam logger)
            if (!isValid) {
                logger.info(`[Save] ❌ Đã ghi nhận lỗi vào ${tableName}_failed.csv`);
            }

        } catch (err) {
            logger.error(`[Save] 💥 Lỗi khi ghi file ${tableName}:`, err);
        }

        // Tiếp tục chuỗi (nếu có handler phía sau, ví dụ: gửi thông báo)
        await super.handle(context);
    }
}