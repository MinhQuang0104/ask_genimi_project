export interface IValidationStrategy {
    validate(value: any, ...args: any[]):boolean;
    errorMessage(propName: string, ...args: any[]): string;
}

export interface IValidationError {
    property: string;       // Tên trường bị lỗi (ví dụ: 'email')
    value: any;             // Giá trị đang bị lỗi (ví dụ: 'invalid-email')
    rule: string;           // Tên rule vi phạm (ví dụ: 'IsEmail')
    message: string;        // Thông báo lỗi
}