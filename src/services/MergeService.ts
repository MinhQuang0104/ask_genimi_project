// src/core/services/MergeService.ts
import stringSimilarity from "string-similarity";
import logger from "../utils/logger";

export class MergeService {
    // 1. Kho chứa tên chuẩn: Map<TenBang, List<TenChuan>>
    private static standardNames: Map<string, string[]> = new Map();

    // 2. Kho chứa bản đồ ID: Map<Key, UnifiedID>
    // Key format: "TableName_SourceName_OldID" (VD: "LoaiHang_SOURCE1_1")
    // Value: UnifiedID (ID mới thống nhất)
    private static idMap: Map<string, string> = new Map();

    // Ngưỡng giống nhau (85%)
    private static readonly THRESHOLD = 0.85;

    /**
     * Xử lý chính: Chuẩn hóa Tên + Đăng ký ID mới
     */
    static processRecord(
        tableName: string,   // Tên bảng chung (VD: SanPham)
        sourceName: string,  // Nguồn (VD: SOURCE1)
        oldId: string,       // ID trong CSV (VD: "1")
        rawName: string      // Tên trong CSV (VD: "Samsung VN")
    ): { newName: string; newId: string } {
        
        const normalizedName = rawName.trim();
        const lowerName = normalizedName.toLowerCase();

        // --- A. XỬ LÝ TÊN (FUZZY MATCHING) ---
        if (!this.standardNames.has(tableName)) {
            this.standardNames.set(tableName, []);
        }
        const nameList = this.standardNames.get(tableName)!;

        let finalName = normalizedName;
        let matchFound = false;

        // 1. Check chính xác
        const exactMatch = nameList.find(n => n.toLowerCase() === lowerName);
        if (exactMatch) {
            finalName = exactMatch;
            matchFound = true;
        } 
        // 2. Check mờ (Fuzzy)
        else if (nameList.length > 0) {
            const best = stringSimilarity.findBestMatch(normalizedName, nameList).bestMatch;
            if (best.rating >= this.THRESHOLD) {
                finalName = best.target; // Dùng tên chuẩn cũ
                matchFound = true;
                // logger.info(`[Merge] Gộp '${normalizedName}' -> '${finalName}' (${(best.rating*100).toFixed(0)}%)`);
            }
        }

        // Nếu là tên mới toanh, lưu vào kho
        if (!matchFound) {
            nameList.push(normalizedName);
        }

        // --- B. XỬ LÝ ID (ID MAPPING) ---
        // Logic: 
        // - Nếu Source 1 (Master): Luôn tạo ID mới dựa trên ID gốc (hoặc giữ nguyên).
        // - Nếu Source 2 (Slave): 
        //   + Nếu tên TRÙNG với Source 1 -> Lấy ID của thằng Source 1.
        //   + Nếu tên MỚI -> Tạo ID mới.
        
        // Để đơn giản cho người mới: Chúng ta tạo Key map dựa trên TÊN CHUẨN (finalName).
        // Bất kỳ ai có tên giống nhau -> Sẽ có ID giống nhau.
        
        const unifiedKey = `${tableName}_NAME_${finalName.toLowerCase()}`;
        let unifiedId = this.idMap.get(unifiedKey);

        if (!unifiedId) {
            // Nếu chưa có ID cho cái tên này, ta lấy luôn OldID của bản ghi đầu tiên làm chuẩn
            // Hoặc tạo UUID. Ở đây tôi dùng prefix Source để tránh trùng lặp ngẫu nhiên
            unifiedId = `${sourceName}_${oldId}`; 
            this.idMap.set(unifiedKey, unifiedId);
        }

        // Lưu map để dùng cho khóa ngoại: "LoaiHang_SOURCE2_5" -> "SOURCE1_1"
        const specificKey = `${tableName}_${sourceName}_${oldId}`;
        this.idMap.set(specificKey, unifiedId);

        return { newName: finalName, newId: unifiedId };
    }

    /**
     * Dịch Khóa Ngoại: Đưa vào ID cũ (của bảng cha) -> Trả về ID mới (đã thống nhất)
     */
    static translateForeignKey(
        parentTable: string, // Bảng cha (VD: LoaiHang)
        sourceName: string,  // Nguồn hiện tại (VD: SOURCE2)
        fkOldId: string      // ID khóa ngoại cũ (VD: "5")
    ): string {
        const key = `${parentTable}_${sourceName}_${fkOldId}`;
        const unifiedId = this.idMap.get(key);
        
        if (!unifiedId) {
            // Trường hợp nguy hiểm: Không tìm thấy cha!
            // Có thể do bảng cha chưa chạy, hoặc dữ liệu lỗi.
            // Fallback: Giữ nguyên ID cũ để không crash, nhưng log cảnh báo.
            // logger.warn(`[FK Missing] Không tìm thấy cha ${parentTable} cho ID ${fkOldId} từ ${sourceName}`);
            return fkOldId;
        }
        return unifiedId;
    }

    static clear() {
        this.standardNames.clear();
        this.idMap.clear();
    }
}