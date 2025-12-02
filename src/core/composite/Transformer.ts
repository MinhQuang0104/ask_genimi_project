import 'reflect-metadata';
import { TRANSFORM_METADATA_KEY } from '../decorators/Transforms';

export class Transformer<T> {
    // Hàm này sẽ thay đổi trực tiếp instance (Mutation)
    process(instance: T): T {
        const prototype = Object.getPrototypeOf(instance);
        const propertyKeys = Object.getOwnPropertyNames(instance);

        for (const key of propertyKeys) {
            const rules: any[] = Reflect.getMetadata(TRANSFORM_METADATA_KEY, prototype, key);
            
            if (rules) {
                // Lấy giá trị hiện tại
                let currentValue = (instance as any)[key];

                // Chạy qua tất cả các bước transform tuần tự
                for (const rule of rules) {
                    const { strategy, args } = rule;
                    currentValue = strategy.transform(currentValue, ...args);
                }

                // Cập nhật lại giá trị mới vào object
                (instance as any)[key] = currentValue;
            }
        }
        return instance;
    }
}