// src/core/services/MergeService.ts
import stringSimilarity from "string-similarity";
import logger from "../../utils/logger";

// [UPDATE] Cập nhật Interface để khớp với báo cáo chi tiết
export interface IMergeLog {
    TableName: string;
    Match_Type: "NEW" | "MERGED_EXACT" | "MERGED_FUZZY"; // Tên cũ: Status
    Similarity_Score: string;                            // Tên cũ: Score
    Unified_ID: string;                                  // Tên cũ: FinalID
    
    // Dữ liệu đầu vào (Incoming)
    Incoming_Source: string; // Tên cũ: Source
    Incoming_ID: string;     // Tên cũ: OriginalID
    Incoming_Name: string;   // Tên cũ: OriginalName
    
    // Dữ liệu gốc/neo (Anchor) - Cái mà nó match vào
    Anchor_Source: string;   
    Anchor_ID: string;
    Anchor_Name: string;     // Tên cũ: FinalName
}

export class MergeService {
    private static standardNames: Map<string, string[]> = new Map();
    private static idMap: Map<string, string> = new Map();
    public static mergeLogs: IMergeLog[] = []; // [UPDATE] Dùng mảng Log mới

    private static readonly THRESHOLD = 0.9;

    static processRecord(
        tableName: string,
        sourceName: string,
        oldId: string,
        rawName: string
    ): { newName: string; newId: string } {
        
        const normalizedName = rawName.trim();
        const lowerName = normalizedName.toLowerCase();

        if (!this.standardNames.has(tableName)) {
            this.standardNames.set(tableName, []);
        }
        const nameList = this.standardNames.get(tableName)!;

        let finalName = normalizedName;
        let matchFound = false;
        let status: "NEW" | "MERGED_EXACT" | "MERGED_FUZZY" = "NEW";
        let score = 0;

        // --- MATCHING ---
        const exactMatch = nameList.find(n => n.toLowerCase() === lowerName);
        
        if (exactMatch) {
            finalName = exactMatch;
            matchFound = true;
            status = "MERGED_EXACT";
            score = 1;
        } else if (nameList.length > 0) {
            const best = stringSimilarity.findBestMatch(normalizedName, nameList).bestMatch;
            if (best.rating >= this.THRESHOLD) {
                finalName = best.target;
                matchFound = true;
                status = "MERGED_FUZZY";
                score = best.rating;
            }
        }

        if (!matchFound) {
            nameList.push(normalizedName);
        }

        // --- ID MAPPING ---
        const unifiedKey = `${tableName}_NAME_${finalName.toLowerCase()}`;
        let unifiedId = this.idMap.get(unifiedKey);

        if (!unifiedId) {
            unifiedId = `${sourceName}_${oldId}`; 
            this.idMap.set(unifiedKey, unifiedId);
        }

        const specificKey = `${tableName}_${sourceName}_${oldId}`;
        this.idMap.set(specificKey, unifiedId);

        // --- GHI LOG (Cập nhật theo key mới) ---
        this.mergeLogs.push({
            TableName: tableName,
            Match_Type: status,
            Similarity_Score: (score * 100).toFixed(1) + "%",
            Unified_ID: unifiedId,

            Incoming_Source: sourceName,
            Incoming_ID: oldId,
            Incoming_Name: rawName,

            // Vì hiện tại ta chỉ lưu danh sách tên chuẩn (string[]) chứ chưa lưu object đầy đủ
            // nên tạm thời Anchor_Source và Anchor_ID để trống hoặc đánh dấu "STANDARD"
            Anchor_Source: matchFound ? "STANDARD_STORE" : "", 
            Anchor_ID: "", 
            Anchor_Name: finalName 
        });

        return { newName: finalName, newId: unifiedId };
    }

    static translateForeignKey(
        parentTable: string, sourceName: string, fkOldId: string
    ): string {
        const key = `${parentTable}_${sourceName}_${fkOldId}`;
        const unifiedId = this.idMap.get(key);
        return unifiedId || fkOldId;
    }

    static clear() {
        this.standardNames.clear();
        this.idMap.clear();
        this.mergeLogs = [];
    }
}