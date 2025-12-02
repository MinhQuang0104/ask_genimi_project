export interface ITransformStrategy {
    transform(value: any, ...args: any[]): any;
}