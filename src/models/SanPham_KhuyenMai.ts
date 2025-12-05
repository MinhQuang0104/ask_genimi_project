import { Entity as TypeOrmEntity, PrimaryColumn } from "typeorm";
import { Required} from '../core/decorators/Validators';
import { Entity as MyEntity } from '../core/decorators/RegisterEntity';
import { UniqueKey } from '../core/decorators/Unique';

@TypeOrmEntity('SanPham_KhuyenMai')
@MyEntity('SanPham_KhuyenMai')
export class SanPham_KhuyenMai {
    @Required()
    @UniqueKey()
    @PrimaryColumn({ name: 'MaSP' })
    MaSP: number;
    
    @Required()
    @UniqueKey()
    @PrimaryColumn({ name: 'MaKM' })
    MaKM: number;

    constructor(init?: Partial<SanPham_KhuyenMai>) {
        this.MaSP = init?.MaSP ?? 0;
        this.MaKM = init?.MaKM ?? 0;
    }
}