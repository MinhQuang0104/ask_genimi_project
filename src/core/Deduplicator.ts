import crypto from "crypto";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { EntityFactory } from "./EntityFactory";
import { UNIQUE_METADATA_KEY } from "./decorators/Unique";
import 'reflect-metadata';

export class Deduplicator {
  private static storage: Map<string, Set<string>> = new Map();

  static async loadHistory() {
    const OUTPUT_DIR = path.join(
      __dirname,
      "../../resource/data_csv/quality_data/passed"
    );
    
    if (!fs.existsSync(OUTPUT_DIR)) return;

    const files = fs.readdirSync(OUTPUT_DIR);
    console.log("🔄 Đang tải lịch sử dữ liệu cũ...");

    for (const file of files) {
      if (file.endsWith("_passed.csv")) {
        const tableName = file.replace("_passed.csv", "");
        
        const modelCtor = EntityFactory.getClass(tableName);
        if (!modelCtor) continue;

        const uniqueKeys: string[] = Reflect.getMetadata(UNIQUE_METADATA_KEY, modelCtor.prototype);
        
        if (!uniqueKeys || uniqueKeys.length === 0) continue;

        try {
            const content = fs.readFileSync(path.join(OUTPUT_DIR, file), 'utf8');
            
            // [FIX] Ép kiểu kết quả trả về thành mảng các Object (any[])
            const records = parse(content, { 
                columns: true, 
                skip_empty_lines: true, 
                bom: true 
            }) as any[]; 

            let count = 0;
            for (const record of records) {
                // Bây giờ 'record' có kiểu là 'any', bạn có thể truy cập record[k] thoải mái
                const keyValues = uniqueKeys.map(k => record[k]);
                
                const hash = this.generateHash(keyValues);
                this.forceMark(tableName, hash);
                count++;
            }
            console.log(`   -> Đã khôi phục ${count} bản ghi từ ${file}`);
        } catch (err) {
            console.warn(`   -> Lỗi đọc file ${file}:`, err);
        }
      }
    }
    console.log("✅ Hoàn tất tải lịch sử.\n");
  }

  // ... (Các phần code còn lại giữ nguyên) ...

  private static forceMark(tableName: string, hash: string) {
      if (!this.storage.has(tableName)) {
          this.storage.set(tableName, new Set());
      }
      this.storage.get(tableName)!.add(hash);
  }

  static generateHash(values: any[]): string {
    const data = values.map((v) => String(v).trim().toLowerCase()).join("|");
    return crypto.createHash("md5").update(data).digest("hex");
  }

  static checkAndMark(tableName: string, hash: string): boolean {
    if (!this.storage.has(tableName)) {
      this.storage.set(tableName, new Set());
    }
    const tableSet = this.storage.get(tableName)!;
    if (tableSet.has(hash)) return false;
    tableSet.add(hash);
    return true;
  }

  static getStats(tableName: string) {
    return this.storage.get(tableName)?.size || 0;
  }
}