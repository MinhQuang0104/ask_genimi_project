// Context chung truyền qua các mắt xích
export interface PipelineContext {
    tableName?: string;
    fileName?: string;   
    recordIndex?: number; 
    rawData?: any;   // Dữ liệu thô từ CSV
    entity?: any;    // Dữ liệu đã convert sang Class
    isValid?: boolean;
    errors?: string[];
    entityName?: string;
    isSkipped?: boolean;    // Đánh dấu nếu bản ghi bị bỏ qua (do trùng lặp)
    isSavedToDB?: boolean;
    [key: string]: any;
}

// Lớp cha của các mắt xích (Handler)
export abstract class Handler {
    protected nextHandler: Handler | null = null;

    setNext(handler: Handler): Handler {
        this.nextHandler = handler;
        return handler;
    }

    async handle(context: PipelineContext): Promise<void> {
        if (this.nextHandler) {
            await this.nextHandler.handle(context);
        }
    }
}