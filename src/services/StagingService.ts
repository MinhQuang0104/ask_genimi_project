// src/services/StagingService.ts
import * as fs from 'fs';
import * as path from 'path';
import { MergedProduct, IdMapping, EntityType, WebProduct, KhoProduct } from '../models';

const STAGING_DIR = path.join(__dirname, '../../staging');

// Đảm bảo thư mục staging tồn tại
if (!fs.existsSync(STAGING_DIR)) fs.mkdirSync(STAGING_DIR);

export class StagingService {
    private mappingFile = path.join(STAGING_DIR, 'IdMapping.json');

    constructor() {
        // Khởi tạo các file staging nếu chưa có (ví dụ: SanPham.json)
        this.ensureStagingFile('SanPham.json', '[]');
        this.ensureStagingFile('LoaiHang.json', '[]');
        this.ensureStagingFile('IdMapping.json', '[]');
        this.ensureStagingFile('Log.txt', '');
    }

    private ensureStagingFile(fileName: string, defaultContent: string) {
        const filePath = path.join(STAGING_DIR, fileName);
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, defaultContent);
        }
    }

    // Ghi Log chi tiết
    log(message: string, isError: boolean = false) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${isError ? 'ERROR' : 'INFO'}] ${message}\n`;
        fs.appendFileSync(path.join(STAGING_DIR, 'Log.txt'), logMessage);
        console.log(logMessage.trim());
    }

    // Đọc/Ghi dữ liệu Merged (Giả lập truy vấn DB3)
    readStagingFile<T>(fileName: string): T[] {
        const filePath = path.join(STAGING_DIR, fileName);
        return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T[];
    }

    writeStagingFile<T>(fileName: string, data: T[]) {
        const filePath = path.join(STAGING_DIR, fileName);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    }

    // Quản lý ID Mapping
    saveIdMapping(mapping: IdMapping) {
        const mappings = this.readStagingFile<IdMapping>('IdMapping.json');
        mappings.push(mapping);
        this.writeStagingFile('IdMapping.json', mappings);
    }
}