export interface IValidationStrategy {
    validate(value: any, ...args: any[]):boolean;
    errorMessage(propName: string, ...args: any[]): string;
}