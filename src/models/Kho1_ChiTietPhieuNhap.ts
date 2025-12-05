import { Entity as TypeOrmEntity, PrimaryColumn, Column } from "typeorm";
import { Required, IsInteger, IsDecimal, Min} from '../core/decorators/Validators';
import { Default } from '../core/decorators/Transforms';
import { UniqueKey } from '../core/decorators/Unique';
import { Entity as MyEntity } from '../core/decorators/RegisterEntity';

@TypeOrmEntity('Kho1_ChiTietPhieuNhap')
@MyEntity('Kho1_ChiTietPhieuNhap')
export class Kho1_ChiTietPhieuNhap {
    @Required()
    @UniqueKey()
    @PrimaryColumn({ name: 'MaPN' })
    MaPN: number;

    @Required()
    @UniqueKey()
    @PrimaryColumn({ name: 'MaSP' })
    MaSP: number;

    @Required()
    @IsInteger()
    @Min(1)
    @Default(1)
    @Column({ name: 'SoLuongNhap' })
    SoLuongNhap: number;

    @Required()
    @IsDecimal()
    @Min(0)
    @Default(0)
    @Column({ name: 'GiaNhap', type: 'decimal', precision: 18, scale: 2 })
    GiaNhap: number;

    constructor(init?: Partial<Kho1_ChiTietPhieuNhap>) {
        this.MaPN = init?.MaPN ?? 0;
        this.MaSP = init?.MaSP ?? 0;
        this.SoLuongNhap = init?.SoLuongNhap ?? 1;
        this.GiaNhap = init?.GiaNhap ?? 0;
    }
}