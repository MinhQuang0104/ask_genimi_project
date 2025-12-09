// src/config/CsvMappingConfig.ts

export interface IModelConfig {
    idIndex: number;
    nameIndex: number;
    targetModel: string;
    foreignKeys?: {
        colIndex: number;
        parentModel: string;
    }[];
}

export const CSV_CONFIG: Record<string, IModelConfig> = {
    // ========================================================================
    // PHASE 1: MASTER DATA
    // ========================================================================

    // DanhMuc/LoaiHang
    "SOURCE1_DanhMuc": { idIndex: 0, nameIndex: 1, targetModel: "LoaiHang" },
    "SOURCE2_LoaiHang": { idIndex: 0, nameIndex: 1, targetModel: "LoaiHang" },

    // NhaCungCap
    "SOURCE1_NhaCungCap": { idIndex: 0, nameIndex: 1, targetModel: "NhaCungCap" },
    "SOURCE2_NhaCungCap": { idIndex: 0, nameIndex: 1, targetModel: "NhaCungCap" },

    // KhoHang & ViTri
    "SOURCE2_KhoHang": { idIndex: 0, nameIndex: 1, targetModel: "KhoHang" },
    "SOURCE1_ViTriKho": { idIndex: 0, nameIndex: 1, targetModel: "ViTriKho", foreignKeys: [{ colIndex: 2, parentModel: "KhoHang" }] },
    "SOURCE2_ViTriKho": { idIndex: 0, nameIndex: 1, targetModel: "ViTriKho", foreignKeys: [{ colIndex: 2, parentModel: "KhoHang" }] },

    // Thue & KhuyenMai (Thường từ SOURCE1 - Hệ thống quản lý)
    "SOURCE1_Thue": { idIndex: 0, nameIndex: 1, targetModel: "Thue" },
    "SOURCE1_KhuyenMai": { idIndex: 0, nameIndex: 1, targetModel: "KhuyenMai" },

    // --- [SỬA ĐỔI QUAN TRỌNG] WEB DATA CHUYỂN SANG SOURCE2 ---
    
    // TaiKhoan & SoDiaChi
    "SOURCE2_TaiKhoan": { // Đã sửa từ SOURCE1 -> SOURCE2
        idIndex: 0, nameIndex: 1, targetModel: "Web1_TaiKhoan" 
    },
    "SOURCE2_SoDiaChi": { // Đã sửa từ SOURCE1 -> SOURCE2
        idIndex: 0, nameIndex: 2, targetModel: "Web1_SoDiaChi",
        foreignKeys: [{ colIndex: 1, parentModel: "Web1_TaiKhoan" }]
    },

    // ========================================================================
    // PHASE 2: PRODUCT DATA
    // ========================================================================
    "SOURCE1_SanPham": { idIndex: 0, nameIndex: 1, targetModel: "SanPham", foreignKeys: [{ colIndex: 2, parentModel: "LoaiHang" }] },
    "SOURCE2_Website_SanPham": { idIndex: 0, nameIndex: 1, targetModel: "SanPham", foreignKeys: [{ colIndex: 2, parentModel: "LoaiHang" }] },
    "SOURCE2_MatHang": { idIndex: 0, nameIndex: 1, targetModel: "SanPham", foreignKeys: [{ colIndex: 2, parentModel: "LoaiHang" }] },
    
    "SOURCE1_AnhSanPham": { idIndex: 0, nameIndex: 1, targetModel: "AnhSanPham", foreignKeys: [{ colIndex: 1, parentModel: "SanPham" }] },
    "SOURCE1_SanPham_Thue": { idIndex: 0, nameIndex: 0, targetModel: "SanPham_Thue", foreignKeys: [{ colIndex: 0, parentModel: "SanPham" }, { colIndex: 1, parentModel: "Thue" }] },

    // ========================================================================
    // PHASE 3: KHO (Giữ nguyên SOURCE1/SOURCE2 tùy file thực tế)
    // ========================================================================
    "SOURCE1_TonKho": { idIndex: 0, nameIndex: 0, targetModel: "Kho1_TonKho", foreignKeys: [{ colIndex: 1, parentModel: "KhoHang" }, { colIndex: 2, parentModel: "SanPham" }] },
    "SOURCE2_TonKho": { idIndex: 0, nameIndex: 0, targetModel: "Kho1_TonKho", foreignKeys: [{ colIndex: 1, parentModel: "KhoHang" }, { colIndex: 2, parentModel: "SanPham" }] },
    
    "SOURCE1_PhieuNhap": { idIndex: 0, nameIndex: 0, targetModel: "Kho1_PhieuNhap", foreignKeys: [{ colIndex: 2, parentModel: "KhoHang" }, { colIndex: 3, parentModel: "NhaCungCap" }] },
    "SOURCE1_ChiTietNhapHang": { idIndex: 0, nameIndex: 0, targetModel: "Kho1_ChiTietPhieuNhap", foreignKeys: [{ colIndex: 1, parentModel: "Kho1_PhieuNhap" }, { colIndex: 2, parentModel: "SanPham" }] },
    
    "SOURCE2_PhieuXuat": { idIndex: 0, nameIndex: 0, targetModel: "Kho1_PhieuXuat", foreignKeys: [{ colIndex: 2, parentModel: "KhoHang" }] },
    "SOURCE2_ChiTietPhieuXuat": { idIndex: 0, nameIndex: 0, targetModel: "Kho1_ChiTietPhieuXuat", foreignKeys: [{ colIndex: 1, parentModel: "Kho1_PhieuXuat" }, { colIndex: 2, parentModel: "SanPham" }] },
    
    "SOURCE2_VanDon": { idIndex: 0, nameIndex: 1, targetModel: "Kho1_VanDon", foreignKeys: [{ colIndex: 1, parentModel: "Kho1_PhieuXuat" }] },
    
    "SOURCE2_PhieuKiemKe": { idIndex: 0, nameIndex: 0, targetModel: "Kho1_PhieuKiemKe", foreignKeys: [{ colIndex: 2, parentModel: "KhoHang" }] },
    "SOURCE2_ChiTietKiemKe": { idIndex: 0, nameIndex: 0, targetModel: "Kho1_ChiTietKiemKe", foreignKeys: [{ colIndex: 1, parentModel: "Kho1_PhieuKiemKe" }, { colIndex: 2, parentModel: "SanPham" }] },

    // ========================================================================
    // PHASE 4: TRANSACTION (WEB DATA - Đổi hết sang SOURCE2)
    // ========================================================================

    "SOURCE2_HoaDon": { 
        idIndex: 0, nameIndex: 0, targetModel: "Web1_HoaDon",
        foreignKeys: [{ colIndex: 1, parentModel: "Web1_TaiKhoan" }] 
    },
    "SOURCE2_ChiTietHoaDon": {
        idIndex: 0, nameIndex: 0, targetModel: "Web1_ChiTietHoaDon",
        foreignKeys: [{ colIndex: 1, parentModel: "Web1_HoaDon" }, { colIndex: 2, parentModel: "SanPham" }]
    },
    "SOURCE2_GioHang": { 
        idIndex: 0, nameIndex: 0, targetModel: "Web1_GioHang",
        foreignKeys: [{ colIndex: 1, parentModel: "Web1_TaiKhoan" }, { colIndex: 2, parentModel: "SanPham" }]
    },
    "SOURCE2_DanhGia": { 
        idIndex: 0, nameIndex: 0, targetModel: "Web1_DanhGia",
        foreignKeys: [{ colIndex: 1, parentModel: "Web1_TaiKhoan" }, { colIndex: 2, parentModel: "SanPham" }]
    },
    "SOURCE2_ThanhToan": {
        idIndex: 0, nameIndex: 0, targetModel: "Web1_ThanhToan",
        foreignKeys: [{ colIndex: 1, parentModel: "Web1_HoaDon" }]
    },
    "SOURCE2_LichSuDonHang": {
        idIndex: 0, nameIndex: 2, targetModel: "Web1_LichSuDonHang",
        foreignKeys: [{ colIndex: 1, parentModel: "Web1_HoaDon" }]
    }
};