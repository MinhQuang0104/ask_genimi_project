import { Required, IsInteger, InRange } from '../core/decorators/Validators';
import { Trim, Default, DefaultDate } from '../core/decorators/Transforms';
import { UniqueKey } from '../core/decorators/Unique';
import { Entity } from '../core/decorators/RegisterEntity';

@Entity('Web1_DanhGia')
export class Web1_DanhGia {
    @UniqueKey()
    MaDG: number;

    @Required()
    MaTK: number;

    @Required()
    MaSP: number;

    @Required()
    @IsInteger()
    @InRange(1, 5)
    @Default(1) // [cite: 664]
    DiemDanhGia: number;

    @Trim() // [cite: 664]
    NoiDung: string;

    @DefaultDate('now') // [cite: 664]
    NgayDG: Date;

    constructor(init?: Partial<Web1_DanhGia>) {
        this.MaDG = init?.MaDG ?? 0;
        this.MaTK = init?.MaTK ?? 0;
        this.MaSP = init?.MaSP ?? 0;
        this.DiemDanhGia = init?.DiemDanhGia ?? 5;
        this.NoiDung = init?.NoiDung ?? '';
        this.NgayDG = init?.NgayDG ?? new Date();
    }
}