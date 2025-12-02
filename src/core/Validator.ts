import 'reflect-metadata';
import { ValidationResult } from './ValidationResult';
import {VALIDATION_METADATA_KEY} from '../core/decorators/Validators'
export class Validator<T> {
    validate(instance: T): ValidationResult {
        const result = new ValidationResult();
        // chuẩn bị dữ liệu để chọc vào 'reflect-metadata' lấy thông tin rules
        const prototype = Object.getPrototypeOf(instance);
        const propertyKeys = Object.getOwnPropertyNames(instance);

        // duyệt qua các key, tại mỗi key lại lấy ra các rule tương ứng của nó từ 'reflect-metadata' 
        // => từ tập hợp các rules lại tiếp tục lặp qua từng rule đơn lẻ => để validate() 
        for (const key of propertyKeys) {
            const rules: any[] = Reflect.getMetadata(VALIDATION_METADATA_KEY, prototype, key);
            if (rules) {
                for (const rule of rules) {
                    const { strategy, args } = rule;
                    const value = (instance as any)[key];
                    
                    if (!strategy.validate(value, ...args)) {
                        result.isValid = false;
                        result.errors.push(strategy.errorMessage(key, ...args));
                    }
                }
            }
        }
        return result;
    }
}