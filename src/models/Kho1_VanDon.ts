import { Required, IsInteger, Min, MaxLen, IsDecimal } from '../core/decorators/Validators';
import { Trim, Default } from '../core/decorators/Transforms';
import { Entity } from '../core/decorators/RegisterEntity';
import { UniqueKey } from '../core/decorators/Unique';

@Entity('Kho1_VanDon')
export class Kho1_VanDon {
    @UniqueKey()
    MaVD: number;

    @Required()
    MaHD: number; // Liên kết với đơn hàng

    MaPX: number; // Liên kết với phiếu xuất (có thể NULL)

    @Trim()
    @MaxLen(100)
    DonViVanChuyen: string;

    @Trim()
    @MaxLen(50)
    MaVanDonVanChuyen: string; // Mã tracking

    @Required()
    @IsDecimal()
    @Min(0)
    @Default(0)
    PhiVanChuyen: number;

    @Required()
    @IsInteger()
    @Min(1)
    @Default(1) 
    TrangThaiVanDon: number; // 1: Chờ lấy, 2: Đang giao, 3: Đã giao

    @Trim()
    @MaxLen(255)
    GhiChu: string;

    constructor(init?: Partial<Kho1_VanDon>) {
        this.MaVD = init?.MaVD ?? 0;
        this.MaHD = init?.MaHD ?? 0;
        this.MaPX = init?.MaPX ?? 0;
        this.DonViVanChuyen = init?.DonViVanChuyen ?? '';
        this.MaVanDonVanChuyen = init?.MaVanDonVanChuyen ?? '';
        this.PhiVanChuyen = init?.PhiVanChuyen ?? 0;
        this.TrangThaiVanDon = init?.TrangThaiVanDon ?? 1;
        this.GhiChu = init?.GhiChu ?? '';
    }
}