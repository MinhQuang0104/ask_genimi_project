import 'reflect-metadata';
import { ValidationResult } from './ValidationResult';
import { VALIDATION_METADATA_KEY } from '../decorators/Validators';

export class Validator<T> {
    validate(instance: T): ValidationResult {
        const result = new ValidationResult();
        const prototype = Object.getPrototypeOf(instance);
        const propertyKeys = Object.getOwnPropertyNames(instance);

        for (const key of propertyKeys) {
            const rules: any[] = Reflect.getMetadata(VALIDATION_METADATA_KEY, prototype, key);
            if (rules) {
                for (const ruleItem of rules) {
                    const { strategy, args } = ruleItem;
                    const value = (instance as any)[key];
                    const ruleName = strategy.constructor.name.replace('Strategy', '');
                    
                    // Ghi lại tất cả các rule đã được áp dụng
                    result.validationsApplied.push(`${key}: ${ruleName}`);

                    if (!strategy.validate(value, ...args)) {
                        result.isValid = false;
                        result.errors.push({
                            property: key,
                            value: value,
                            rule: ruleName, 
                            message: strategy.errorMessage(key, ...args)
                        });
                    }
                }
            }
        }
        return result;
    }
}