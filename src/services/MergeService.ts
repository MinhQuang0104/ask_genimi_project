// src/core/services/MergeService.ts
import stringSimilarity from "string-similarity";
import logger from "../utils/logger";

// 1. Định nghĩa cấu trúc dòng Log (Thêm mới)
export interface IMergeLog {
    TableName: string;
    Source: string;
    OriginalID: string;
    OriginalName: string;
    FinalName: string;
    FinalID: string;
    Status: "NEW" | "MERGED_EXACT" | "MERGED_FUZZY";
    Score: string; // Lưu dạng string cho dễ đọc (VD: "100%", "92%")
}

export class MergeService {
    // Kho chứa tên chuẩn: Map<TenBang, List<TenChuan>>
    private static standardNames: Map<string, string[]> = new Map();

    // Kho chứa bản đồ ID: Map<Key, UnifiedID>
    private static idMap: Map<string, string> = new Map();

    // 2. Thêm biến chứa Log để theo dõi quá trình gộp
    public static mergeLogs: IMergeLog[] = [];

    // Ngưỡng giống nhau (85%)
    private static readonly THRESHOLD = 0.85;

    /**
     * Xử lý chính: Chuẩn hóa Tên + Đăng ký ID mới + Ghi Log
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
        
        // Biến theo dõi trạng thái gộp để ghi log
        let status: "NEW" | "MERGED_EXACT" | "MERGED_FUZZY" = "NEW";
        let score = 0;

        // 1. Check chính xác
        const exactMatch = nameList.find(n => n.toLowerCase() === lowerName);
        
        if (exactMatch) {
            finalName = exactMatch;
            matchFound = true;
            status = "MERGED_EXACT";
            score = 1; // 100%
        } 
        // 2. Check mờ (Fuzzy)
        else if (nameList.length > 0) {
            const best = stringSimilarity.findBestMatch(normalizedName, nameList).bestMatch;
            if (best.rating >= this.THRESHOLD) {
                finalName = best.target; // Dùng tên chuẩn cũ
                matchFound = true;
                status = "MERGED_FUZZY";
                score = best.rating;
            }
        }

        // Nếu là tên mới toanh, lưu vào kho
        if (!matchFound) {
            nameList.push(normalizedName);
        }

        // --- B. XỬ LÝ ID (ID MAPPING) ---
        const unifiedKey = `${tableName}_NAME_${finalName.toLowerCase()}`;
        let unifiedId = this.idMap.get(unifiedKey);

        if (!unifiedId) {
            // Nếu chưa có ID cho tên này, tạo ID mới dựa trên Source và OldID
            unifiedId = `${sourceName}_${oldId}`; 
            this.idMap.set(unifiedKey, unifiedId);
        }

        // Lưu map để dùng cho khóa ngoại: "LoaiHang_SOURCE2_5" -> "SOURCE1_1"
        const specificKey = `${tableName}_${sourceName}_${oldId}`;
        this.idMap.set(specificKey, unifiedId);

        // --- C. GHI LOG (Thêm mới) ---
        this.mergeLogs.push({
            TableName: tableName,
            Source: sourceName,
            OriginalID: oldId,
            OriginalName: rawName,
            FinalName: finalName,
            FinalID: unifiedId,
            Status: status,
            Score: (score * 100).toFixed(1) + "%"
        });

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
        
        // Nếu không tìm thấy (UnifiedID là undefined), trả về fkOldId ban đầu (fallback)
        return unifiedId || fkOldId;
    }

    static clear() {
        this.standardNames.clear();
        this.idMap.clear();
        this.mergeLogs = []; // Reset log
    }
}