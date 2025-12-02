import {Handler, PipelineContext} from '../Handler';
import { Validator } from '../../core/Validator';
import logger from "../../utils/logger";

export class ValidationHandler extends Handler {
    async handle(context: PipelineContext): Promise<void> {
        logger.info(`Step 2: Validating...`);
        
        // Dùng Generic Validator
        const validator = new Validator<any>(); 
        const result = validator.validate(context.entity);
        // sau khi validate, giá trị của trường context.isValid và context.errors đã được bổ sung
        context.isValid = result.isValid;
        context.errors = result.errors;

        if (result.isValid) {
             await super.handle(context);
        } else {
             logger.warn("Validation Failed:", result.errors);
             // Có thể quyết định dừng chain tại đây hoặc vẫn đi tiếp để log lỗi
             await super.handle(context);
        }
    }
}