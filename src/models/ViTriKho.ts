import { Required, MaxLen } from '../core/decorators/Validators';
import { Trim } from '../core/decorators/Transforms';
import { Entity } from '../core/decorators/RegisterEntity';
import { UniqueKey } from '../core/decorators/Unique';

@Entity('ViTriKho')
export class ViTriKho {
    @UniqueKey()
    MaVT: number;

    @Required()
    MaKho: number;

    @Required()
    @Trim()
    @MaxLen(100)
    TenViTri: string; // Ví dụ: Kệ A1, Line 2

    @Trim()
    @MaxLen(255)
    GhiChu: string;

    constructor(init?: Partial<ViTriKho>) {
        this.MaVT = init?.MaVT ?? 0;
        this.MaKho = init?.MaKho ?? 0;
        this.TenViTri = init?.TenViTri ?? '';
        this.GhiChu = init?.GhiChu ?? '';
    }
}