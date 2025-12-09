import fs from 'fs';
import path from 'path';
import logger from '../../utils/logger';

// Nơi lưu trữ file state (Map ID cũ -> mới) để phục hồi khi restart
const ROOT_DIR = path.resolve(__dirname, "../../../");
const STATE_DIR = path.join(ROOT_DIR, "resource", "data_state");
const ID_MAP_FILE = path.join(STATE_DIR, "id_map.json");
const MAX_ID_FILE = path.join(STATE_DIR, "max_ids.json");

export class IdRegistry {
    private static idMap: Map<string, number> = new Map();
    private static maxIds: Map<string, number> = new Map();
    private static isInitialized = false;

    // Cần gọi hàm này 1 lần khi start ứng dụng (trong receive.ts hoặc index.ts)
    static init() {
        if (this.isInitialized) return;

        if (!fs.existsSync(STATE_DIR)) {
            fs.mkdirSync(STATE_DIR, { recursive: true });
        }

        // Load ID Map
        if (fs.existsSync(ID_MAP_FILE)) {
            try {
                const rawData = fs.readFileSync(ID_MAP_FILE, 'utf-8');
                // Convert JSON array [key, value] back to Map
                this.idMap = new Map(JSON.parse(rawData));
                logger.info(`[IdRegistry] Đã load ${this.idMap.size} mapping ID từ lịch sử.`);
            } catch (err) {
                logger.error(`[IdRegistry] Lỗi đọc file id_map.json:`, err);
            }
        }

        // Load Max IDs
        if (fs.existsSync(MAX_ID_FILE)) {
            try {
                const rawData = fs.readFileSync(MAX_ID_FILE, 'utf-8');
                this.maxIds = new Map(JSON.parse(rawData));
            } catch (err) {
                logger.error(`[IdRegistry] Lỗi đọc file max_ids.json:`, err);
            }
        }

        this.isInitialized = true;
    }

    /**
     * Lưu trạng thái hiện tại xuống ổ cứng (Snapshot)
     * Nên gọi định kỳ hoặc khi kết thúc process
     */
    static saveState() {
        try {
            // Serialize Map to JSON Array
            fs.writeFileSync(ID_MAP_FILE, JSON.stringify(Array.from(this.idMap.entries()), null, 2));
            fs.writeFileSync(MAX_ID_FILE, JSON.stringify(Array.from(this.maxIds.entries()), null, 2));
            // logger.info("[IdRegistry] Đã lưu state thành công.");
        } catch (err) {
            logger.error(`[IdRegistry] Lỗi lưu state:`, err);
        }
    }

    /**
     * Lấy ID mới cho một bản ghi.
     * - Nếu đã có trong map -> Trả về ID cũ.
     * - Nếu chưa có -> Tăng MaxID, lưu Map, trả về ID mới.
     */
    static getOrGenerateId(targetTable: string, sourceName: string, oldId: string | number): number {
        // Đảm bảo đã init
        if (!this.isInitialized) this.init();

        const key = this.getKey(targetTable, sourceName, oldId);
        
        // 1. Kiểm tra xem ID này đã được map chưa
        if (this.idMap.has(key)) {
            return this.idMap.get(key)!;
        }

        // 2. Nếu chưa, sinh ID mới
        if (!this.maxIds.has(targetTable)) {
            this.maxIds.set(targetTable, 0); 
        }

        const currentMax = this.maxIds.get(targetTable)!;
        const newId = currentMax + 1;
        
        // 3. Cập nhật state
        this.maxIds.set(targetTable, newId);
        this.idMap.set(key, newId);

        return newId;
    }

    /**
     * [QUAN TRỌNG] Thiết lập mapping thủ công.
     * Dùng khi Fuzzy Matching phát hiện bản ghi trùng lặp:
     * Ta không sinh ID mới, mà ép ID cũ của Source trỏ về ID đã tồn tại trong Staging.
     */
    static setMapping(targetTable: string, sourceName: string, oldId: string | number, newId: number) {
        if (!this.isInitialized) this.init();

        const key = this.getKey(targetTable, sourceName, oldId);
        
        if (this.idMap.has(key)) {
            const existingId = this.idMap.get(key);
            if (existingId !== newId) {
                logger.warn(`[IdRegistry] Ghi đè Map cho ${key}: ${existingId} -> ${newId}`);
            }
        }

        this.idMap.set(key, newId);
    }

    /**
     * Tra cứu ID mới từ ID cũ (Dùng để remap Foreign Key).
     * Ví dụ: Trong bảng SanPham có MaLoaiHang=5 (của Source1).
     * Gọi lookupId('LoaiHang', 'SOURCE1', 5) -> Trả về 15 (ID mới).
     */
    static lookupId(targetTable: string, sourceName: string, oldId: string | number): number | null {
        if (!this.isInitialized) this.init();
        
        const key = this.getKey(targetTable, sourceName, oldId);
        return this.idMap.get(key) || null;
    }

    /**
     * Xóa sạch dữ liệu (Dùng khi muốn chạy lại từ đầu)
     */
    static reset() {
        this.idMap.clear();
        this.maxIds.clear();
        if (fs.existsSync(ID_MAP_FILE)) fs.unlinkSync(ID_MAP_FILE);
        if (fs.existsSync(MAX_ID_FILE)) fs.unlinkSync(MAX_ID_FILE);
        this.isInitialized = false;
        logger.info("[IdRegistry] Đã Reset toàn bộ ID Map.");
    }

    private static getKey(table: string, source: string, id: string | number): string {
        // Chuẩn hóa ID về string để tránh lỗi type
        return `${table}_${source}_${String(id).trim()}`;
    }
}