import stringSimilarity from "string-similarity";

// 1. Cấu trúc Log chi tiết hơn cho việc Tracking
export interface IMergeLog {
    TableName: string;
    
    // Thông tin bên SOURCE 1 (Gốc/Anchor)
    Anchor_Source: string; // VD: SOURCE1
    Anchor_ID: string;     // VD: 101 (ID của bản ghi gốc dùng để so sánh)
    Anchor_Name: string;   // VD: "Samsung Vina"

    // Thông tin bên SOURCE 2 (Bản ghi đang xử lý)
    Incoming_Source: string; // VD: SOURCE2
    Incoming_ID: string;     // VD: 555
    Incoming_Name: string;   // VD: "Cty Sam sung"

    // Kết quả gộp
    Unified_ID: string;      // ID cuối cùng (VD: SOURCE1_101)
    Match_Type: "NEW" | "EXACT" | "FUZZY";
    Similarity_Score: string; // VD: "92.5%"
}

// Cấu trúc lưu trong RAM để nhớ "Ai là người tạo ra tên chuẩn này"
interface INameMetadata {
    standardName: string;
    originalId: string;
    sourceName: string;
}

export class MergeService {
    // Map<TableName, Map<NormalizedName, Metadata>>
    // Thay vì chỉ lưu mảng tên, ta lưu Map để tra cứu ngược lại ID gốc
    private static cache: Map<string, Map<string, INameMetadata>> = new Map();
    
    // Map ID Mapping (Giữ nguyên)
    private static idMap: Map<string, string> = new Map();
    
    // Log Report
    public static mergeLogs: IMergeLog[] = []; 

    private static readonly THRESHOLD = 0.9;

    static processRecord(
        tableName: string,
        sourceName: string,
        incomingId: string,
        rawName: string
    ): { newName: string; newId: string } {
        
        const normalizedInput = rawName.trim();
        const lowerInput = normalizedInput.toLowerCase();

        // Khởi tạo cache cho bảng nếu chưa có
        if (!this.cache.has(tableName)) {
            this.cache.set(tableName, new Map());
        }
        const tableCache = this.cache.get(tableName)!;

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
            // Lấy danh sách các tên đã có trong cache để so sánh
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
                sourceName: sourceName
            };
            // Lưu vào cache
            tableCache.set(lowerInput, newMeta);
            anchorMeta = newMeta;
        }

        // --- 4. TẠO ID THỐNG NHẤT (ID MAPPING) ---
        // Logic: ID thống nhất luôn dựa trên ID của thằng Anchor (Người đến trước)
        const unifiedKey = `${tableName}_UID_${finalName.toLowerCase()}`;
        let unifiedId = this.idMap.get(unifiedKey);

        if (!unifiedId) {
            // Tạo ID mới dựa trên Anchor
            unifiedId = `${anchorMeta!.sourceName}_${anchorMeta!.originalId}`;
            this.idMap.set(unifiedKey, unifiedId);
        }

        // Lưu mapping cho bản ghi hiện tại để dùng cho khóa ngoại sau này
        const specificKey = `${tableName}_${sourceName}_${incomingId}`;
        this.idMap.set(specificKey, unifiedId);

        // --- 5. GHI LOG REPORT CHI TIẾT ---
        // Chỉ ghi log nếu đây là bản ghi đến sau (để thấy sự so sánh), hoặc ghi tất cả tùy bạn.
        // Ở đây tôi ghi tất cả để bạn dễ debug.
        this.mergeLogs.push({
            TableName: tableName,
            
            // Thông tin bản ghi gốc mà nó khớp (Nếu là NEW thì chính là nó)
            Anchor_Source: anchorMeta ? anchorMeta.sourceName : "N/A",
            Anchor_ID: anchorMeta ? anchorMeta.originalId : "N/A",
            Anchor_Name: anchorMeta ? anchorMeta.standardName : "N/A",

            // Thông tin bản ghi đang xử lý
            Incoming_Source: sourceName,
            Incoming_ID: incomingId,
            Incoming_Name: rawName,

            // Kết quả
            Unified_ID: unifiedId,
            Match_Type: matchType,
            Similarity_Score: (matchScore * 100).toFixed(1) + "%"
        });

        return { newName: finalName, newId: unifiedId };
    }

    // (Giữ nguyên hàm translateForeignKey và clear)
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