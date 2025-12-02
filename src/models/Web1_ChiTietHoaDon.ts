import { 
    Required, IsInteger, IsDecimal, Min
} from '../core/decorators/Validators';
import { 
    Default
} from '../core/decorators/Transforms';

import { Entity } from '../core/decorators/RegisterEntity';

// ...existing code...
@Entity('Web1_ChiTietHoaDon')
export class Web1_ChiTietHoaDon {
    @Required()
    MaHD: number;

    @Required()
    MaSP: number;

    @Required()
    @IsInteger()
    @Min(1) // isPositive (>0)
    @Default(1) // [cite: 656]
    SoLuong: number;

    @Required()
    @IsDecimal()
    @Min(0)
    @Default(0) // [cite: 656]
    GiaBanLucDat: number;

    PhanTramThue: number;

    @IsDecimal() // [cite: 656]
    ThanhTien: number;

    constructor(init?: Partial<Web1_ChiTietHoaDon>) {
        this.MaHD = init?.MaHD ?? 0;
        this.MaSP = init?.MaSP ?? 0;
        this.SoLuong = init?.SoLuong ?? 1;
        this.GiaBanLucDat = init?.GiaBanLucDat ?? 0;
        this.PhanTramThue = init?.PhanTramThue ?? 0;
        this.ThanhTien = init?.ThanhTien ?? 0;
    }
}