import { Entity as TypeOrmEntity, PrimaryColumn, Column } from "typeorm";
import { Required, IsInteger, Min} from '../core/decorators/Validators';
import { Default} from '../core/decorators/Transforms';
import { UniqueKey } from '../core/decorators/Unique';
import { Entity as MyEntity } from '../core/decorators/RegisterEntity';

@TypeOrmEntity('Kho1_ChiTietPhieuXuat')
@MyEntity('Kho1_ChiTietPhieuXuat')
export class Kho1_ChiTietPhieuXuat {
    @Required()
    @UniqueKey()
    @PrimaryColumn({ name: 'MaPX' })
    MaPX: number;

    @Required()
    @UniqueKey()
    @PrimaryColumn({ name: 'MaSP' })
    MaSP: number;

    @Required()
    @IsInteger()
    @Min(1)
    @Default(1)
    @Column({ name: 'SoLuongXuat' })
    SoLuongXuat: number;

    constructor(init?: Partial<Kho1_ChiTietPhieuXuat>) {
        this.MaPX = init?.MaPX ?? 0;
        this.MaSP = init?.MaSP ?? 0;
        this.SoLuongXuat = init?.SoLuongXuat ?? 1;
    }
}