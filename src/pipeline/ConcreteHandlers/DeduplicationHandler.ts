import 'reflect-metadata';
import { Handler, PipelineContext } from '../Handler';
import { Deduplicator } from '../../core/Deduplicator';
import { UNIQUE_METADATA_KEY } from '../../core/decorators/Unique';
import logger from "../../utils/logger";


export class DeduplicationHandler extends Handler {
    async handle(context: PipelineContext): Promise<void> {
        const stageName = 'DEDUPLICATION';

        if (!context.tableName) {
            logger.warn(`[Deduplication] Bỏ qua do thiếu tableName`, { stage: stageName });
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
            // [LOG DEBUG] Log khi record này là MỚI (Hợp lệ)
            // Bạn có thể comment lại nếu thấy quá nhiều log
            logger.info(`Deduplication Passed (New Record)`, {
                stage: stageName,
                recordIndex: context.recordIndex,
                tableName: context.tableName,
                generatedHash: hash,        // In ra hash để đối chiếu
                checkingKeys: uniqueKeys,   // Các key dùng để check
                recordData: context.entity  // [YÊU CẦU] Dữ liệu chi tiết field + value
            });

            await super.handle(context);
        } else {
            // [LOG WARN] Log khi phát hiện TRÙNG LẶP
            const duplicateInfo = uniqueKeys.map((k, i) => `${k}=${keyValues[i]}`).join(', ');
            
            logger.warn(`Deduplication Failed (Duplicate)`, {
                stage: stageName,
                recordIndex: context.recordIndex,
                tableName: context.tableName,
                duplicateOn: duplicateInfo, // Trùng ở field nào, giá trị gì
                generatedHash: hash,        // Hash này đã tồn tại trong RAM
                recordData: context.entity  // [YÊU CẦU] Dữ liệu record đang bị drop
            });
            
            // Đánh dấu Context để skip
            context.isValid = false; 
            context.isSkipped = true; 
            context.errors = [`Duplicate Record: ${duplicateInfo}`];
        }
    }
}