// src/core/integration/SchemaConfig.ts

// 1. Định nghĩa Header của file CSV nguồn (Dựa trên dữ liệu thực tế bạn cung cấp)
// 1. Định nghĩa Header của file CSV nguồn (theo schema SQL thực tế)
export const SOURCE_HEADERS: Record<string, string[]> = {
  // =============== DATASOURCE 1 : KHO ==================
  SOURCE1_LoaiHang: ["MaLoaiHang", "TenLoaiHang"],
  SOURCE1_MatHang: ["MaSP", "TenSP", "MaLoaiHang", "SoLuong", "GiaNhap", "GiaBan", "TrangThai"],
  SOURCE1_KhoHang: ["MaKho", "TenKho", "DiaChiKho"],
  SOURCE1_ViTriKho: ["MaVT", "MaKho", "TenViTri", "TrangThaiViTri"],
  SOURCE1_NhaCungCap: ["MaNCC", "TenNCC", "DiaChiNCC"],
  SOURCE1_PhieuNhap: ["MaPN", "MaNCC", "MaKho", "NgayNhap", "TongTienNhap", "TrangThaiPN"],
  SOURCE1_ChiTietNhapHang: ["MaCTNH", "MaPN", "MaSP", "SoLuong", "DonGia"],
  SOURCE1_PhieuXuat: ["MaPX", "MaVD", "MaKho", "NgayLap", "TrangThaiPX"],
  SOURCE1_ChiTietPhieuXuat: ["MaPX", "MaSP", "SoLuongXuat"],
  SOURCE1_PhieuKiemKe: ["MaKK", "MaKho", "LoaiKiemKe", "NgayLap", "TrangThaiKK"],
  SOURCE1_ChiTietKiemKe: ["MaKK", "MaSP", "SoLuongHeThong", "SoLuongDemDuoc", "SoLuongChenhLech", "LyDo"],
  SOURCE1_PhieuTraHang: ["MaPTH", "MaHD", "LyDoTra", "NgayTao", "TrangThaiPTH"],
  SOURCE1_ChiTietTraHang: ["MaPTH", "MaSP", "SoLuongTra", "LyDoTra", "TinhTrangHangTra"],
  SOURCE1_TonKho: ["MaSP", "SoLuongTon", "SoLuongTamGiu", "SoLuongKhaDung", "NgayCapNhat"],
  SOURCE1_TonKhoChiTiet: ["MaSP", "MaVT", "SoLuongTon"],
  SOURCE1_VanDon: ["MaVD", "MaHD", "MaKhoXuat", "MaPX", "NgayKhoiTao", "TrangThaiVanDon", "GhiChu"],
  SOURCE1_Website_SanPham: ["MaSP", "TenSP", "GiaSP"],

  // =============== DATASOURCE 2 : WEB ==================
  SOURCE2_DanhMuc: ["MaDM", "TenDM", "MoTa"],
  SOURCE2_SanPham: ["MaSP", "TenSP", "MaDM", "MoTaChiTiet", "GiaBan", "SoLuongTon", "NhaSanXuat"],
  SOURCE2_AnhSanPham: ["MaAnh", "MaSP", "Anh"],
  SOURCE2_TaiKhoan: ["MaTK", "TenDangNhap", "MatKhau", "HoTen", "Email", "SoDienThoai", "LoaiTaiKhoan", "NgayTao"],
  SOURCE2_HoaDon: ["MaHD", "MaTK", "NgayDat", "TongTien", "TrangThaiDonHang", "DiaChiGiaoHang", "SoDienThoaiNguoiNhan", "TenNguoiNhan", "PhuongThucThanhToan", "GhiChuKhachHang"],
  SOURCE2_ChiTietHoaDon: ["MaHD", "MaSP", "SoLuong", "GiaBanLucDat", "ThanhTien"],
  SOURCE2_KhuyenMai: ["MaKM", "TenKM", "MaCode", "LoaiKM", "GiaTriGiam", "NgayBatDau", "NgayKetThuc", "DieuKienApDung", "SoLuongPhatHanh", "SoLuongDaDung"],
  SOURCE2_ChiTietKhuyenMai: ["MaHD", "MaKM", "GiaTriDaGiam"],
  SOURCE2_LichSuDonHang: ["MaLSDH", "MaHD", "NgayThayDoi", "GhiChu"],
  SOURCE2_ThanhToan: ["MaTT", "MaHD", "PhuongThucTT", "TongTien", "TrangThaiTT", "NgayTao"],
  SOURCE2_DanhGia: ["MaDG", "MaTK", "MaSP", "MaHD", "DiemDanhGia", "NoiDung", "NgayDG"],
  SOURCE2_GioHang: ["MaGH", "MaTK", "MaSP", "SoLuong"],
  SOURCE2_SoDiaChi: ["MaDC", "MaTK", "TenNguoiNhan", "SoDienThoaiNguoiNhan", "DiaChiChiTiet", "LaMacDinh"],
  SOURCE2_Thue: ["MaThue", "TenThue", "PhanTramThue"],
  SOURCE2_SanPham_Thue: ["MaSP", "MaThue"],
};

