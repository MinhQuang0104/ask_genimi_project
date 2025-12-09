// src/services/dataService.ts
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { WebProduct, KhoProduct, LoaiHangDB1, LoaiHangDB2, EntityType } from '../models';

const RESOURCE_DIR = path.join(__dirname, '../../resource/data_csv');

/**
 * Đọc và trả về dữ liệu từ một file CSV cụ thể
 * @param source 'datasource1' hoặc 'datasource2'
 * @param fileName Tên file CSV
 * @returns Mảng các object tương ứng
 */
function readCSV<T>(source: 'datasource1' | 'datasource2', fileName: string): T[] {
    const filePath = path.join(RESOURCE_DIR, source, fileName);
    const content = fs.readFileSync(filePath, { encoding: 'utf-8' });
    const records = parse(content, {
        columns: true,
        skip_empty_lines: true
    });
    return records as T[];
}

export const DataService = {
    // Giả lập stream dữ liệu Web (Bảng SanPham)
    getWebProductStream: (): WebProduct[] => 
        readCSV<WebProduct>('datasource1', 'SanPham.csv') as WebProduct[],

    // Giả lập stream dữ liệu Kho (Bảng MatHang)
    getKhoProductStream: (): KhoProduct[] => 
        readCSV<KhoProduct>('datasource2', 'MatHang.csv') as KhoProduct[],
        
    // Dữ liệu LoaiHang (DB1 là DanhMuc, DB2 là LoaiHang)
    getWebLoaiHang: (): LoaiHangDB1[] => 
        readCSV<LoaiHangDB1>('datasource1', 'DanhMuc.csv') as LoaiHangDB1[],

    getKhoLoaiHang: (): LoaiHangDB2[] => 
        readCSV<LoaiHangDB2>('datasource2', 'LoaiHang.csv') as LoaiHangDB2[],
};