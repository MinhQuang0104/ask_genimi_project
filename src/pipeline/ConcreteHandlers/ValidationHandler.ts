import { Handler, PipelineContext } from "../Handler";
import { Validator } from "../../core/composite/Validator";
import logger from "../../utils/logger";

export class ValidationHandler extends Handler {
  async handle(context: PipelineContext): Promise<void> {
    const validator = new Validator<any>();
    const result = validator.validate(context.entity);
    context.isValid = result.isValid;
    context.errors = result.errors as any;

    const stageName = 'VALIDATION';

    if (result.isValid) {
      // [BỔ SUNG] Log Success để biết rule đã được thực thi và dữ liệu nào đã pass
      logger.info(`Validation Hợp lệ`, {
        stage: stageName,
        recordIndex: context.recordIndex,
        tableName: context.tableName,
        // Dữ liệu chi tiết field + value
        recordData: context.entity 
      });

      await super.handle(context);
    } else {
      // [BỔ SUNG] Giữ nguyên log lỗi cũ, thêm stage và recordData
      logger.warn(`Validation thất bại`, {
        stage: stageName,
        recordIndex: context.recordIndex,
        tableName: context.tableName,
        // result.errors đã chứa tên rule (property: 'rule') và message lỗi
        failedRules: result.errors.map(e => ({ field: e.property, rule: e.rule, msg: e.message })),
        fullErrors: result.errors,
        // Quan trọng: Dữ liệu chi tiết field + value của record bị lỗi
        recordData: context.entity
      });
    }
  }
}