// Các alias để ánh xạ tên file nguồn không đồng nhất sang key đã định nghĩa
export const SOURCE_ALIASES: Record<string, string> = {
  // Một số datasource (hoặc tên file) sử dụng tên khác nhau: "LoaiHang" ~ "DanhMuc", "MatHang" ~ "SanPham"
  SOURCE2_LoaiHang: "SOURCE2_DanhMuc",
  SOURCE2_MatHang: "SOURCE2_SanPham",
  SOURCE2_Website_SanPham: "SOURCE2_SanPham",
};

// 2. Cấu hình Mapping từ Nguồn -> Đích (Target Model)
export const FIELD_MAPPING: Record<string, any> = {
  // =================== DANH MỤC ========================
  LoaiHang: {
    TenLoaiHang: ["TenLoaiHang", "TenDM"],
    MoTa: ["MoTa"],
  },
  DanhMuc: {
    TenDM: ["TenDM", "TenLoaiHang"],
    MoTa: ["MoTa"],
  },
  // =================== SẢN PHẨM ========================
  SanPham: {
    TenSP: ["TenSP", "TenHang"],
    GiaBan: ["GiaBan", "GiaSP"],
    GiaNhap: ["GiaNhap"],
    SoLuongTon: ["SoLuongTon", "SoLuong"],
    MoTaChiTiet: ["MoTaChiTiet"],
    NhaSanXuat: ["NhaSanXuat"],
    TrangThai: ["TrangThai"],

    // FK (resolve sau)
    MaLoaiHang: ["MaLoaiHang", "MaDM"],
    MaThue: ["MaThue"],
  },
  // ================= NHÀ CUNG CẤP ======================
  NhaCungCap: {
    TenNCC: ["TenNCC", "TenNhaCungCap"],
    DiaChiNCC: ["DiaChiNCC", "DiaChi"],
    SoDienThoai: ["SoDienThoai", "SDT"],
    Email: ["Email"],
  },
  // =================== KHO HÀNG ========================
  KhoHang: {
    TenKho: ["TenKho"],
    DiaChiKho: ["DiaChiKho", "DiaChi"],
  },
  ViTriKho: {
    TenViTri: ["TenViTri"],
    TrangThaiViTri: ["TrangThaiViTri", "TrangThai"],
    // FK
    MaKho: ["MaKho"],
  },
  // =================== TỒN KHO =========================
  TonKho: {
    SoLuongTon: ["SoLuongTon"],
    SoLuongTamGiu: ["SoLuongTamGiu"],
    SoLuongKhaDung: ["SoLuongKhaDung"],
    NgayCapNhat: ["NgayCapNhat", "UpdatedAt"],
    // FK
    MaSP: ["MaSP"],
  },
  TonKhoChiTiet: {
    SoLuongTon: ["SoLuongTon"],
    // FK
    MaSP: ["MaSP"],
    MaVT: ["MaVT"],
  },
  // =================== PHIẾU NHẬP ======================
  PhieuNhap: {
    NgayNhap: ["NgayNhap", "NgayTao"],
    TongTienNhap: ["TongTienNhap", "TongTien"],
    TrangThaiPN: ["TrangThaiPN", "TrangThai"],
    // FK
    MaNCC: ["MaNCC"],
    MaKho: ["MaKho"],
  },
  ChiTietNhapHang: {
    SoLuong: ["SoLuong"],
    DonGia: ["DonGia", "GiaNhap"],
    // FK
    MaPN: ["MaPN"],
    MaSP: ["MaSP"],
  },
  // =================== PHIẾU XUẤT ======================
  PhieuXuat: {
    NgayLap: ["NgayLap", "NgayTao"],
    TrangThaiPX: ["TrangThaiPX", "TrangThai"],
    // FK
    MaKho: ["MaKho"],
    MaVD: ["MaVD"],
  },
  ChiTietPhieuXuat: {
    SoLuongXuat: ["SoLuongXuat", "SoLuong"],
    // FK
    MaPX: ["MaPX"],
    MaSP: ["MaSP"],
  },
  // =================== KIỂM KÊ =========================
  PhieuKiemKe: {
    LoaiKiemKe: ["LoaiKiemKe"],
    NgayLap: ["NgayLap"],
    TrangThaiKK: ["TrangThaiKK", "TrangThai"],
    // FK
    MaKho: ["MaKho"],
  },
  ChiTietKiemKe: {
    SoLuongHeThong: ["SoLuongHeThong"],
    SoLuongDemDuoc: ["SoLuongDemDuoc"],
    SoLuongChenhLech: ["SoLuongChenhLech"],
    LyDo: ["LyDo"],
    // FK
    MaKK: ["MaKK"],
    MaSP: ["MaSP"],
  },
  // =================== WEBSITE =========================
  Web1_HoaDon: {
    NgayDat: ["NgayDat", "NgayTao"],
    TongTienHang: ["TongTien", "TongTienHang"],
    TrangThaiDonHang: ["TrangThaiDonHang", "TrangThai"],
    DiaChiGiaoHang: ["DiaChiGiaoHang"],

    // FK
    MaTK: ["MaTK"],
  },
  Web1_ChiTietHoaDon: {
    SoLuong: ["SoLuong"],
    GiaBanLucDat: ["GiaBanLucDat", "DonGia"],
    ThanhTien: ["ThanhTien"],

    // FK
    MaHD: ["MaHD"],
    MaSP: ["MaSP"],
  },
  Web1_ThanhToan: {
    PhuongThucTT: ["PhuongThucTT", "PhuongThucThanhToan"],
    TongTien: ["TongTien"],
    TrangThaiTT: ["TrangThaiTT", "TrangThai"],
    NgayTao: ["NgayTao"],

    // FK
    MaHD: ["MaHD"],
  },
  Web1_DanhGia: {
    DiemDanhGia: ["DiemDanhGia", "Diem"],
    NoiDung: ["NoiDung", "Comment"],
    NgayDG: ["NgayDG"],

    // FK
    MaTK: ["MaTK"],
    MaSP: ["MaSP"],
    MaHD: ["MaHD"],
  },
  // =================== THUẾ ============================
  Thue: {
    TenThue: ["TenThue"],
    PhanTramThue: ["PhanTramThue", "TyLeThue"],
  },
};

