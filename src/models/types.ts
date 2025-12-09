// src/models/types.ts

// Interface cho dữ liệu đọc từ CSV (Raw Data)
export interface WebProduct {
    MaSP: any; // Dùng any tạm thời hoặc string vì CSV đọc ra là string
    TenSP: string;
    MaDM: any;
    GiaBan: any;
    MoTaChiTiet: string;
}

export interface KhoProduct {
    MaSP: any;
    TenSP: string;
    MaLoaiHang: any;
    GiaNhap: any;
    SoLuong: any;
}

export interface LoaiHangDB1 {
    MaDM: any;
    TenDM: string;
    MoTa: string;
}

export interface LoaiHangDB2 {
    MaLoaiHang: any;
    TenLoaiHang: string;
}

// Interface cho dữ liệu sau khi Gộp (Merged Data)
export interface MergedProduct {
    MaSP: string; // UUID
    TenSP: string;
    MaLoaiHang: string; // UUID
    GiaBan: number;
    GiaNhap: number;
    SoLuongTon: number;
    MoTa: string | null;
    SourceIDs: { source: 'WEB' | 'KHO', id: any }[];
}

export interface MergedLoaiHang {
    MaLoaiHang: string; // UUID
    TenLoaiHang: string;
    MoTa: string | null;
    SourceIDs: { source: 'WEB' | 'KHO', id: any }[];
}

// Interface cho bảng Mapping
export interface IdMapping {
    OriginalSource: 'WEB' | 'KHO';
    OriginalID: any; // ID gốc có thể là string hoặc number
    NewID: string;   // UUID mới
    Entity: 'SAN_PHAM' | 'LOAI_HANG';
}

export type EntityType = 'SAN_PHAM' | 'LOAI_HANG';