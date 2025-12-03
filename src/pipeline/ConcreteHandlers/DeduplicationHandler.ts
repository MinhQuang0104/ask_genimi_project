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
        // 1. Lấy danh sách các trường được đánh dấu @UniqueKey trong Model
        const prototype = Object.getPrototypeOf(context.entity);
        const uniqueKeys: string[] = Reflect.getMetadata(UNIQUE_METADATA_KEY, prototype);

        // Nếu không có key nào được đánh dấu, coi như không cần check trùng -> đi tiếp
        if (!uniqueKeys || uniqueKeys.length === 0) {
            await super.handle(context);
            return;
        }

        // 2. Lấy giá trị thực tế từ Entity (đã qua Transform)
        // Ví dụ: entity['MaTK'], entity['TenDangNhap']
        const keyValues = uniqueKeys.map(key => (context.entity as any)[key]);

        // 3. Tạo Hash signature
        const hash = Deduplicator.generateHash(keyValues);

        // 4. Kiểm tra trùng lặp
        const isUnique = Deduplicator.checkAndMark(context.tableName, hash);
        if (isUnique) {
            // [LOG] Nếu cần debug chi tiết
            // logger.info(`  [Record ${context.recordIndex}] ✅ Unique check passed.`);
            
            // Bản ghi mới -> Đi tiếp sang Validation
            await super.handle(context);
        } else {
            // TRÙNG LẶP -> Dừng pipeline tại đây cho bản ghi này
            logger.warn(`  [Record ${context.recordIndex}] ⚠️  Bỏ qua bản ghi trùng lặp (Duplicate Key: ${uniqueKeys.join('+')})`);
            
            // Đánh dấu context là invalid (để thống kê nếu cần, hoặc chỉ đơn giản là return để skip)
            context.isValid = false; 
            context.errors = [`Duplicate Record based on keys: ${uniqueKeys.join(', ')}`];
            
            // KHÔNG gọi super.handle() để cắt chuỗi xử lý (Skip Validation & Save)
        }
    }
}