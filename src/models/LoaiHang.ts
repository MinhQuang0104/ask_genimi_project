import { 
    Required
} from '../core/decorators/Validators';
import { 
    Trim, AlphaNumericOnly, RemoveWhitespace, ToLowerCase, 
    ToUpperCase, Default, DefaultDate 
} from '../core/decorators/Transforms';

import { Entity } from '../core/decorators/RegisterEntity';

// ...existing code...
@Entity('LoaiHang')
export class LoaiHang {
    MaLoaiHang: number;

    @Required()
    @Trim()
    @AlphaNumericOnly() // [cite: 611]
    TenLoaiHang: string;

    MoTa: string;

    constructor(init?: Partial<LoaiHang>) {
        this.MaLoaiHang = init?.MaLoaiHang ?? 0;
        this.TenLoaiHang = init?.TenLoaiHang ?? '';
        this.MoTa = init?.MoTa ?? '';
    }
}