// 3. Định nghĩa các trường dùng để định danh (Identity) cho Fuzzy Matching
// Nếu trùng các trường này -> Coi là cùng 1 bản ghi
export const IDENTITY_FIELDS: Record<string, string[]> = {
  
    // ===== MASTER DATA =====
  Thue: ["TenThue", "PhanTramThue"],
  LoaiHang: ["TenLoaiHang"],
  NhaCungCap: ["TenNCC", "Email", "SoDienThoai"],
  KhoHang: ["TenKho"],
  ViTriKho: ["TenViTri", "MaKho"],
  SanPham: ["TenSP", "MaLoaiHang"],
  AnhSanPham: ["MaSP", "TenFileAnh"],
  KhuyenMai: ["TenKM", "MaCode"],
  
  // ===== WEBSITE =====
  Web1_TaiKhoan: ["TenDangNhap", "Email"],
  Web1_SoDiaChi: ["MaTK", "DiaChiChiTiet"],
  // Hóa đơn thường không fuzzy match
  Web1_HoaDon: [],
  Web1_DanhGia: ["MaTK", "MaSP", "MaHD"],
  Web1_GioHang: ["MaTK", "MaSP"],
  Web1_ThanhToan: ["MaHD", "PhuongThucTT"],
  Web1_LichSuDonHang: ["MaHD", "TrangThaiDonHang", "NgayThayDoi"],
  
  // ===== KHO =====
  Kho1_PhieuNhap: ["MaNCC", "MaKho", "NgayNhap"],
  Kho1_PhieuXuat: ["MaKho", "MaHD", "NgayLap"],
  Kho1_VanDon: ["MaHD", "MaVanDonVanChuyen"],
  Kho1_PhieuTraHang: ["MaHD", "NgayTao"],
  Kho1_PhieuKiemKe: ["MaKho", "NgayLap"],
  
  // ===== TỒN KHO =====
  Kho1_TonKho: ["MaKho", "MaSP"],
  Kho1_TonKhoChiTiet: ["MaKho", "MaVT", "MaSP"],
}

