import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';

export class CsvReader {
    constructor(private folderPath: string) {}

    async *readAll(): AsyncGenerator<{ tableName: string, data: any }> {
        // 1. Lấy danh sách file trong thư mục
        if (!fs.existsSync(this.folderPath)) {
            console.error(`❌ Thư mục không tồn tại: ${this.folderPath}`);
            return;
        }

        const files = fs.readdirSync(this.folderPath).filter(f => f.endsWith('.csv'));
        console.log(`📂 Tìm thấy ${files.length} file CSV trong ${this.folderPath}`);

        // 2. Lặp qua từng file
        for (const file of files) {
            const tableName = path.parse(file).name; // Lấy tên file làm tên bảng (VD: TaiKhoan.csv -> TaiKhoan)
            const filePath = path.join(this.folderPath, file);

            console.log(`\n--- 📖 Đang đọc file: ${file} ---`);
            
            // 3. Tạo Stream đọc file
            const stream = fs.createReadStream(filePath)
                .pipe(parse({
                    columns: true, // Tự động map header thành key object
                    trim: true,    // Xóa khoảng trắng thừa
                    skip_empty_lines: true,
                    bom: true      // Xử lý BOM character nếu có
                }));

            // 4. Yield từng dòng ra ngoài (cho vòng lặp for-await xử lý)
            for await (const record of stream) {
                yield { tableName, data: record };
            }
        }
    }
}