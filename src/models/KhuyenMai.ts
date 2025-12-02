import { 
    Required, IsDecimal, Min, InSet
} from '../core/decorators/Validators';
import { 
    Trim, AlphaNumericOnly, RemoveWhitespace, ToLowerCase, 
    ToUpperCase, Default, DefaultDate 
} from '../core/decorators/Transforms';

import { Entity } from '../core/decorators/RegisterEntity';

// ...existing code...
@Entity('KhuyenMai')
export class KhuyenMai {
    MaKM: number;

    @Required()
    @Trim()
    @AlphaNumericOnly() // 
    TenKM: string;

    @ToUpperCase() // 
    MaCode: string;

    @Required()
    @InSet([1, 2])
    @Default(1) // 
    LoaiKM: number; 

    @Required()
    @IsDecimal()
    @Min(0)
    @Default(0) // 
    GiaTriGiam: number;

    DieuKienTongTien: number;

    @Required()
    @DefaultDate('now') // 
    NgayBatDau: Date;

    @Required()
    NgayKetThuc: Date; // Rule check isAfterOrEqual(NgayBatDau) cần xử lý ở tầng Service hoặc Class Validator phức tạp hơn

    @Trim() // 
    DieuKienApDung: string;

    TrangThai: boolean;

    constructor(init?: Partial<KhuyenMai>) {
        this.MaKM = init?.MaKM ?? 0;
        this.TenKM = init?.TenKM ?? '';
        this.MaCode = init?.MaCode ?? '';
        this.LoaiKM = init?.LoaiKM ?? 0;
        this.GiaTriGiam = init?.GiaTriGiam ?? 0;
        this.DieuKienTongTien = init?.DieuKienTongTien ?? 0;
        this.NgayBatDau = init?.NgayBatDau ?? new Date();
        this.NgayKetThuc = init?.NgayKetThuc ?? new Date();
        this.DieuKienApDung = init?.DieuKienApDung ?? '';
        this.TrangThai = init?.TrangThai ?? true;
    }
}