// 4. Định nghĩa các trường Khóa Ngoại (Foreign Key) cần Remap ID
export const FK_RELATIONS: Record<string, Record<string, string>> = {
  // ===== MASTER DATA =====
  SanPham: {
    MaLoaiHang: "LoaiHang",
    MaThue: "Thue",
  },

  AnhSanPham: {
    MaSP: "SanPham",
  },

  SanPham_KhuyenMai: {
    MaSP: "SanPham",
    MaKM: "KhuyenMai",
  },

  ViTriKho: {
    MaKho: "KhoHang",
  },

  // ===== WEBSITE =====
  Web1_SoDiaChi: {
    MaTK: "Web1_TaiKhoan",
  },

  Web1_HoaDon: {
    MaTK: "Web1_TaiKhoan",
    MaKM: "KhuyenMai",
  },

  Web1_ChiTietHoaDon: {
    MaHD: "Web1_HoaDon",
    MaSP: "SanPham",
  },

  Web1_DanhGia: {
    MaTK: "Web1_TaiKhoan",
    MaSP: "SanPham",
    MaHD: "Web1_HoaDon",
  },

  Web1_GioHang: {
    MaTK: "Web1_TaiKhoan",
    MaSP: "SanPham",
  },

  Web1_ThanhToan: {
    MaHD: "Web1_HoaDon",
  },

  Web1_LichSuDonHang: {
    MaHD: "Web1_HoaDon",
  },

  // ===== KHO =====
  Kho1_PhieuNhap: {
    MaNCC: "NhaCungCap",
    MaKho: "KhoHang",
  },

  Kho1_ChiTietPhieuNhap: {
    MaPN: "Kho1_PhieuNhap",
    MaSP: "SanPham",
  },

  Kho1_PhieuXuat: {
    MaKho: "KhoHang",
    MaHD: "Web1_HoaDon",
  },

  Kho1_ChiTietPhieuXuat: {
    MaPX: "Kho1_PhieuXuat",
    MaSP: "SanPham",
  },

  Kho1_VanDon: {
    MaHD: "Web1_HoaDon",
    MaPX: "Kho1_PhieuXuat",
  },

  Kho1_TonKho: {
    MaKho: "KhoHang",
    MaSP: "SanPham",
  },

  Kho1_TonKhoChiTiet: {
    MaKho: "KhoHang",
    MaVT: "ViTriKho",
    MaSP: "SanPham",
  },

  Kho1_PhieuTraHang: {
    MaHD: "Web1_HoaDon",
    MaKho: "KhoHang",
  },

  Kho1_ChiTietTraHang: {
    MaPTH: "Kho1_PhieuTraHang",
    MaSP: "SanPham",
  },

  Kho1_PhieuKiemKe: {
    MaKho: "KhoHang",
  },

  Kho1_ChiTietKiemKe: {
    MaKK: "Kho1_PhieuKiemKe",
    MaSP: "SanPham",
  },
};
