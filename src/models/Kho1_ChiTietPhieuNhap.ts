import { Required, IsInteger, IsDecimal, Min} from '../core/decorators/Validators';
import { Default } from '../core/decorators/Transforms';
import { UniqueKey } from '../core/decorators/Unique';
import { Entity } from '../core/decorators/RegisterEntity';

@Entity('Kho1_ChiTietPhieuNhap')
export class Kho1_ChiTietPhieuNhap {
    @Required()
    @UniqueKey()
    MaPN: number;

    @Required()
    @UniqueKey()
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