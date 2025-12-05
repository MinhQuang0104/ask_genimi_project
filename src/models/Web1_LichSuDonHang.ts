import { Entity as TypeOrmEntity, PrimaryGeneratedColumn, Column } from "typeorm";
import { Required, IsInteger, MaxLen } from '../core/decorators/Validators';
import { Trim, Default } from '../core/decorators/Transforms';
import { Entity as MyEntity } from '../core/decorators/RegisterEntity';
import { UniqueKey } from '../core/decorators/Unique';

@TypeOrmEntity('Web1_LichSuDonHang')
@MyEntity('Web1_LichSuDonHang')
export class Web1_LichSuDonHang {
    @UniqueKey()
    @PrimaryGeneratedColumn({ name: 'MaLSDH' })
    MaLSDH: number;

    @Required()
    @Column({ name: 'MaHD' })
    MaHD: number;

    @Required()
    @Default('GETDATE()')
    @Column({ name: 'NgayThayDoi', type: 'datetime', default: () => 'GETDATE()' })
    NgayThayDoi: Date;

    @Required()
    @IsInteger()
    @Column({ name: 'TrangThaiDonHang' })
    TrangThaiDonHang: number; 

    @Trim()
    @MaxLen(500)
    @Column({ name: 'GhiChu', type: 'nvarchar', length: 'max', nullable: true })
    GhiChu: string;

    constructor(init?: Partial<Web1_LichSuDonHang>) {
        this.MaLSDH = init?.MaLSDH ?? 0;
        this.MaHD = init?.MaHD ?? 0;
        this.NgayThayDoi = init?.NgayThayDoi ?? new Date();
        this.TrangThaiDonHang = init?.TrangThaiDonHang ?? 0;
        this.GhiChu = init?.GhiChu ?? '';
    }
}