// src/pipeline/ConcreteHandlers/DeduplicationHandler.ts
import 'reflect-metadata';
import { Handler, PipelineContext } from '../Handler';
import { Deduplicator } from '../../core/Deduplicator';
import { UNIQUE_METADATA_KEY } from '../../core/decorators/Unique';
import logger from "../../utils/logger";

export class DeduplicationHandler extends Handler {
    async handle(context: PipelineContext): Promise<void> {
        if (!context.tableName) {
            logger.warn(`[Deduplication] Bỏ qua do thiếu tableName`);
            return;
        }

        // 1. Lấy danh sách các trường được đánh dấu @UniqueKey
        const prototype = Object.getPrototypeOf(context.entity);
        const uniqueKeys: string[] = Reflect.getMetadata(UNIQUE_METADATA_KEY, prototype);

        // Nếu không có key nào được đánh dấu -> đi tiếp
        if (!uniqueKeys || uniqueKeys.length === 0) {
            await super.handle(context);
            return;
        }

        // 2. Lấy giá trị thực tế
        const keyValues = uniqueKeys.map(key => (context.entity as any)[key]);

        // 3. Tạo Hash
        const hash = Deduplicator.generateHash(keyValues);

        // 4. Kiểm tra trùng lặp
        const isUnique = Deduplicator.checkAndMark(context.tableName, hash);
        if (isUnique) {
            // Bản ghi mới -> Đi tiếp
            await super.handle(context);
        } else {
            // [LOG] & [FLAG] Cập nhật xử lý trùng lặp
            const duplicateInfo = uniqueKeys.map((k, i) => `${k}=${keyValues[i]}`).join(', ');
            logger.warn(`  [Record ${context.recordIndex}] ⏭️  SKIP: Trùng lặp dữ liệu (${duplicateInfo})`);
            
            // Đánh dấu Context
            context.isValid = false; 
            context.isSkipped = true; // [NEW] Đánh dấu là đã bỏ qua
            context.errors = [`Duplicate Record: ${duplicateInfo}`];
            
            // KHÔNG gọi super.handle() để dừng chuỗi xử lý tại đây
        }
    }
}