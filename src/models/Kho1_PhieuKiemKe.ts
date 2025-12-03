import { Required, IsInteger, Min, MaxLen } from '../core/decorators/Validators';
import { Trim, Default } from '../core/decorators/Transforms';
import { Entity } from '../core/decorators/RegisterEntity';
import { UniqueKey } from '../core/decorators/Unique';

@Entity('Kho1_PhieuKiemKe')
export class Kho1_PhieuKiemKe {
    @UniqueKey()
    MaKK: number;

    @Required()
    MaKho: number;

    @Required()
    
    @Default('GETDATE()')
    NgayLap: Date;

    @Required()
    @IsInteger()
    @Min(1)
    @Default(1) // 1: Định kỳ, 2: Đột xuất
    LoaiKiemKe: number;

    @Required()
    @IsInteger()
    @Min(1)
    @Default(1) // 1: Đang kiểm, 2: Hoàn thành, 3: Đã cân bằng kho
    TrangThaiKK: number;

    @Trim()
    @MaxLen(100)
    NguoiLap: string;

    constructor(init?: Partial<Kho1_PhieuKiemKe>) {
        this.MaKK = init?.MaKK ?? 0;
        this.MaKho = init?.MaKho ?? 0;
        this.NgayLap = init?.NgayLap ?? new Date();
        this.LoaiKiemKe = init?.LoaiKiemKe ?? 1;
        this.TrangThaiKK = init?.TrangThaiKK ?? 1;
        this.NguoiLap = init?.NguoiLap ?? '';
    }
}