// src/services/FuzzyMergeService.ts
import Fuse from 'fuse.js';
import { v4 as uuidv4 } from 'uuid';
import { StagingService } from './StagingService';
import { WebProduct, KhoProduct, MergedProduct, IdMapping, LoaiHangDB1, LoaiHangDB2, MergedLoaiHang } from '../models';

export class FuzzyMergeService {
    private staging: StagingService;

    constructor(stagingService: StagingService) {
        this.staging = stagingService;
    }

    // **********************************************
    // 1. GỘP BẢNG LOAIHANG (MASTER DATA)
    // **********************************************
    processLoaiHangStream(loaiHangData: LoaiHangDB1 | LoaiHangDB2, source: 'WEB' | 'KHO') {
        const currentData = this.staging.readStagingFile<MergedLoaiHang>('LoaiHang.json');
        const originalID = source === 'WEB' ? (loaiHangData as LoaiHangDB1).MaDM : (loaiHangData as LoaiHangDB2).MaLoaiHang;
        const name = source === 'WEB' ? (loaiHangData as LoaiHangDB1).TenDM : (loaiHangData as LoaiHangDB2).TenLoaiHang;

        this.staging.log(`   [LoaiHang] Đang xử lý ${source} ID ${originalID}: ${name}`);

        const fuse = new Fuse(currentData, {
            keys: ['TenLoaiHang'],
            threshold: 0.2, // Ngưỡng rất chặt cho danh mục
            includeScore: true
        });

        const searchResult = fuse.search(name);
        let finalId = '';
        let matchFound = false;

        if (searchResult.length > 0) {
            const bestMatch = searchResult[0];
            // Nếu độ giống > 0.1 (rất giống) -> Gộp
            if (bestMatch.score && bestMatch.score < 0.1) {
                matchFound = true;
                finalId = bestMatch.item.MaLoaiHang;
                this.staging.log(`      [MATCH] Gộp vào ID mới: ${finalId} (Score: ${bestMatch.score.toFixed(3)})`);

                // Cập nhật mô tả nếu nguồn WEB có
                if (source === 'WEB' && (loaiHangData as LoaiHangDB1).MoTa) {
                    bestMatch.item.MoTa = (loaiHangData as LoaiHangDB1).MoTa;
                }
            }
        }

        if (!matchFound) {
            finalId = uuidv4();
            this.staging.log(`      [NEW] Tạo ID mới: ${finalId}`);

            const newRecord: MergedLoaiHang = {
                MaLoaiHang: finalId,
                TenLoaiHang: name,
                MoTa: source === 'WEB' ? (loaiHangData as LoaiHangDB1).MoTa : null,
                SourceIDs: [{ source, id: originalID }]
            };
            currentData.push(newRecord);
        } else {
             // Nếu gộp, thêm ID nguồn vào SourceIDs
            const index = currentData.findIndex(p => p.MaLoaiHang === finalId);
            if (index !== -1) {
                 currentData[index].SourceIDs.push({ source, id: originalID });
            }
        }

        // Lưu Mapping ID (Cần thiết cho FK của SanPham)
        this.staging.saveIdMapping({
            OriginalSource: source,
            OriginalID: originalID,
            NewID: finalId,
            Entity: 'LOAI_HANG'
        });

        this.staging.writeStagingFile('LoaiHang.json', currentData);
    }

