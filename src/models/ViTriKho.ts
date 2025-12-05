import { Entity as TypeOrmEntity, PrimaryGeneratedColumn, Column } from "typeorm";
import { Required, MaxLen } from '../core/decorators/Validators';
import { Trim } from '../core/decorators/Transforms';
import { Entity as MyEntity } from '../core/decorators/RegisterEntity';
import { UniqueKey } from '../core/decorators/Unique';

@TypeOrmEntity('ViTriKho')
@MyEntity('ViTriKho')
export class ViTriKho {
    @UniqueKey()
    @PrimaryGeneratedColumn({ name: 'MaVT' })
    MaVT: number;

    @Required()
    @Column({ name: 'MaKho' })
    MaKho: number;

    @Required()
    @Trim()
    @MaxLen(100)
    @Column({ name: 'TenViTri', type: 'nvarchar', length: 100 })
    TenViTri: string; 

    @Trim()
    @MaxLen(255)
    @Column({ name: 'GhiChu', type: 'nvarchar', length: 255, nullable: true })
    GhiChu: string;

    constructor(init?: Partial<ViTriKho>) {
        this.MaVT = init?.MaVT ?? 0;
        this.MaKho = init?.MaKho ?? 0;
        this.TenViTri = init?.TenViTri ?? '';
        this.GhiChu = init?.GhiChu ?? '';
    }
}