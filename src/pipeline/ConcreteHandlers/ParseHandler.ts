import logger from "../../utils/logger";
import { Handler, PipelineContext } from "../Handler";
import { EntityFactory } from "../../core/EntityFactory";
// nhận vào tên table + dữ liệu dưới dạng {} rồi tạo instance từ  class tương ứng
export class ParseHandler extends Handler {
// Sửa phương thức handle
async handle(context: PipelineContext): Promise<void> {
    // [FIX] Kiểm tra tableName tồn tại trước khi dùng
    if (!context.tableName) {
        logger.error("[Parse] Thiếu tableName trong context");
        return; 
    }

    logger.info(`[Parse] Bắt đầu xử lý bảng: ${context.tableName}`);
    try {
        context.entity = EntityFactory.create(context.tableName, context.rawData);
        // ... giữ nguyên code cũ
        await super.handle(context);
    } catch (e) {
        logger.error("Lỗi Parse:", e);
    }
}
}