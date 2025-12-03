import { Required, MaxLen } from '../core/decorators/Validators';
import { Trim } from '../core/decorators/Transforms';
import { Entity } from '../core/decorators/RegisterEntity';
import { UniqueKey } from '../core/decorators/Unique';

@Entity('Web1_SoDiaChi')
export class Web1_SoDiaChi {
    @UniqueKey()
    MaDC: number;

    @Required()
    MaTK: number;

    @Required()
    @Trim()
    @MaxLen(100)
    TenNguoiNhan: string;

    @Required()
    @Trim()
    @MaxLen(15)
    SoDienThoai: string;

    @Required()
    @Trim()
    @MaxLen(500)
    DiaChiChiTiet: string;

    @Required()
    LaMacDinh: boolean;

    constructor(init?: Partial<Web1_SoDiaChi>) {
        this.MaDC = init?.MaDC ?? 0;
        this.MaTK = init?.MaTK ?? 0;
        this.TenNguoiNhan = init?.TenNguoiNhan ?? '';
        this.SoDienThoai = init?.SoDienThoai ?? '';
        this.DiaChiChiTiet = init?.DiaChiChiTiet ?? '';
        this.LaMacDinh = init?.LaMacDinh ?? false;
    }
}