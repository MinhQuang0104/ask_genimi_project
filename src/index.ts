// src/index.ts
import { StagingService } from './services/StagingService';
import { FuzzyMergeService } from './services/FuzzyMergeService';
import { DataService } from './services/dataService';

async function runDataIntegration() {
    const staging = new StagingService();
    const merger = new FuzzyMergeService(staging);

    staging.log('\n======================================================');
    staging.log('>>> BẮT ĐẦU MÔ PHỎNG TÍCH HỢP DỮ LIỆU (FUZZY MATCHING) <<<');
    staging.log('======================================================');

    // --- BƯỚC 1: GỘP MASTER DATA LOAIHANG ---
    staging.log('\n[PHASE 1] Xử lý Bảng LOAIHANG (DanhMuc DB1 + LoaiHang DB2)...');
    
    const webLoaiHangStream = DataService.getWebLoaiHang();
    webLoaiHangStream.forEach(data => merger.processLoaiHangStream(data, 'WEB'));

    const khoLoaiHangStream = DataService.getKhoLoaiHang();
    khoLoaiHangStream.forEach(data => merger.processLoaiHangStream(data, 'KHO'));

    // --- BƯỚC 2: GỘP MASTER DATA SANPHAM ---
    staging.log('\n[PHASE 2] Xử lý Bảng SANPHAM (SanPham DB1 + MatHang DB2)...');
    
    // Đọc bảng mapping đã sinh ra ở bước 1
    const loaiHangMapping = staging.readStagingFile('IdMapping.json');

    const webProductStream = DataService.getWebProductStream();
    webProductStream.forEach(data => merger.processProductStream(data, 'WEB', loaiHangMapping));

    const khoProductStream = DataService.getKhoProductStream();
    khoProductStream.forEach(data => merger.processProductStream(data, 'KHO', loaiHangMapping));

    // --- BƯỚC 3: XỬ LÝ DỮ LIỆU GIAO DỊCH (DEMO) ---
    merger.processTransactionData();

    staging.log('\n======================================================');
    staging.log('>>> HOÀN THÀNH TÍCH HỢP. Kiểm tra thư mục /staging/ <<<');
    staging.log('======================================================');
}

runDataIntegration().catch(console.error);