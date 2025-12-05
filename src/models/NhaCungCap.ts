import { Entity as TypeOrmEntity, PrimaryGeneratedColumn, Column } from "typeorm";
import { Required} from '../core/decorators/Validators';
import { Trim, AlphaNumericOnly} from '../core/decorators/Transforms';
import { Entity as MyEntity } from '../core/decorators/RegisterEntity';
import { UniqueKey } from '../core/decorators/Unique';

@TypeOrmEntity('NhaCungCap')
@MyEntity('NhaCungCap')
export class NhaCungCap {
    @UniqueKey()
    @PrimaryGeneratedColumn({ name: 'MaNCC' })
    MaNCC: number;

    @Required()
    @Trim()
    @AlphaNumericOnly()
    @Column({ name: 'TenNCC', type: 'nvarchar', length: 255 })
    TenNCC: string;

    @Trim() 
    @Column({ name: 'DiaChiNCC', type: 'nvarchar', length: 500, nullable: true })
    DiaChiNCC: string;
    
    @Column({ name: 'SoDienThoai', type: 'varchar', length: 20, nullable: true })
    SoDienThoai: string;
    
    @Column({ name: 'Email', type: 'varchar', length: 100, nullable: true })
    Email: string;

    constructor(init?: Partial<NhaCungCap>) {
        this.MaNCC = init?.MaNCC ?? 0;
        this.TenNCC = init?.TenNCC ?? '';
        this.DiaChiNCC = init?.DiaChiNCC ?? '';
        this.SoDienThoai = init?.SoDienThoai ?? '';
        this.Email = init?.Email ?? '';
    }
}