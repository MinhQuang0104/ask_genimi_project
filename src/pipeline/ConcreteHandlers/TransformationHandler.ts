import { Transformer } from "../../core/composite/Transformer";
import { Handler, PipelineContext } from "../Handler";
import logger from "../../utils/logger";

export class TransformationHandler extends Handler {
  async handle(context: PipelineContext): Promise<void> {
    const stageName = 'TRANSFORMATION';
    
    try {
      const transformer = new Transformer<any>();
      // Snapshot dữ liệu trước khi transform
      const dataBefore = JSON.parse(JSON.stringify(context.entity));

      // Thực thi transform
      transformer.process(context.entity);

      const dataAfter = context.entity;

      // [BỔ SUNG] Thêm recordData và stage vào log info
      logger.info(`Transformation Success`, {
        stage: stageName,
        recordIndex: context.recordIndex,
        tableName: context.tableName,
        // Giữ nguyên diff để so sánh
        diff: {
          before: dataBefore,
          after: dataAfter,
        },
        // Log chi tiết dữ liệu hiện tại (field + value)
        recordData: dataAfter 
      });

      await super.handle(context);
    } catch (e: any) {
      // [BỔ SUNG] Thêm context dữ liệu vào log lỗi transform
      logger.error(`Lỗi Transform`, {
        stage: stageName,
        recordIndex: context.recordIndex,
        tableName: context.tableName,
        error: e.message,
        // Dữ liệu tại thời điểm gây lỗi
        recordData: context.entity 
      });
    }
  }
}