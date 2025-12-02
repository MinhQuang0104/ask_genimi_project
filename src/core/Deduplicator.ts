import crypto from 'crypto';

export class Deduplicator {
    // Lưu trữ hash đã thấy: Map<TableName, Set<Hash>>
    private static storage: Map<string, Set<string>> = new Map();

    /**
     * Tạo mã Hash từ giá trị của các trường Unique
     */
    static generateHash(values: any[]): string {
        const data = values.map(v => String(v).trim().toLowerCase()).join('|');
        return crypto.createHash('md5').update(data).digest('hex');
    }

    /**
     * Kiểm tra và đánh dấu. Trả về true nếu là bản ghi mới (chưa trùng).
     */
    static checkAndMark(tableName: string, hash: string): boolean {
        if (!this.storage.has(tableName)) {
            this.storage.set(tableName, new Set());
        }

        const tableSet = this.storage.get(tableName)!;
        
        if (tableSet.has(hash)) {
            return false; // Đã tồn tại -> Trùng lặp
        }

        tableSet.add(hash);
        return true; // Mới
    }
    
    // Hàm để lấy thống kê (Optional)
    static getStats(tableName: string) {
        return this.storage.get(tableName)?.size || 0;
    }
}