import {IValidationStrategy} from './interfaces/IValidationStrategy'

// Chiến lược kiểm tra Null/Empty
export class NotNullStrategy implements IValidationStrategy {
    validate(value: any): boolean {
        return value !== null && value !== undefined && String(value).trim() !== '';
    }
    errorMessage(propName: string): string {
        return `${propName} không được để trống.`;
    }
}

// Chiến lược kiểm tra số nguyên (Generics có thể dùng ở đây nếu cần logic phức tạp hơn)
export class IsIntegerStrategy implements IValidationStrategy {
    validate(value: any): boolean {
        return value !== null && value !== undefined && Number.isInteger(Number(value));
    }
    errorMessage(propName: string): string {
        return `${propName} phải là số nguyên.`;
    }
}

export class MinLengthStrategy implements IValidationStrategy {
    validate(value: any, length: number): boolean {
        if (typeof value === 'string') {
            return value.length >= length;
        }
        return false;
    }   
    errorMessage(propName: string, length: number): string {
        return `${propName} phải có độ dài tối thiểu là ${length} ký tự.`;
    }
}

export class MaxLengthStrategy implements IValidationStrategy {
    validate(value: any, maxLength: number): boolean {
        if (value === null || value === undefined) return true;
        const len = (typeof value === 'string' || Array.isArray(value)) ? value.length : 0;
        return len <= maxLength;
    }
    errorMessage(propName: string, maxLength: number): string {
        return `${propName} phải có độ dài tối đa là ${maxLength} ký tự.`;
    }
}

// --- Mở rộng: Các chiến lược bổ sung ---

export class IsDecimalStrategy implements IValidationStrategy {
    validate(value: any): boolean {
        if (value === null || value === undefined || value === '') return false;
        const n = Number(value);
        return !Number.isNaN(n) && isFinite(n);
    }
    errorMessage(propName: string): string {
        return `${propName} phải là số hợp lệ.`;
    }
}

export class MinValueStrategy implements IValidationStrategy {
    validate(value: any, min: number): boolean {
        if (value === null || value === undefined || value === '') return false;
        const n = Number(value);
        return !Number.isNaN(n) && n >= min;
    }
    errorMessage(propName: string, min: number): string {
        return `${propName} phải lớn hơn hoặc bằng ${min}.`;
    }
}

export class InSetStrategy implements IValidationStrategy {
    validate(value: any, set: any[]): boolean {
        return set.includes(value);
    }
    errorMessage(propName: string, set: any[]): string {
        return `${propName} phải thuộc một trong giá trị sau: ${JSON.stringify(set)}.`;
    }
}

export class IsEmailStrategy implements IValidationStrategy {
    validate(value: any): boolean {
        if (value === null || value === undefined || value === '') return false;
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(value).toLowerCase());
    }
    errorMessage(propName: string): string {
        return `${propName} không phải là email hợp lệ.`;
    }
}

export class IsPhoneNumberStrategy implements IValidationStrategy {
    validate(value: any): boolean {
        if (value === null || value === undefined || value === '') return false;
        const s = String(value).trim();
        const re = /^\+?\d{7,15}$/; // basic international format
        return re.test(s);
    }
    errorMessage(propName: string): string {
        return `${propName} không phải là số điện thoại hợp lệ.`;
    }
}

export class MaxDateStrategy implements IValidationStrategy {
    validate(value: any, maxDateStr: string): boolean {
        if (!value) return true; // allow empty (use Required() to enforce presence)
        const date = new Date(value);
        const max = maxDateStr === 'now' ? new Date() : new Date(maxDateStr);
        if (isNaN(date.getTime()) || isNaN(max.getTime())) return false;
        return date.getTime() <= max.getTime();
    }
    errorMessage(propName: string, maxDateStr: string): string {
        return `${propName} phải nhỏ hơn hoặc bằng ${maxDateStr}.`;
    }
}

export class IsUrlOrPathStrategy implements IValidationStrategy {
    validate(value: any): boolean {
        if (value === null || value === undefined || value === '') return true;
        const s = String(value).trim();
        // try URL first
        try {
            // new URL will throw if not absolute url
            new URL(s);
            return true;
        } catch {
            // allow unix or windows local paths
            const pathRe = /^([a-zA-Z]:\\|\/).*|^[^<>:"|?*]+$/;
            return pathRe.test(s);
        }
    }
    errorMessage(propName: string): string {
        return `${propName} phải là URL hoặc đường dẫn hợp lệ.`;
    }
}

export class InRangeStrategy implements IValidationStrategy {
    validate(value: any, min: number, max: number): boolean {
        if (value === null || value === undefined || value === '') return false;
        const n = Number(value);
        if (Number.isNaN(n)) return false;
        return n >= min && n <= max;
    }
    errorMessage(propName: string, min: number, max: number): string {
        return `${propName} phải nằm trong khoảng từ ${min} đến ${max}.`;
    }
}