import 'reflect-metadata';
import {
    TrimStrategy, 
    ToUpperCaseStrategy, 
    ToLowerCaseStrategy,
    RemoveWhitespaceStrategy,
    AlphaNumericOnlyStrategy,
    DefaultStrategy,
    DefaultDateStrategy,
    PadToMinLengthStrategy,
    CustomTransformStrategy
} from '../strategies/TransformStrategy'
import {ITransformStrategy} from '../strategies/interfaces/ITransformStrategy'

export const TRANSFORM_METADATA_KEY = Symbol('transform:rules');

// Helper đăng ký
function registerTransform(target: any, propertyKey: string, strategy: ITransformStrategy, ...args: any[]) {
    let rules = Reflect.getMetadata(TRANSFORM_METADATA_KEY, target, propertyKey) || [];
    rules.push({ strategy, args });
    Reflect.defineMetadata(TRANSFORM_METADATA_KEY, rules, target, propertyKey);
}

export function Trim() {
    return (target: any, propertyKey: string) => registerTransform(target, propertyKey, new TrimStrategy());
}

export function RemoveWhitespace() {
    return (target: any, propertyKey: string) => registerTransform(target, propertyKey, new RemoveWhitespaceStrategy());
}

export function AlphaNumericOnly() {
    return (target: any, propertyKey: string) => registerTransform(target, propertyKey, new AlphaNumericOnlyStrategy());
}

export function ToLowerCase() {
    return (target: any, propertyKey: string) => registerTransform(target, propertyKey, new ToLowerCaseStrategy());
}

export function ToUpperCase() {
    return (target: any, propertyKey: string) => registerTransform(target, propertyKey, new ToUpperCaseStrategy());
}

export function PadToMinLength(minLength: number, char: string = '*') {
    return (target: any, propertyKey: string) => registerTransform(target, propertyKey, new PadToMinLengthStrategy(), minLength, char);
}

// =====================================================
// NHÓM GIÁ TRỊ MẶC ĐỊNH (DEFAULT)
// =====================================================

export function Default(defaultValue: any) {
    return (target: any, propertyKey: string) => registerTransform(target, propertyKey, new DefaultStrategy(), defaultValue);
}

export function DefaultDate(dateValue: 'now' | string) {
    return (target: any, propertyKey: string) => registerTransform(target, propertyKey, new DefaultDateStrategy(), dateValue);
}

// =====================================================
// NHÓM TÙY BIẾN
// =====================================================

export function Transform(fn: (val: any) => any) {
    return (target: any, propertyKey: string) => registerTransform(target, propertyKey, new CustomTransformStrategy(), fn);
}