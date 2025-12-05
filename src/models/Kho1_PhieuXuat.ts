import { Entity as TypeOrmEntity, PrimaryGeneratedColumn, Column } from "typeorm";
import { Required, InSet, MaxDate } from '../core/decorators/Validators';
import { Default, DefaultDate } from '../core/decorators/Transforms';
import { Entity as MyEntity } from '../core/decorators/RegisterEntity';
import { UniqueKey } from '../core/decorators/Unique';

@TypeOrmEntity('Kho1_PhieuXuat')
@MyEntity('Kho1_PhieuXuat')
export class Kho1_PhieuXuat {
    @UniqueKey()
    @PrimaryGeneratedColumn({ name: 'MaPX' })
    MaPX: number;

    @Required()
    @Column({ name: 'MaKho' })
    MaKho: number;

    @Column({ name: 'MaHD', nullable: true })
    MaHD: number;

    @DefaultDate('now')
    @MaxDate('now')
    @Column({ name: 'NgayLap', type: 'datetime', default: () => 'GETDATE()' })
    NgayLap: Date;

    @Required()
    @InSet([0, 1, 2])
    @Default(1)
    @Column({ name: 'TrangThaiPX' })
    TrangThaiPX: number; 

    @Column({ name: 'NguoiLap', type: 'nvarchar', length: 100, nullable: true })
    NguoiLap: string;

    constructor(init?: Partial<Kho1_PhieuXuat>) {
        this.MaPX = init?.MaPX ?? 0;
        this.MaKho = init?.MaKho ?? 0;
        this.MaHD = init?.MaHD ?? 0;
        this.NgayLap = init?.NgayLap ?? new Date();
        this.TrangThaiPX = init?.TrangThaiPX ?? 1;
        this.NguoiLap = init?.NguoiLap ?? '';
    }
}