import stringSimilarity from "string-similarity";

// 1. Cập nhật Interface Log chi tiết
export interface IMergeLog {
    TargetModel: string; // Tên bảng đích (DB3)
    
    // Thông tin bên SOURCE 1 (Gốc/Anchor)
    Anchor_Source: string;
    Anchor_RefTable: string; // Tên bảng gốc của Anchor (VD: SanPham)
    Anchor_ID: string;     
    Anchor_Name: string;   

    // Thông tin bên SOURCE 2 (Bản ghi đang xử lý)
    Incoming_Source: string;
    Incoming_RefTable: string; // Tên bảng gốc của dòng mới (VD: MatHang)
    Incoming_ID: string;     
    Incoming_Name: string;   

    // Kết quả
    Unified_ID: string;      
    Match_Type: "NEW" | "EXACT" | "FUZZY";
    Similarity_Score: string; 
}

// Cấu trúc lưu trong RAM để nhớ "Ai là người tạo ra tên chuẩn này"
interface INameMetadata {
    standardName: string;
    originalId: string;
    sourceName: string;
    refTableName: string; // Lưu tên bảng gốc vào bộ nhớ
}

export class MergeService {
    // Map<TargetModel, Map<NormalizedName, Metadata>>
    private static cache: Map<string, Map<string, INameMetadata>> = new Map();
    
    // Map ID Mapping
    private static idMap: Map<string, string> = new Map();
    
    // Log Report
    public static mergeLogs: IMergeLog[] = []; 

    // Ngưỡng giống nhau (Bạn có thể tăng lên 0.90 hoặc 0.95 nếu thấy gộp nhầm nhiều)
    private static readonly THRESHOLD = 0.85;

    static processRecord(
        targetModel: string,
        sourceName: string,
        refTableName: string, // Tham số nhận tên bảng gốc (VD: MatHang)
        incomingId: string,
        rawName: string
    ): { newName: string; newId: string } {
        
        const normalizedInput = rawName.trim();
        const lowerInput = normalizedInput.toLowerCase();

        // Khởi tạo cache cho bảng nếu chưa có
        if (!this.cache.has(targetModel)) {
            this.cache.set(targetModel, new Map());
        }
        const tableCache = this.cache.get(targetModel)!;

        // Biến lưu kết quả
        let finalName = normalizedInput;
        let matchType: "NEW" | "EXACT" | "FUZZY" = "NEW";
        let matchScore = 0;
        
        // Biến lưu thông tin bản ghi gốc (Anchor) để tracking
        let anchorMeta: INameMetadata | null = null;

        // --- 1. SO KHỚP CHÍNH XÁC (EXACT MATCH) ---
        if (tableCache.has(lowerInput)) {
            anchorMeta = tableCache.get(lowerInput)!;
            finalName = anchorMeta.standardName;
            matchType = "EXACT";
            matchScore = 1;
        } 
        // --- 2. SO KHỚP MỜ (FUZZY MATCH) ---
        else if (tableCache.size > 0) {
            const existingNames = Array.from(tableCache.keys());
            const best = stringSimilarity.findBestMatch(lowerInput, existingNames).bestMatch;

            if (best.rating >= this.THRESHOLD) {
                // Tìm thấy tên gần giống -> Lấy metadata của nó
                anchorMeta = tableCache.get(best.target)!;
                finalName = anchorMeta.standardName;
                matchType = "FUZZY";
                matchScore = best.rating;
            }
        }

        // --- 3. XỬ LÝ KẾT QUẢ ---
        if (matchType === "NEW") {
            // Nếu là mới -> Đóng vai trò là Anchor cho các bản ghi sau
            const newMeta: INameMetadata = {
                standardName: normalizedInput,
                originalId: incomingId,
                sourceName: sourceName,
                refTableName: refTableName
            };
            tableCache.set(lowerInput, newMeta);
            anchorMeta = newMeta;
        }

        // --- 4. TẠO ID THỐNG NHẤT (ID MAPPING) ---
        const unifiedKey = `${targetModel}_UID_${finalName.toLowerCase()}`;
        let unifiedId = this.idMap.get(unifiedKey);

        if (!unifiedId) {
            // Tạo ID mới dựa trên Anchor
            unifiedId = `${anchorMeta!.sourceName}_${anchorMeta!.originalId}`;
            this.idMap.set(unifiedKey, unifiedId);
        }

        // Lưu mapping cho bản ghi hiện tại để dùng cho khóa ngoại sau này
        const specificKey = `${targetModel}_${sourceName}_${incomingId}`;
        this.idMap.set(specificKey, unifiedId);

        // --- 5. GHI LOG REPORT CHI TIẾT ---
        this.mergeLogs.push({
            TargetModel: targetModel,
            
            Anchor_Source: anchorMeta ? anchorMeta.sourceName : "N/A",
            Anchor_RefTable: anchorMeta ? anchorMeta.refTableName : "N/A",
            Anchor_ID: anchorMeta ? anchorMeta.originalId : "N/A",
            Anchor_Name: anchorMeta ? anchorMeta.standardName : "N/A",

            Incoming_Source: sourceName,
            Incoming_RefTable: refTableName,
            Incoming_ID: incomingId,
            Incoming_Name: rawName,

            Unified_ID: unifiedId,
            Match_Type: matchType,
            Similarity_Score: (matchScore * 100).toFixed(1) + "%"
        });

        return { newName: finalName, newId: unifiedId };
    }

    static translateForeignKey(parentTable: string, sourceName: string, fkOldId: string): string {
        const key = `${parentTable}_${sourceName}_${fkOldId}`;
        return this.idMap.get(key) || fkOldId;
    }

    static clear() {
        this.cache.clear();
        this.idMap.clear();
        this.mergeLogs = [];
    }
}