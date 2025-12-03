import { Required, IsInteger, MinLen } from '../core/decorators/Validators';
import { Default } from '../core/decorators/Transforms';
import { Entity } from '../core/decorators/RegisterEntity';

@Entity('Kho1_TonKhoChiTiet')
export class Kho1_TonKhoChiTiet {
    @Required()
    MaKho: number; // PK, FK

    @Required()
    MaVT: number; // PK, FK

    @Required()
    MaSP: number; // PK, FK

    @Required()
    @IsInteger()
    @MinLen(0)
    @Default(0)
    SoLuongTon: number;

    constructor(init?: Partial<Kho1_TonKhoChiTiet>) {
        this.MaKho = init?.MaKho ?? 0;
        this.MaVT = init?.MaVT ?? 0;
        this.MaSP = init?.MaSP ?? 0;
        this.SoLuongTon = init?.SoLuongTon ?? 0;
    }
}