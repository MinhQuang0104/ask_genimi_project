import { Transformer } from '../../core/Transformer';
import {Handler, PipelineContext} from '../Handler';
import logger from "../../utils/logger";

export class TransformationHandler extends Handler {
    async handle(context: PipelineContext): Promise<void> {
        logger.info(`[Step 1.5] Transforming: Đang chuẩn hóa dữ liệu...`);
        try {
            const transformer = new Transformer<any>();
            // Biến đổi object entity ngay tại chỗ
            transformer.process(context.entity);
            
            // Log nhẹ để debug xem dữ liệu đổi thế nào
            // logger.info("   -> Data after transform:", context.entity);
            
            await super.handle(context);
        } catch (e) {
            logger.error("Lỗi Transform:", e);
            // Tùy chọn: Có thể dừng hoặc đánh dấu lỗi
        }
    }
}