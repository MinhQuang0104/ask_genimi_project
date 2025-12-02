import { Required, IsInteger, Min} from '../core/decorators/Validators';
import { Trim, AlphaNumericOnly, Default} from '../core/decorators/Transforms';
import { UniqueKey } from '../core/decorators/Unique';
import { Entity } from '../core/decorators/RegisterEntity';


@Entity('Kho1_ChiTietTraHang')
export class Kho1_ChiTietTraHang {
    @Required()
    @UniqueKey()
    MaPTH: number;

    @Required()
    @UniqueKey()
    MaSP: number;

    @Required()
    @IsInteger()
    @Min(1)
    @Default(1) // [cite: 635]
    SoLuongTra: number;

    @Trim() // [cite: 635]
    LyDoTra: string;

    @AlphaNumericOnly() // [cite: 635]
    TinhTrangSP: string;

    constructor(init?: Partial<Kho1_ChiTietTraHang>) {
        this.MaPTH = init?.MaPTH ?? 0;
        this.MaSP = init?.MaSP ?? 0;
        this.SoLuongTra = init?.SoLuongTra ?? 1;
        this.LyDoTra = init?.LyDoTra ?? '';
        this.TinhTrangSP = init?.TinhTrangSP ?? '';
    }
}