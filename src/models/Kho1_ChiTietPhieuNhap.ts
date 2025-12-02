import { 
    Required, IsInteger, IsDecimal, Min
} from '../core/decorators/Validators';
import { 
    Trim, AlphaNumericOnly, RemoveWhitespace, ToLowerCase, 
    ToUpperCase, Default, DefaultDate 
} from '../core/decorators/Transforms';

import { Entity } from '../core/decorators/RegisterEntity';

// ...existing code...
@Entity('Kho1_ChiTietPhieuNhap')
export class Kho1_ChiTietPhieuNhap {
    @Required()
    MaPN: number;

    @Required()
    MaSP: number;

    @Required()
    @IsInteger()
    @Min(1)
    @Default(1) // [cite: 627]
    SoLuongNhap: number;

    @Required()
    @IsDecimal()
    @Min(0)
    @Default(0) // [cite: 627]
    GiaNhap: number;

    constructor(init?: Partial<Kho1_ChiTietPhieuNhap>) {
        this.MaPN = init?.MaPN ?? 0;
        this.MaSP = init?.MaSP ?? 0;
        this.SoLuongNhap = init?.SoLuongNhap ?? 1;
        this.GiaNhap = init?.GiaNhap ?? 0;
    }
}