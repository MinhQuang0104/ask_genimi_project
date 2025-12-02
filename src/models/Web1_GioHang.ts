import {Required, IsInteger, Min} from '../core/decorators/Validators';
import { Default} from '../core/decorators/Transforms';
import { Entity } from '../core/decorators/RegisterEntity';
import { UniqueKey } from '../core/decorators/Unique';

@Entity('Web1_GioHang')
export class Web1_GioHang {
    @UniqueKey()
    MaGH: number;
    
    @UniqueKey()
    MaTK: number;

    @Required()
    MaSP: number;

    @Required()
    @IsInteger()
    @Min(1)
    @Default(1) // [cite: 654]
    SoLuong: number;

    NgayCapNhat: Date;

    constructor(init?: Partial<Web1_GioHang>) {
        this.MaGH = init?.MaGH ?? 0;
        this.MaTK = init?.MaTK ?? 0;
        this.MaSP = init?.MaSP ?? 0;
        this.SoLuong = init?.SoLuong ?? 1;
        this.NgayCapNhat = init?.NgayCapNhat ?? new Date();
    }
}