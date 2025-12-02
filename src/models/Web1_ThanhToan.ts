import { Required, IsDecimal, Min, InSet} from '../core/decorators/Validators';
import { Trim, Default, DefaultDate } from '../core/decorators/Transforms';
import { Entity } from '../core/decorators/RegisterEntity';
import { UniqueKey } from '../core/decorators/Unique';

@Entity('Web1_ThanhToan')
export class Web1_ThanhToan {
    @UniqueKey()
    MaTT: number;
    
    @Required()
    @UniqueKey()
    MaHD: number;

    @Required()
    @Trim() // [cite: 668]
    PhuongThucTT: string;

    @Required()
    @IsDecimal()
    @Min(0)
    @Default(0) // [cite: 668]
    SoTienTT: number;

    @Required()
    @InSet([1, 2, 3])
    @Default(1) // [cite: 668]
    TrangThaiTT: number; 

    @DefaultDate('now') // [cite: 668]
    NgayTao: Date;
    
    GhiChu: string;

    constructor(init?: Partial<Web1_ThanhToan>) {
        this.MaTT = init?.MaTT ?? 0;
        this.MaHD = init?.MaHD ?? 0;
        this.PhuongThucTT = init?.PhuongThucTT ?? '';
        this.SoTienTT = init?.SoTienTT ?? 0;
        this.TrangThaiTT = init?.TrangThaiTT ?? 1;
        this.NgayTao = init?.NgayTao ?? new Date();
        this.GhiChu = init?.GhiChu ?? '';
    }
}