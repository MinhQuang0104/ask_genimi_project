// import { TaiKhoan } from '../models/TaiKhoan';
// import { HoaDon } from '../models/HoaDon';

type Constructor<T> = new (...args: any[]) => T;

export class EntityFactory {
    private static registry: Map<string, Constructor<any>> = new Map();

    // Đăng ký các class vào factory
    static register(tableName: string, ctor: Constructor<any>) {
        this.registry.set(tableName, ctor);
    }
    // hàm này để Deduplicator có thể lấy được Class
    static getClass(tableName: string): Constructor<any> | undefined {
        return this.registry.get(tableName);
    }
    public static getRegisteredEntityNames(): string[] {
        return Array.from(this.registry.keys());
    }
    static create<T>(tableName: string, data: any): T {
        const Ctor = this.registry.get(tableName);
        if (!Ctor) {
            throw new Error(`Không tìm thấy Model cho bảng: ${tableName}`);
        }
        return new Ctor(data);
    }
}

// Đăng ký (thường làm ở file startup)
// EntityFactory.register('TaiKhoan', TaiKhoan);