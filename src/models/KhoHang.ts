import { Entity as TypeOrmEntity, PrimaryGeneratedColumn, Column } from "typeorm";
import { Required} from '../core/decorators/Validators';
import { Trim, AlphaNumericOnly} from '../core/decorators/Transforms';
import { Entity as MyEntity } from '../core/decorators/RegisterEntity';
import { UniqueKey } from '../core/decorators/Unique';

@TypeOrmEntity('KhoHang')
@MyEntity('KhoHang')
export class KhoHang {
    @UniqueKey()
    @PrimaryGeneratedColumn({ name: 'MaKho' })
    MaKho: number;

    @Required()
    @Trim()
    @AlphaNumericOnly()
    @Column({ name: 'TenKho', type: 'nvarchar', length: 255 })
    TenKho: string;
    
    @Trim() 
    @Column({ name: 'DiaChiKho', type: 'nvarchar', length: 500, nullable: true })
    DiaChiKho: string;

    constructor(init?: Partial<KhoHang>) {
        this.MaKho = init?.MaKho ?? 0;
        this.TenKho = init?.TenKho ?? '';
        this.DiaChiKho = init?.DiaChiKho ?? '';
    }
}