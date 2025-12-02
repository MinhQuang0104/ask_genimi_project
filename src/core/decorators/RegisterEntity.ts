import 'reflect-metadata';
import { EntityFactory } from '../EntityFactory';

export function Entity(tableName: string) {
  console.log("in Entity decorator of TABLE: ", tableName)
  return function (target: any) {
    // Tự động đăng ký Class vào Factory ngay khi chương trình khởi chạy
    EntityFactory.register(tableName, target);
  };
}