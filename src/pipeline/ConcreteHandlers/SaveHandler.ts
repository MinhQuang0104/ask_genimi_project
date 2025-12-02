import {Handler, PipelineContext} from '../Handler';
import logger from "../../utils/logger";

export class SaveHandler extends Handler {
    async handle(context: PipelineContext): Promise<void> {
        if (context.isValid) {
            logger.info(`Step 3: Saving valid record...`);
            logger.log(`Last data of context: `, context);
            // Logic ghi file CSV output (như trong pipeline.js cũ)
        } else {
            logger.info(`Step 3: Saving ERROR record...`);
            // Logic ghi file error
        }
    }
}