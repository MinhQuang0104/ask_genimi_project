import { Required, IsInteger, MaxLen} from '../core/decorators/Validators';
import { Trim } from '../core/decorators/Transforms';
import { Entity } from '../core/decorators/RegisterEntity';

@Entity('Kho1_ChiTietKiemKe')
export class Kho1_ChiTietKiemKe {
    @Required()
    MaKK: number; // PK, FK

    @Required()
    MaSP: number; // PK, FK

    @Required()
    @IsInteger()
    SoLuongHeThong: number;

    @Required()
    @IsInteger()
    SoLuongThucTe: number;

    SoLuongLech: number; 

    @Trim()
    @MaxLen(255)
    LyDoLech: string;

    constructor(init?: Partial<Kho1_ChiTietKiemKe>) {
        this.MaKK = init?.MaKK ?? 0;
        this.MaSP = init?.MaSP ?? 0;
        this.SoLuongHeThong = init?.SoLuongHeThong ?? 0;
        this.SoLuongThucTe = init?.SoLuongThucTe ?? 0;
        this.SoLuongLech = init?.SoLuongLech ?? 0;
        this.LyDoLech = init?.LyDoLech ?? '';
    }
}