// src/pipeline/ConcreteHandlers/SqlSaveHandler.ts
import { Handler, PipelineContext } from '../Handler';
import { AppDataSource } from '../../config/database/typeormConfig';
import logger from '../../utils/logger';
import { EntityFactory } from '../../core/EntityFactory';

export class SqlSaveHandler extends Handler {
    
    async handle(context: PipelineContext): Promise<void> {
        const { tableName, entity, isValid } = context;

        if (isValid && entity && tableName) {
            try {
                // 1. Lấy Repository từ TypeORM dựa trên tên bảng (hoặc tên Entity)
                // Lưu ý: Tên Entity trong TypeORM phải khớp với tableName
                const repository = AppDataSource.getRepository(tableName);
                
                // 2. Lưu trực tiếp (TypeORM tự xử lý INSERT, bỏ qua cột Identity nếu cần)
                await repository.save(entity);

                logger.info(`[TypeORM] ✅ Đã lưu bản ghi vào bảng ${tableName}`);

            } catch (err: any) {
                logger.error(`[TypeORM] 💥 Lỗi lưu DB bảng ${tableName}:`, err.message);
                
                // Ghi nhận lỗi vào context
                context.isValid = false;
                context.errors = context.errors || [];
                context.errors.push(`SQL Error: ${err.message}`);
            }
        }

        await super.handle(context);
    }
}