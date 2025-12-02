import { Required, InSet, MaxDate} from '../core/decorators/Validators';
import { Trim, Default, DefaultDate } from '../core/decorators/Transforms';
import { Entity } from '../core/decorators/RegisterEntity';
import { UniqueKey } from '../core/decorators/Unique';

@Entity('Kho1_PhieuTraHang')
export class Kho1_PhieuTraHang {
    @UniqueKey()
    MaPTH: number;

    @Required()
    MaHD: number;

    @Required()
    MaKho: number;

    @Trim() // [cite: 633]
    LyDoTra: string;

    @DefaultDate('now')
    @MaxDate('now') // [cite: 633]
    NgayTao: Date;

    @Required()
    @InSet([0, 1])
    @Default(1) // [cite: 633]
    TrangThaiPTH: number;

    constructor(init?: Partial<Kho1_PhieuTraHang>) {
        this.MaPTH = init?.MaPTH ?? 0;
        this.MaHD = init?.MaHD ?? 0;
        this.MaKho = init?.MaKho ?? 0;
        this.LyDoTra = init?.LyDoTra ?? '';
        this.NgayTao = init?.NgayTao ?? new Date();
        this.TrangThaiPTH = init?.TrangThaiPTH ?? 1;
    }
}