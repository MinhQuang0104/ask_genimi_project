import { Required, IsInteger, IsDecimal, Min, IsUrlOrPath } from '../core/decorators/Validators';
import { Trim, AlphaNumericOnly, Default} from '../core/decorators/Transforms';
import { Entity } from '../core/decorators/RegisterEntity';
import { UniqueKey } from '../core/decorators/Unique';

@Entity('SanPham')
export class SanPham {
    @UniqueKey()
    MaSP: number;

    @Required()
    @Trim()
    @AlphaNumericOnly() // [cite: 646]
    TenSP: string;

    @Required()
    MaDM: number;

    MaThue: number;

    @Trim()
    @AlphaNumericOnly() // [cite: 646]
    MoTaChiTiet: string;

    @Required()
    @IsDecimal()
    @Min(0)
    @Default(0) // [cite: 646]
    GiaBan: number;

    @Required()
    @IsInteger()
    @Min(0)
    @Default(0) // [cite: 646]
    SoLuongTon: number;

    @Trim()
    @AlphaNumericOnly() // [cite: 646]
    NhaSanXuat: string;

    @Trim()
    @IsUrlOrPath() //  (Áp dụng logic từ bảng AnhSanPham cho cột HinhAnh nếu cần)
    HinhAnh: string;

    TrangThai: boolean;

    constructor(init?: Partial<SanPham>) {
        this.MaSP = init?.MaSP ?? 0;
        this.TenSP = init?.TenSP ?? '';
        this.MaDM = init?.MaDM ?? 0;
        this.MaThue = init?.MaThue ?? 0;
        this.MoTaChiTiet = init?.MoTaChiTiet ?? '';
        this.GiaBan = init?.GiaBan ?? 0;
        this.SoLuongTon = init?.SoLuongTon ?? 0;
        this.NhaSanXuat = init?.NhaSanXuat ?? '';
        this.HinhAnh = init?.HinhAnh ?? '';
        this.TrangThai = init?.TrangThai ?? true;
    }
}