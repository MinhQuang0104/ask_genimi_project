import 'reflect-metadata';
import { TRANSFORM_METADATA_KEY } from '../decorators/Transforms';

export class Transformer<T> {
    // Hàm này sẽ trả về instance và danh sách các transform đã áp dụng
    process(instance: T): { instance: T; transformations: string[] } {
        const transformations: string[] = [];
        const prototype = Object.getPrototypeOf(instance);
        const propertyKeys = Object.getOwnPropertyNames(instance);

        for (const key of propertyKeys) {
            const rules: any[] = Reflect.getMetadata(TRANSFORM_METADATA_KEY, prototype, key);
            
            if (rules) {
                let currentValue = (instance as any)[key];

                for (const rule of rules) {
                    const { strategy, args } = rule;
                    const strategyName = strategy.constructor.name.replace('Strategy', '');
                    
                    currentValue = strategy.transform(currentValue, ...args);
                    
                    // Ghi lại transform đã được áp dụng
                    transformations.push(`${key}: ${strategyName}`);
                }

                (instance as any)[key] = currentValue;
            }
        }
        return { instance, transformations };
    }
}