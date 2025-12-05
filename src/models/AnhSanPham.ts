import { Entity as TypeOrmEntity, PrimaryGeneratedColumn, Column } from "typeorm";
import { Required, MaxLen } from '../core/decorators/Validators';
import { Trim } from '../core/decorators/Transforms';
import { Entity as MyEntity } from '../core/decorators/RegisterEntity';
import { UniqueKey } from '../core/decorators/Unique';

@TypeOrmEntity('AnhSanPham')
@MyEntity('AnhSanPham')
export class AnhSanPham {
    @UniqueKey()
    @PrimaryGeneratedColumn({ name: 'MaAnh' })
    MaAnh: number;

    @Required()
    @Column({ name: 'MaSP' })
    MaSP: number;

    @Required()
    @Trim()
    @MaxLen(255)
    @Column({ name: 'TenFileAnh', type: 'nvarchar', length: 255 })
    TenFileAnh: string; 

    @Required()
    @Column({ name: 'LaAnhChinh', default: false })
    LaAnhChinh: boolean; 

    constructor(init?: Partial<AnhSanPham>) {
        this.MaAnh = init?.MaAnh ?? 0;
        this.MaSP = init?.MaSP ?? 0;
        this.TenFileAnh = init?.TenFileAnh ?? '';
        this.LaAnhChinh = init?.LaAnhChinh ?? false;
    }
}