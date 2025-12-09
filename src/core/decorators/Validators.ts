import 'reflect-metadata';
import { 
    NotNullStrategy, 
    MinLengthStrategy,
    MaxLengthStrategy,
    IsIntegerStrategy,
    IsDecimalStrategy,
    MinValueStrategy,
    InSetStrategy,
    IsEmailStrategy,
    IsPhoneNumberStrategy,
    MaxDateStrategy,
    IsUrlOrPathStrategy,
    InRangeStrategy
} from '../strategies/ValidationStrategy';
import {IValidationStrategy} from '../strategies/interfaces/IValidationStrategy'
import { IRuleMetadata } from './IRuleMetadata';

export const VALIDATION_METADATA_KEY = Symbol('validation:rules');

// Helper để đăng ký rule
// Mỗi decorator chỉ đăng ký được 1 rule tại 1 thời điểm => việc lấy ra danh sách rules hiện có, bổ sung rule mới vào rồi gán lại là cần thiết
// để giải quyết trường trường hợp 1 property có nhiều decorator (rule) khác nhau
function registerRule(target: any, propertyKey: string, strategy: IValidationStrategy, ...args: any[]) {
    let rules: IRuleMetadata[] = Reflect.getMetadata(VALIDATION_METADATA_KEY, target, propertyKey) || [];
    rules.push({ strategy, args });
    Reflect.defineMetadata(VALIDATION_METADATA_KEY, rules, target, propertyKey);
}

// --- Các Decorators public ---

export function Required() {
    return (target: any, propertyKey: string) => {
        registerRule(target, propertyKey, new NotNullStrategy());
    };
}

export function MinLen(length: number) {
    return (target: any, propertyKey: string) => {
        registerRule(target, propertyKey, new MinLengthStrategy(), length);
    };
}

export function MaxLen(length: number) {
    return (target: any, propertyKey: string) => {
        registerRule(target, propertyKey, new MaxLengthStrategy(), length);
    };
}

export function IsInteger() {
    return (target: any, propertyKey: string) => {
        registerRule(target, propertyKey, new IsIntegerStrategy());
    };
}

export function IsDecimal() {
    return (target: any, propertyKey: string) => {
        registerRule(target, propertyKey, new IsDecimalStrategy());
    };
}

export function Min(minValue: number) {
    return (target: any, propertyKey: string) => {
        registerRule(target, propertyKey, new MinValueStrategy(), minValue);
    };
}

export function InSet(set: any[]) {
    return (target: any, propertyKey: string) => {
        registerRule(target, propertyKey, new InSetStrategy(), set);
    };
}

export function IsEmail() {
    return (target: any, propertyKey: string) => {
        registerRule(target, propertyKey, new IsEmailStrategy());
    };
}

export function IsPhoneNumber() {
    return (target: any, propertyKey: string) => {
        registerRule(target, propertyKey, new IsPhoneNumberStrategy());
    };
}

export function MaxDate(maxDateStr: string) {
    return (target: any, propertyKey: string) => {
        registerRule(target, propertyKey, new MaxDateStrategy(), maxDateStr);
    };
}

export function IsUrlOrPath() {
    return (target: any, propertyKey: string) => {
        registerRule(target, propertyKey, new IsUrlOrPathStrategy());
    };
}

export function InRange(min: number, max: number) {
    return (target: any, propertyKey: string) => {
        registerRule(target, propertyKey, new InRangeStrategy(), min, max);
    };
}