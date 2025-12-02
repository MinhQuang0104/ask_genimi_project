import { 
    Required
} from '../core/decorators/Validators';

import { Entity } from '../core/decorators/RegisterEntity';

// ...existing code...
@Entity('SanPham_KhuyenMai')
export class SanPham_KhuyenMai {
    @Required()
    MaSP: number;

    @Required()
    MaKM: number;

    constructor(init?: Partial<SanPham_KhuyenMai>) {
        this.MaSP = init?.MaSP ?? 0;
        this.MaKM = init?.MaKM ?? 0;
    }
}