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
                    
                    if (!strategy.validate(value, ...args)) {
                        result.isValid = false;
                        result.errors.push({
                            property: key,
                            value: value,
                            // Lấy tên class của Strategy làm tên Rule (VD: MinLengthStrategy -> MinLength)
                            rule: strategy.constructor.name.replace('Strategy', ''), 
                            message: strategy.errorMessage(key, ...args)
                        });
                    }
                }
            }
        }
        return result;
    }
}