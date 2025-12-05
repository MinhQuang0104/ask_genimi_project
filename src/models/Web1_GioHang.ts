import { Entity as TypeOrmEntity, PrimaryGeneratedColumn, Column } from "typeorm";
import {Required, IsInteger, Min} from '../core/decorators/Validators';
import { Default} from '../core/decorators/Transforms';
import { Entity as MyEntity } from '../core/decorators/RegisterEntity';
import { UniqueKey } from '../core/decorators/Unique';

@TypeOrmEntity('Web1_GioHang')
@MyEntity('Web1_GioHang')
export class Web1_GioHang {
    @UniqueKey()
    @PrimaryGeneratedColumn({ name: 'MaGH' })
    MaGH: number;
    
    @UniqueKey()
    @Column({ name: 'MaTK', nullable: true })
    MaTK: number;

    @Required()
    @Column({ name: 'MaSP' })
    MaSP: number;

    @Required()
    @IsInteger()
    @Min(1)
    @Default(1)
    @Column({ name: 'SoLuong' })
    SoLuong: number;

    @Column({ name: 'NgayCapNhat', type: 'datetime', default: () => 'GETDATE()' })
    NgayCapNhat: Date;

    constructor(init?: Partial<Web1_GioHang>) {
        this.MaGH = init?.MaGH ?? 0;
        this.MaTK = init?.MaTK ?? 0;
        this.MaSP = init?.MaSP ?? 0;
        this.SoLuong = init?.SoLuong ?? 1;
        this.NgayCapNhat = init?.NgayCapNhat ?? new Date();
    }
}