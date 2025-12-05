import { Entity as TypeOrmEntity, PrimaryGeneratedColumn, Column } from "typeorm";
import { Required, MaxLen } from '../core/decorators/Validators';
import { Trim } from '../core/decorators/Transforms';
import { Entity as MyEntity } from '../core/decorators/RegisterEntity';
import { UniqueKey } from '../core/decorators/Unique';

@TypeOrmEntity('Web1_SoDiaChi')
@MyEntity('Web1_SoDiaChi')
export class Web1_SoDiaChi {
    @UniqueKey()
    @PrimaryGeneratedColumn({ name: 'MaDC' })
    MaDC: number;

    @Required()
    @Column({ name: 'MaTK' })
    MaTK: number;

    @Required()
    @Trim()
    @MaxLen(100)
    @Column({ name: 'TenNguoiNhan', type: 'nvarchar', length: 100 })
    TenNguoiNhan: string;

    @Required()
    @Trim()
    @MaxLen(15)
    @Column({ name: 'SoDienThoai', type: 'varchar', length: 15 })
    SoDienThoai: string;

    @Required()
    @Trim()
    @MaxLen(500)
    @Column({ name: 'DiaChiChiTiet', type: 'nvarchar', length: 500 })
    DiaChiChiTiet: string;

    @Required()
    @Column({ name: 'LaMacDinh', default: false })
    LaMacDinh: boolean;

    constructor(init?: Partial<Web1_SoDiaChi>) {
        this.MaDC = init?.MaDC ?? 0;
        this.MaTK = init?.MaTK ?? 0;
        this.TenNguoiNhan = init?.TenNguoiNhan ?? '';
        this.SoDienThoai = init?.SoDienThoai ?? '';
        this.DiaChiChiTiet = init?.DiaChiChiTiet ?? '';
        this.LaMacDinh = init?.LaMacDinh ?? false;
    }
}