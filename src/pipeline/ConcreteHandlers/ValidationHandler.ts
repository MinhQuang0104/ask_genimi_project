// src/pipeline/ConcreteHandlers/ValidationHandler.ts
import { Handler, PipelineContext } from "../Handler";
import { Validator } from "../../core/composite/Validator";
import logger from "../../utils/logger";

export class ValidationHandler extends Handler {
  async handle(context: PipelineContext): Promise<void> {
    const validator = new Validator<any>();
    const result = validator.validate(context.entity);
    context.isValid = result.isValid;

    context.errors = result.errors as any;

    if (result.isValid) {
      await super.handle(context);
    } else {
      logger.warn(`Validation thất bại`, {
        recordIndex: context.recordIndex,
        tableName: context.tableName,
        validationErrors: result.errors,
      });
    }
  }
}
