import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import logger from './logger';

export class CsvReader {
    constructor(private folderPath: string) {}

    // Method cũ: Đọc tất cả file trong thư mục
    async *readAll(): AsyncGenerator<{ tableName: string, data: any }> {
        if (!fs.existsSync(this.folderPath)) {
            logger.error(`❌ Thư mục không tồn tại: ${this.folderPath}`);
            return;
        }

        const files = fs.readdirSync(this.folderPath).filter(f => f.endsWith('.csv'));
        logger.info(`📂 Tìm thấy ${files.length} file CSV trong ${this.folderPath}`);

        for (const file of files) {
            yield* this.streamFile(file);
        }
    }

    // Method mới: Đọc theo danh sách tên bảng được chỉ định
    async *readCustomList(tableNames: string[]): AsyncGenerator<{ tableName: string, data: any }> {
        if (!fs.existsSync(this.folderPath)) {
            logger.error(`❌ Thư mục không tồn tại: ${this.folderPath}`);
            return;
        }

        for (const tableName of tableNames) {
            const fileName = `${tableName}.csv`;
            const filePath = path.join(this.folderPath, fileName);

            // Kiểm tra file có tồn tại không
            if (!fs.existsSync(filePath)) {
                logger.warn(`⚠️ File không tồn tại, bỏ qua: ${fileName}`);
                continue;
            }

            yield* this.streamFile(fileName);
        }
    }

    // [HELPER] Tách logic đọc stream ra để tái sử dụng
    private async *streamFile(fileName: string): AsyncGenerator<{ tableName: string, data: any }> {
        const tableName = path.parse(fileName).name;
        const filePath = path.join(this.folderPath, fileName);

        logger.info(`\n--- 📖 Đang đọc file: ${fileName} ---`);

        const stream = fs.createReadStream(filePath)
            .pipe(parse({
                columns: true,
                trim: true,
                skip_empty_lines: true,
                bom: true,
                // [FIX] Thêm các option sau để tránh crash khi dữ liệu lỗi:
                relax_column_count: true,      // Cho phép số cột không khớp với header (không crash)
                skip_records_with_error: true  // Tự động bỏ qua các dòng lỗi format nghiêm trọng
            }));

        for await (const record of stream) {
            yield { tableName, data: record };
        }
    }
}