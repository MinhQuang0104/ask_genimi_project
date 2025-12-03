import { Required, IsInteger, MaxLen } from '../core/decorators/Validators';
import { Trim, Default } from '../core/decorators/Transforms';
import { Entity } from '../core/decorators/RegisterEntity';
import { UniqueKey } from '../core/decorators/Unique';

@Entity('Web1_LichSuDonHang')
export class Web1_LichSuDonHang {
    @UniqueKey()
    MaLSDH: number;

    @Required()
    MaHD: number;

    @Required()
    @Default('GETDATE()')
    NgayThayDoi: Date;

    @Required()
    @IsInteger()
    TrangThaiDonHang: number; // Lưu snapshot trạng thái (1, 2, 3...)

    @Trim()
    @MaxLen(500)
    GhiChu: string;

    constructor(init?: Partial<Web1_LichSuDonHang>) {
        this.MaLSDH = init?.MaLSDH ?? 0;
        this.MaHD = init?.MaHD ?? 0;
        this.NgayThayDoi = init?.NgayThayDoi ?? new Date();
        this.TrangThaiDonHang = init?.TrangThaiDonHang ?? 0;
        this.GhiChu = init?.GhiChu ?? '';
    }
}