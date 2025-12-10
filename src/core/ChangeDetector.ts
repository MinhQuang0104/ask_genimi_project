
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { EntityFactory } from "./EntityFactory";
import { UNIQUE_METADATA_KEY } from "./decorators/Unique";
import "reflect-metadata";
import logger from "../utils/logger";

// --- Types ---
interface IState {
  [idHash: string]: any; // idHash -> record object
}

interface IChanges {
  newRecords: any[];
  updatedRecords: any[];
  deletedRecords: any[];
  unchangedRecords: any[];
}

export class ChangeDetector {
  private stateDir: string;
  private oldState: IState = {};
  private newState: IState = {};
  private uniqueKeys: string[] = [];
  private tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
    this.stateDir = path.join(__dirname, "../../resource/data_state");
    const modelCtor = EntityFactory.getClass(tableName);
    if (modelCtor) {
      this.uniqueKeys = Reflect.getMetadata(
        UNIQUE_METADATA_KEY,
        modelCtor.prototype
      ) || [];
    }
  }

  private generateHash(values: any[]): string {
    const data = values.map((v) => String(v ?? "").trim()).join("|");
    return crypto.createHash("md5").update(data).digest("hex");
  }

  private getStateFilePath(): string {
    return path.join(this.stateDir, `${this.tableName}_state.json`);
  }

  public hasUniqueKeys(): boolean {
    return this.uniqueKeys && this.uniqueKeys.length > 0;
  }

  public async loadState(): Promise<void> {
    const filePath = this.getStateFilePath();
    try {
      const data = await fs.readFile(filePath, "utf-8");
      this.oldState = JSON.parse(data);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        logger.warn(`Không tìm thấy file trạng thái cho '${this.tableName}'. Coi như đây là lần chạy đầu tiên.`);
        this.oldState = {};
      } else {
        throw error;
      }
    }
    this.newState = {}; // Reset new state for the new run
  }

  public detectChanges(currentRecords: any[]): IChanges {
    if (!this.hasUniqueKeys()) {
      // If no unique keys, treat all records as new and we can't detect deletes.
      return { 
        newRecords: currentRecords, 
        updatedRecords: [], 
        deletedRecords: [],
        unchangedRecords: []
      };
    }

    const seenIdHashes = new Set<string>();
    const changes: IChanges = {
      newRecords: [],
      updatedRecords: [],
      deletedRecords: [],
      unchangedRecords: []
    };

    // Identify new and updated records
    for (const record of currentRecords) {
      const idValues = this.uniqueKeys.map(key => record[key]);
      const idHash = this.generateHash(idValues);
      
      this.newState[idHash] = record; // Store the full record for the new state
      seenIdHashes.add(idHash);

      const oldRecord = this.oldState[idHash];

      if (!oldRecord) {
        changes.newRecords.push(record);
      } else {
        // Compare content by hashing all values
        const newContentHash = this.generateHash(Object.values(record));
        const oldContentHash = this.generateHash(Object.values(oldRecord));

        if (newContentHash !== oldContentHash) {
          changes.updatedRecords.push(record);
        } else {
          changes.unchangedRecords.push(record);
        }
      }
    }

    // Identify deleted records
    for (const idHash in this.oldState) {
      if (!seenIdHashes.has(idHash)) {
          // The record from the old state is the one that was deleted
          changes.deletedRecords.push(this.oldState[idHash]);
      }
    }
    
    return changes;
  }
  
  public async saveState(): Promise<void> {
    const filePath = this.getStateFilePath();
    try {
        await fs.mkdir(this.stateDir, { recursive: true });
        await fs.writeFile(filePath, JSON.stringify(this.newState, null, 2), "utf-8");
    } catch (error) {
        logger.error(`Không thể lưu file trạng thái cho '${this.tableName}':`, error);
        throw error;
    }
  }
}
