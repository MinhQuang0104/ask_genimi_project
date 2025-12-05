import { Entity as TypeOrmEntity, PrimaryGeneratedColumn, Column } from "typeorm";
import { Required, IsDecimal, Min, InSet} from '../core/decorators/Validators';
import { Trim, Default, DefaultDate } from '../core/decorators/Transforms';
import { Entity as MyEntity } from '../core/decorators/RegisterEntity';
import { UniqueKey } from '../core/decorators/Unique';

@TypeOrmEntity('Web1_ThanhToan')
@MyEntity('Web1_ThanhToan')
export class Web1_ThanhToan {
    @UniqueKey()
    @PrimaryGeneratedColumn({ name: 'MaTT' })
    MaTT: number;
    
    @Required()
    @Column({ name: 'MaHD' })
    MaHD: number;

    @Required()
    @Trim()
    @Column({ name: 'PhuongThucTT', type: 'nvarchar', length: 50 })
    PhuongThucTT: string;

    @Required()
    @IsDecimal()
    @Min(0)
    @Default(0)
    @Column({ name: 'SoTienTT', type: 'decimal', precision: 18, scale: 2 })
    SoTienTT: number;

    @Required()
    @InSet([1, 2, 3])
    @Default(1)
    @Column({ name: 'TrangThaiTT' })
    TrangThaiTT: number; 

    @DefaultDate('now')
    @Column({ name: 'NgayTao', type: 'datetime', default: () => 'GETDATE()' })
    NgayTao: Date;
    
    @Column({ name: 'GhiChu', type: 'nvarchar', length: 255, nullable: true })
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