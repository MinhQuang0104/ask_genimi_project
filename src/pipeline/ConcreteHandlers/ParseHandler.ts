import logger from "../../utils/logger";
import { Handler, PipelineContext } from "../Handler";
import { EntityFactory } from "../../core/EntityFactory";
// nhận vào tên table + dữ liệu dưới dạng {} rồi tạo instance từ  class tương ứng
export class ParseHandler extends Handler {
  async handle(context: PipelineContext): Promise<void> {
    logger.info(`[Parse] Bắt đầu xử lý bảng: ${context.tableName}`);
    try {
      // Dùng Factory để tạo object, lúc này context sẽ được bổ sung thêm giá trị cho property context.entity
      context.entity = EntityFactory.create(context.tableName, context.rawData);
      logger.info("Parsed Entity:", context.entity);
      await super.handle(context);
    } catch (e) {
      logger.error("Lỗi Parse:", e);
    }
  }
}
