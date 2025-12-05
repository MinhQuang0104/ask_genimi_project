import { Entity as TypeOrmEntity, PrimaryColumn, Column } from "typeorm";
import { Required, IsInteger, IsDecimal, Min} from '../core/decorators/Validators';
import { Default} from '../core/decorators/Transforms';
import { Entity as MyEntity } from '../core/decorators/RegisterEntity';
import { UniqueKey } from '../core/decorators/Unique';

@TypeOrmEntity('Web1_ChiTietHoaDon')
@MyEntity('Web1_ChiTietHoaDon')
export class Web1_ChiTietHoaDon {
    @Required()
    @UniqueKey()
    @PrimaryColumn({ name: 'MaHD' })
    MaHD: number;

    @Required()
    @UniqueKey()
    @PrimaryColumn({ name: 'MaSP' })
    MaSP: number;

    @Required()
    @IsInteger()
    @Min(1)
    @Default(1)
    @Column({ name: 'SoLuong' })
    SoLuong: number;

    @Required()
    @IsDecimal()
    @Min(0)
    @Default(0)
    @Column({ name: 'GiaBanLucDat', type: 'decimal', precision: 18, scale: 2 })
    GiaBanLucDat: number;

    @Column({ name: 'PhanTramThue', type: 'decimal', precision: 5, scale: 2, default: 0 })
    PhanTramThue: number;

    @IsDecimal()
    @Column({ name: 'ThanhTien', type: 'decimal', precision: 18, scale: 2, default: 0 })
    ThanhTien: number;

    constructor(init?: Partial<Web1_ChiTietHoaDon>) {
        this.MaHD = init?.MaHD ?? 0;
        this.MaSP = init?.MaSP ?? 0;
        this.SoLuong = init?.SoLuong ?? 1;
        this.GiaBanLucDat = init?.GiaBanLucDat ?? 0;
        this.PhanTramThue = init?.PhanTramThue ?? 0;
        this.ThanhTien = init?.ThanhTien ?? 0;
    }
}