import { Required} from '../core/decorators/Validators';
import { Entity } from '../core/decorators/RegisterEntity';
import { UniqueKey } from '../core/decorators/Unique';


@Entity('SanPham_KhuyenMai')
export class SanPham_KhuyenMai {
    @Required()
    @UniqueKey()
    MaSP: number;
    
    @Required()
    @UniqueKey()
    MaKM: number;

    constructor(init?: Partial<SanPham_KhuyenMai>) {
        this.MaSP = init?.MaSP ?? 0;
        this.MaKM = init?.MaKM ?? 0;
    }
}