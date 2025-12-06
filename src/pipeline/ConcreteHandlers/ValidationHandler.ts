// src/pipeline/ConcreteHandlers/ValidationHandler.ts
import {Handler, PipelineContext} from '../Handler';
import { Validator } from '../../core/composite/Validator';
import logger from "../../utils/logger";

export class ValidationHandler extends Handler {
    async handle(context: PipelineContext): Promise<void> {
        // [LOG]
        logger.info(`  [Record ${context.recordIndex}] Đang CheckRule...`);
        const validator = new Validator<any>(); 
        const result = validator.validate(context.entity); 
        context.isValid = result.isValid;
        context.errors = result.errors;

        if (result.isValid) {
             await super.handle(context);
        } else {
             // [LOG] Chỉ log warning ngắn gọn
             logger.warn(`  [Record ${context.recordIndex}] Validation thất bại: ${result.errors.join('; ')}`);
             await super.handle(context);
        }
    }
}