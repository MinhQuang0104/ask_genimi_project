import { Required, MaxLen } from '../core/decorators/Validators';
import { Trim } from '../core/decorators/Transforms';
import { Entity } from '../core/decorators/RegisterEntity';
import { UniqueKey } from '../core/decorators/Unique';

@Entity('AnhSanPham')
export class AnhSanPham {
    @UniqueKey()
    MaAnh: number;

    @Required()
    MaSP: number;

    @Required()
    @Trim()
    @MaxLen(255) 
    TenFileAnh: string; // Tên file/đường dẫn ảnh

    @Required()
    LaAnhChinh: boolean; // Ảnh đại diện?

    constructor(init?: Partial<AnhSanPham>) {
        this.MaAnh = init?.MaAnh ?? 0;
        this.MaSP = init?.MaSP ?? 0;
        this.TenFileAnh = init?.TenFileAnh ?? '';
        this.LaAnhChinh = init?.LaAnhChinh ?? false;
    }
}