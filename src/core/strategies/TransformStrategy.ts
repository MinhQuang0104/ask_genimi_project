import {ITransformStrategy} from './interfaces/ITransformStrategy'

// =====================================================
// NHÓM XỬ LÝ CHUỖI CƠ BẢN
// =====================================================

export class TrimStrategy implements ITransformStrategy {
    transform(value: any): any {
        if (value == null) return "";
        return String(value).trim();
    }
}

export class RemoveWhitespaceStrategy implements ITransformStrategy {
    transform(value: any): any {
        if (value == null) return "";
        return String(value).replace(/\s+/g, "");
    }
}

export class AlphaNumericOnlyStrategy implements ITransformStrategy {
    transform(value: any): any {
        if (value == null) return "";
        return String(value).replace(/[^a-zA-Z0-9]/g, "");
    }
}

export class ToLowerCaseStrategy implements ITransformStrategy {
    transform(value: any): any {
        if (value == null) return "";
        return String(value).toLowerCase();
    }
}

export class ToUpperCaseStrategy implements ITransformStrategy {
    transform(value: any): any {
        if (value == null) return "";
        return String(value).toUpperCase();
    }
}

export class PadToMinLengthStrategy implements ITransformStrategy {
    transform(value: any, minLength: number, char: string = '*'): any {
        const s = String(value ?? "");
        if (s.length < minLength) {
            const pad = char.repeat(minLength - s.length);
            return s + pad;
        }
        return s;
    }
}

// =====================================================
// NHÓM GIÁ TRỊ MẶC ĐỊNH (DEFAULT)
// =====================================================

export class DefaultStrategy implements ITransformStrategy {
    transform(value: any, defaultValue: any): any {
        if (value === null || value === undefined) {
            return defaultValue;
        }
        return value;
    }
}

export class DefaultDateStrategy implements ITransformStrategy {
    transform(value: any, dateValue: 'now' | string): any {
        if (value === null || value === undefined || value === '') {
            if (dateValue === 'now') {
                return new Date();
            }
            return new Date(dateValue);
        }
        return new Date(value);
    }
}

// =====================================================
// NHÓM TÙY BIẾN
// =====================================================

export class CustomTransformStrategy implements ITransformStrategy {
    transform(value: any, fn: (val: any) => any): any {
        return fn(value);
    }
}