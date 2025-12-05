import { Entity as TypeOrmEntity, PrimaryGeneratedColumn, Column } from "typeorm";
import { Required, InSet, MaxDate} from '../core/decorators/Validators';
import { Trim, Default, DefaultDate } from '../core/decorators/Transforms';
import { Entity as MyEntity } from '../core/decorators/RegisterEntity';
import { UniqueKey } from '../core/decorators/Unique';

@TypeOrmEntity('Kho1_PhieuTraHang')
@MyEntity('Kho1_PhieuTraHang')
export class Kho1_PhieuTraHang {
    @UniqueKey()
    @PrimaryGeneratedColumn({ name: 'MaPTH' })
    MaPTH: number;

    @Required()
    @Column({ name: 'MaHD' })
    MaHD: number;

    @Required()
    @Column({ name: 'MaKho' })
    MaKho: number;

    @Trim()
    @Column({ name: 'LyDoTra', type: 'nvarchar', length: 255, nullable: true })
    LyDoTra: string;

    @DefaultDate('now')
    @MaxDate('now')
    @Column({ name: 'NgayTao', type: 'datetime', default: () => 'GETDATE()' })
    NgayTao: Date;

    @Required()
    @InSet([0, 1])
    @Default(1)
    @Column({ name: 'TrangThaiPTH' })
    TrangThaiPTH: number;

    constructor(init?: Partial<Kho1_PhieuTraHang>) {
        this.MaPTH = init?.MaPTH ?? 0;
        this.MaHD = init?.MaHD ?? 0;
        this.MaKho = init?.MaKho ?? 0;
        this.LyDoTra = init?.LyDoTra ?? '';
        this.NgayTao = init?.NgayTao ?? new Date();
        this.TrangThaiPTH = init?.TrangThaiPTH ?? 1;
    }
}