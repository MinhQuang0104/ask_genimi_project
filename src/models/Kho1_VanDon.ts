import { Entity as TypeOrmEntity, PrimaryGeneratedColumn, Column } from "typeorm";
import { Required, IsInteger, Min, MaxLen, IsDecimal } from '../core/decorators/Validators';
import { Trim, Default } from '../core/decorators/Transforms';
import { Entity as MyEntity } from '../core/decorators/RegisterEntity';
import { UniqueKey } from '../core/decorators/Unique';

@TypeOrmEntity('Kho1_VanDon')
@MyEntity('Kho1_VanDon')
export class Kho1_VanDon {
    @UniqueKey()
    @PrimaryGeneratedColumn({ name: 'MaVD' })
    MaVD: number;

    @Required()
    @Column({ name: 'MaHD' })
    MaHD: number; 

    @Column({ name: 'MaPX', nullable: true })
    MaPX: number; 

    @Trim()
    @MaxLen(100)
    @Column({ name: 'DonViVanChuyen', type: 'nvarchar', length: 100, nullable: true })
    DonViVanChuyen: string;

    @Trim()
    @MaxLen(50)
    @Column({ name: 'MaVanDonVanChuyen', type: 'varchar', length: 50, nullable: true })
    MaVanDonVanChuyen: string;

    @Required()
    @IsDecimal()
    @Min(0)
    @Default(0)
    @Column({ name: 'PhiVanChuyen', type: 'decimal', precision: 18, scale: 2, default: 0 })
    PhiVanChuyen: number;

    @Required()
    @IsInteger()
    @Min(1)
    @Default(1) 
    @Column({ name: 'TrangThaiVanDon', default: 1 })
    TrangThaiVanDon: number;

    @Trim()
    @MaxLen(255)
    @Column({ name: 'GhiChu', type: 'nvarchar', length: 255, nullable: true })
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