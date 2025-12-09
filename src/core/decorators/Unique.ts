import 'reflect-metadata';

export const UNIQUE_METADATA_KEY = Symbol('unique:key');

// Đánh dấu property này là một phần của khóa duy nhất (Composite Key)
export function UniqueKey() {
    return function (target: any, propertyKey: string) {
        let keys: string[] = Reflect.getMetadata(UNIQUE_METADATA_KEY, target) || [];
        keys.push(propertyKey);
        Reflect.defineMetadata(UNIQUE_METADATA_KEY, keys, target);
    };
}