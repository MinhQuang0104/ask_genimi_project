import { Required, IsInteger } from '../core/decorators/Validators';
import { Trim, DefaultDate} from '../core/decorators/Transforms';
import { Entity } from '../core/decorators/RegisterEntity';
import { UniqueKey } from '../core/decorators/Unique';

@Entity('Kho1_PhieuNhap')
export class Kho1_PhieuNhap {
    @UniqueKey()
    MaPN: number;

    @Required()
    @IsInteger()
    MaNCC: number;

    @Required()
    @IsInteger()
    MaKho: number;

    @DefaultDate('now')
    NgayNhap: Date;

    @Trim()
    NguoiNhap: string;

    @Trim()
    GhiChu: string;

    constructor(init?: Partial<Kho1_PhieuNhap>) {
        this.MaPN = init?.MaPN ?? 0;
        this.MaNCC = init?.MaNCC ?? 0;
        this.MaKho = init?.MaKho ?? 0;
        this.NgayNhap = init?.NgayNhap ?? new Date();
        this.NguoiNhap = init?.NguoiNhap ?? '';
        this.GhiChu = init?.GhiChu ?? '';
    }
}