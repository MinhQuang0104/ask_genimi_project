import { Required} from '../core/decorators/Validators';
import { Trim, AlphaNumericOnly} from '../core/decorators/Transforms';
import { Entity } from '../core/decorators/RegisterEntity';
import { UniqueKey } from '../core/decorators/Unique';

@Entity('LoaiHang')
export class LoaiHang {
    @UniqueKey()
    MaLoaiHang: number;

    @Required()
    @Trim()
    @AlphaNumericOnly() // [cite: 611]
    TenLoaiHang: string;

    MoTa: string;

    constructor(init?: Partial<LoaiHang>) {
        this.MaLoaiHang = init?.MaLoaiHang ?? 0;
        this.TenLoaiHang = init?.TenLoaiHang ?? '';
        this.MoTa = init?.MoTa ?? '';
    }
}