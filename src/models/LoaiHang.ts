import { Entity as TypeOrmEntity, PrimaryGeneratedColumn, Column } from "typeorm";
import { Required} from '../core/decorators/Validators';
import { Trim, AlphaNumericOnly} from '../core/decorators/Transforms';
import { Entity as MyEntity } from '../core/decorators/RegisterEntity';
import { UniqueKey } from '../core/decorators/Unique';

@TypeOrmEntity('LoaiHang')
@MyEntity('LoaiHang')
export class LoaiHang {
    @UniqueKey()
    @PrimaryGeneratedColumn({ name: 'MaLoaiHang' })
    MaLoaiHang: number;

    @Required()
    @Trim()
    @AlphaNumericOnly()
    @Column({ name: 'TenLoaiHang', type: 'nvarchar', length: 255 })
    TenLoaiHang: string;

    @Column({ name: 'MoTa', type: 'nvarchar', length: 500, nullable: true })
    MoTa: string;

    constructor(init?: Partial<LoaiHang>) {
        this.MaLoaiHang = init?.MaLoaiHang ?? 0;
        this.TenLoaiHang = init?.TenLoaiHang ?? '';
        this.MoTa = init?.MoTa ?? '';
    }
}