    // **********************************************
    // 2. GỘP BẢNG SANPHAM (MASTER DATA)
    // **********************************************
    processProductStream(productData: WebProduct | KhoProduct, source: 'WEB' | 'KHO', mappingService: IdMapping[]) {
        const currentData = this.staging.readStagingFile<MergedProduct>('SanPham.json');
        const originalID = productData.MaSP;
        const name = productData.TenSP;

        this.staging.log(`   [SanPham] Đang xử lý ${source} ID ${originalID}: ${name}`);

        // 2.1. Chuẩn hóa MaLoaiHang
        const originalLoaiHangID = source === 'WEB' ? (productData as WebProduct).MaDM : (productData as KhoProduct).MaLoaiHang;
        const mappedLoaiHang = mappingService.find(m => m.Entity === 'LOAI_HANG' && m.OriginalSource === source && m.OriginalID === originalLoaiHangID);

        if (!mappedLoaiHang) {
            this.staging.log(`      [WARNING] Không tìm thấy ánh xạ cho MaLoaiHang ${originalLoaiHangID}. Bỏ qua record này.`, true);
            return;
        }

        const newLoaiHangID = mappedLoaiHang.NewID;

        // 2.2. Fuzzy Matching trên TenSP
        const fuse = new Fuse(currentData, {
            keys: ['TenSP'],
            threshold: 0.35, // Ngưỡng trung bình cho tên sản phẩm
            includeScore: true
        });

        const searchResult = fuse.search(name);
        let finalId = '';
        let matchFound = false;

        if (searchResult.length > 0) {
            const bestMatch = searchResult[0];
            if (bestMatch.score && bestMatch.score < 0.2) { // Rất giống nhau
                matchFound = true;
                finalId = bestMatch.item.MaSP;
                this.staging.log(`      [MATCH] Gộp vào ID mới: ${finalId} (Score: ${bestMatch.score.toFixed(3)})`);

                // CẬP NHẬT DỮ LIỆU GỘP (Strategy: Ưu tiên dữ liệu Kho cho giá nhập/tồn, dữ liệu Web cho giá bán)
                const existingProduct = bestMatch.item;

                if (source === 'KHO') {
                    const khoData = productData as KhoProduct;
                    existingProduct.GiaNhap = khoData.GiaNhap;
                    existingProduct.SoLuongTon = khoData.SoLuong;
                } else if (source === 'WEB') {
                    const webData = productData as WebProduct;
                    existingProduct.GiaBan = webData.GiaBan;
                }
                existingProduct.MaLoaiHang = newLoaiHangID; // Cập nhật FK đã ánh xạ
                 // Cập nhật SourceIDs
                existingProduct.SourceIDs.push({ source, id: originalID });
            }
        }

        // 2.3. INSERT (Tạo mới)
        if (!matchFound) {
            finalId = uuidv4();
            this.staging.log(`      [NEW] Tạo ID mới: ${finalId}`);

            const newRecord: MergedProduct = {
                MaSP: finalId,
                TenSP: name,
                MaLoaiHang: newLoaiHangID,
                GiaBan: source === 'WEB' ? (productData as WebProduct).GiaBan : 0,
                GiaNhap: source === 'KHO' ? (productData as KhoProduct).GiaNhap : 0,
                SoLuongTon: source === 'KHO' ? (productData as KhoProduct).SoLuong : 0,
                MoTa: source === 'WEB' ? (productData as WebProduct).MoTa : null,
                SourceIDs: [{ source, id: originalID }]
            };
            currentData.push(newRecord);
        }

        // 2.4. Lưu Mapping ID cho SanPham
        this.staging.saveIdMapping({
            OriginalSource: source,
            OriginalID: originalID,
            NewID: finalId,
            Entity: 'SAN_PHAM'
        });

        this.staging.writeStagingFile('SanPham.json', currentData);
    }
    
    // **********************************************
    // 3. XỬ LÝ DỮ LIỆU GIAO DỊCH (TRANSACTION DATA)
    // **********************************************
    processTransactionData() {
        this.staging.log('\n--- Bắt đầu tích hợp Dữ liệu Giao dịch ---');
        
        // Đọc bảng mapping
        const mapping = this.staging.readStagingFile<IdMapping>('IdMapping.json');

        // Bảng giao dịch từ WEB (Web1_ChiTietHoaDon)
        const webDetails = DataService.getWebProductStream(); // Dùng tạm SanPham.csv để mô phỏng data
        
        this.staging.log(`   [Web1_ChiTietHoaDon] Bắt đầu Ánh xạ ${webDetails.length} dòng.`);

        const mappedTransactions = webDetails.map(item => {
            const productMap = mapping.find(m => m.Entity === 'SAN_PHAM' && m.OriginalSource === 'WEB' && m.OriginalID === item.MaSP);
            
            if (productMap) {
                return {
                    // Các trường khác...
                    MaSP_New: productMap.NewID,
                    MaSP_Old: item.MaSP,
                    TenSP: item.TenSP // Dùng để kiểm tra
                };
            } else {
                this.staging.log(`      [ORPHAN] Lỗi: Không tìm thấy ID ánh xạ cho MaSP (Web) ${item.MaSP}. Bỏ qua.`, true);
                return null;
            }
        }).filter(item => item !== null);

        this.staging.writeStagingFile('Web1_ChiTietHoaDon_Staging.json', mappedTransactions);
        this.staging.log(`   [Web1_ChiTietHoaDon] Hoàn thành ánh xạ ${mappedTransactions.length} dòng. Khóa ngoại đã được sửa.`);
    }
}