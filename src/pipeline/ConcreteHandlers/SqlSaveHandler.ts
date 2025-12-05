// src/pipeline/ConcreteHandlers/SqlSaveHandler.ts
import { Handler, PipelineContext } from '../Handler';
import { AppDataSource } from '../../config/database/typeormConfig';
import logger from '../../utils/logger';

export class SqlSaveHandler extends Handler {
    
    async handle(context: PipelineContext): Promise<void> {
        const { tableName, entity, isValid } = context;

        // Chỉ lưu nếu hợp lệ và chưa bị đánh dấu skip
        if (isValid && entity && tableName && !context.isSkipped) {
            try {
                const repository = AppDataSource.getRepository(tableName);
                
                await repository.save(entity);

                // [NEW] Đánh dấu và Log chi tiết
                context.isSavedToDB = true; 
                
                // Lấy ra Primary Key hoặc một vài field quan trọng để log cho dễ nhìn
                // (Giả sử lấy field đầu tiên của entity làm định danh)
                const firstKey = Object.keys(entity)[0];
                const firstVal = entity[firstKey];
                
                logger.info(`  [Record ${context.recordIndex}] 💾 DB Saved: ${tableName} (Key: ${firstVal})`);

            } catch (err: any) {
                logger.error(`  [Record ${context.recordIndex}] 💥 DB Error: ${err.message}`);
                
                context.isValid = false;
                context.errors = context.errors || [];
                context.errors.push(`SQL Error: ${err.message}`);
            }
        }

        await super.handle(context);
    }
}