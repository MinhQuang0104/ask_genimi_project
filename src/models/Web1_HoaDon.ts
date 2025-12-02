import { 
    Required, IsDecimal, Min, InSet, 
    IsPhoneNumber, MaxDate
} from '../core/decorators/Validators';
import { 
    Trim, Default, DefaultDate 
} from '../core/decorators/Transforms';

import { Entity } from '../core/decorators/RegisterEntity';

// ...existing code...
@Entity('Web1_HoaDon')
export class Web1_HoaDon {
    MaHD: number;
    MaTK: number;
    MaKM: number;

    @DefaultDate('now')
    @MaxDate('now') // [cite: 652]
    NgayDat: Date;

    TongTienHang: number;
    SoTienGiam: number;

    @IsDecimal()
    @Min(0)
    @Default(0) // [cite: 652]
    TongTienThanhToan: number;

    @Required()
    @InSet([1, 2, 3, 4, 5])
    @Default(1) // [cite: 652]
    TrangThaiDonHang: number; 

    @Required()
    @Trim() // [cite: 652]
    DiaChiGiaoHang: string;

    @Required()
    @IsPhoneNumber() // [cite: 652]
    SoDienThoaiNguoiNhan: string;

    @Required()
    @Trim() // [cite: 652]
    TenNguoiNhan: string;

    constructor(init?: Partial<Web1_HoaDon>) {
        this.MaHD = init?.MaHD ?? 0;
        this.MaTK = init?.MaTK ?? 0;
        this.MaKM = init?.MaKM ?? 0;
        this.NgayDat = init?.NgayDat ?? new Date();
        this.TongTienHang = init?.TongTienHang ?? 0;
        this.SoTienGiam = init?.SoTienGiam ?? 0;
        this.TongTienThanhToan = init?.TongTienThanhToan ?? 0;
        this.TrangThaiDonHang = init?.TrangThaiDonHang ?? 1;
        this.DiaChiGiaoHang = init?.DiaChiGiaoHang ?? '';
        this.SoDienThoaiNguoiNhan = init?.SoDienThoaiNguoiNhan ?? '';
        this.TenNguoiNhan = init?.TenNguoiNhan ?? '';
    }
}