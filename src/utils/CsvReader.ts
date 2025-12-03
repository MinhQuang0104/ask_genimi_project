import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';

export class CsvReader {
    constructor(private folderPath: string) {}

    async *readAll(): AsyncGenerator<{ tableName: string, data: any }> {
        if (!fs.existsSync(this.folderPath)) {
            console.error(`❌ Thư mục không tồn tại: ${this.folderPath}`);
            return;
        }

        const files = fs.readdirSync(this.folderPath).filter(f => f.endsWith('.csv'));
        console.log(`📂 Tìm thấy ${files.length} file CSV trong ${this.folderPath}`);

        for (const file of files) {
            const tableName = path.parse(file).name;
            const filePath = path.join(this.folderPath, file);

            console.log(`\n--- 📖 Đang đọc file: ${file} ---`);
            
            const stream = fs.createReadStream(filePath)
                .pipe(parse({
                    columns: true, 
                    trim: true,    
                    skip_empty_lines: true,
                    bom: true,
                    // [FIX] Thêm dòng này để không bị crash khi số cột không khớp
                    relax_column_count: true, 
                    // (Optional) Cho phép bỏ qua các dòng lỗi thay vì throw error
                    skip_records_with_error: true 
                }));

            for await (const record of stream) {
                yield { tableName, data: record };
            }
        }
    }
}