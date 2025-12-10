import stringSimilarity from "string-similarity";

// 1. Cấu trúc Log chi tiết
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

// Cấu trúc lưu trong RAM
interface INameMetadata {
    standardName: string;
    originalId: string;
    sourceName: string;
    refTableName: string;
}

export class MergeService {
    private static cache: Map<string, Map<string, INameMetadata>> = new Map();
    private static idMap: Map<string, string> = new Map();
    public static mergeLogs: IMergeLog[] = []; 

    private static readonly THRESHOLD = 0.9;

    // [QUAN TRỌNG] Hàm này có 5 tham số
    static processRecord(
        targetModel: string,   // 1. Model đích (VD: SanPham)
        sourceName: string,    // 2. Nguồn (VD: SOURCE1)
        refTableName: string,  // 3. [MỚI] Tên bảng gốc (VD: MatHang)
        incomingId: string,    // 4. ID gốc
        rawName: string        // 5. Tên gốc
    ): { newName: string; newId: string } {
        
        const normalizedInput = rawName.trim();
        const lowerInput = normalizedInput.toLowerCase();

        if (!this.cache.has(targetModel)) {
            this.cache.set(targetModel, new Map());
        }
        const tableCache = this.cache.get(targetModel)!;

        let finalName = normalizedInput;
        let matchType: "NEW" | "EXACT" | "FUZZY" = "NEW";
        let matchScore = 0;
        let anchorMeta: INameMetadata | null = null;

        // 1. Check Chính xác
        if (tableCache.has(lowerInput)) {
            anchorMeta = tableCache.get(lowerInput)!;
            finalName = anchorMeta.standardName;
            matchType = "EXACT";
            matchScore = 1;
        } 
        // 2. Check Mờ (Fuzzy)
        else if (tableCache.size > 0) {
            const existingNames = Array.from(tableCache.keys());
            const best = stringSimilarity.findBestMatch(lowerInput, existingNames).bestMatch;

            if (best.rating >= this.THRESHOLD) {
                anchorMeta = tableCache.get(best.target)!;
                finalName = anchorMeta.standardName;
                matchType = "FUZZY";
                matchScore = best.rating;
            }
        }

        // 3. Xử lý logic ID và Cache
        if (matchType === "NEW") {
            const newMeta: INameMetadata = {
                standardName: normalizedInput,
                originalId: incomingId,
                sourceName: sourceName,
                refTableName: refTableName // Lưu lại tên bảng gốc
            };
            tableCache.set(lowerInput, newMeta);
            anchorMeta = newMeta;
        }

        const unifiedKey = `${targetModel}_UID_${finalName.toLowerCase()}`;
        let unifiedId = this.idMap.get(unifiedKey);

        if (!unifiedId) {
            unifiedId = `${anchorMeta!.sourceName}_${anchorMeta!.originalId}`;
            this.idMap.set(unifiedKey, unifiedId);
        }
        
        const specificKey = `${targetModel}_${sourceName}_${incomingId}`;
        this.idMap.set(specificKey, unifiedId);

        // 4. Ghi Log
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