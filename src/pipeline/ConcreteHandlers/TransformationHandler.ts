// src/pipeline/ConcreteHandlers/TransformationHandler.ts
import { Transformer } from "../../core/composite/Transformer";
import { Handler, PipelineContext } from "../Handler";
import logger from "../../utils/logger";

export class TransformationHandler extends Handler {
  async handle(context: PipelineContext): Promise<void> {
    try {
      const transformer = new Transformer<any>();
      const dataBefore = JSON.parse(JSON.stringify(context.entity));

      transformer.process(context.entity);

      const dataAfter = context.entity;
      logger.info(`Transformation`, {
        recordIndex: context.recordIndex,
        tableName: context.tableName,
        diff: {
          before: dataBefore,
          after: dataAfter,
        },
      });

      await super.handle(context);
    } catch (e: any) {
      logger.error(`Lỗi Transform`, {
        recordIndex: context.recordIndex,
        tableName: context.tableName,
        error: e.message,
      });
    }
  }
}
