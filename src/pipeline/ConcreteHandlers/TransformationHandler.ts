// src/pipeline/ConcreteHandlers/TransformationHandler.ts
import { Transformer } from '../../core/composite/Transformer';
import { Handler, PipelineContext } from '../Handler';
import logger from "../../utils/logger";

export class TransformationHandler extends Handler {
    async handle(context: PipelineContext): Promise<void> {
        logger.info(`  [Record ${context.recordIndex}] Đang Transform...`);
        try {
            const transformer = new Transformer<any>();
            const dataBefore = JSON.stringify(context.entity);
            logger.info(`    -> Trước: ${dataBefore}`);
            transformer.process(context.entity);
            // [LOG] Snapshot dữ liệu SAU khi transform
            const dataAfter = JSON.stringify(context.entity);
            logger.info(`    -> Sau  : ${dataAfter}`);
            
            await super.handle(context);
        } catch (e: any) {
            logger.error(`  [Record ${context.recordIndex}] Lỗi Transform: ${e.message}`);
        }
    }
}