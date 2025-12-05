import { Entity as TypeOrmEntity, PrimaryColumn, Column } from "typeorm";
import { Required, IsInteger, MinLen } from '../core/decorators/Validators';
import { Default } from '../core/decorators/Transforms';
import { Entity as MyEntity } from '../core/decorators/RegisterEntity';

@TypeOrmEntity('Kho1_TonKhoChiTiet')
@MyEntity('Kho1_TonKhoChiTiet')
export class Kho1_TonKhoChiTiet {
    @Required()
    @PrimaryColumn({ name: 'MaKho' })
    MaKho: number; 

    @Required()
    @PrimaryColumn({ name: 'MaVT' })
    MaVT: number; 

    @Required()
    @PrimaryColumn({ name: 'MaSP' })
    MaSP: number; 

    @Required()
    @IsInteger()
    @MinLen(0)
    @Default(0)
    @Column({ name: 'SoLuongTon', default: 0 })
    SoLuongTon: number;

    constructor(init?: Partial<Kho1_TonKhoChiTiet>) {
        this.MaKho = init?.MaKho ?? 0;
        this.MaVT = init?.MaVT ?? 0;
        this.MaSP = init?.MaSP ?? 0;
        this.SoLuongTon = init?.SoLuongTon ?? 0;
    }
}