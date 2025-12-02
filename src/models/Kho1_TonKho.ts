import { Required, MinLen, IsInteger, IsDecimal, Min} from '../core/decorators/Validators';
import { Default} from '../core/decorators/Transforms';
import { Entity } from '../core/decorators/RegisterEntity';
import { UniqueKey } from '../core/decorators/Unique';

@Entity('Kho1_TonKho')
export class Kho1_TonKho {
    @Required()
    @UniqueKey()
    MaKho: number;

    @Required()
    @UniqueKey()
    MaSP: number;

    @Required()
    @IsInteger()
    @Min(0)
    @Default(0) // [cite: 621]
    SoLuongTon: number;

    @Required()
    @IsInteger()
    @Min(0)
    @Default(0) // [cite: 621]
    SoLuongTamGiu: number;

    SoLuongCoTheBan: number; 
    NgayCapNhat: Date;

    constructor(init?: Partial<Kho1_TonKho>) {
        this.MaKho = init?.MaKho ?? 0;
        this.MaSP = init?.MaSP ?? 0;
        this.SoLuongTon = init?.SoLuongTon ?? 0;
        this.SoLuongTamGiu = init?.SoLuongTamGiu ?? 0;
        this.SoLuongCoTheBan = init?.SoLuongCoTheBan ?? 0;
        this.NgayCapNhat = init?.NgayCapNhat ?? new Date();
    }
}