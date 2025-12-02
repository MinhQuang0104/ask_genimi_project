import { 
    Required
} from '../core/decorators/Validators';
import { 
    Trim, AlphaNumericOnly, RemoveWhitespace, ToLowerCase, 
    ToUpperCase, Default, DefaultDate 
} from '../core/decorators/Transforms';

import { Entity } from '../core/decorators/RegisterEntity';

// ...existing code...
@Entity('NhaCungCap')
export class NhaCungCap {
    MaNCC: number;

    @Required()
    @Trim()
    @AlphaNumericOnly() // [cite: 623]
    TenNCC: string;

    @Trim() // [cite: 623]
    DiaChiNCC: string;
    
    SoDienThoai: string;
    Email: string;

    constructor(init?: Partial<NhaCungCap>) {
        this.MaNCC = init?.MaNCC ?? 0;
        this.TenNCC = init?.TenNCC ?? '';
        this.DiaChiNCC = init?.DiaChiNCC ?? '';
        this.SoDienThoai = init?.SoDienThoai ?? '';
        this.Email = init?.Email ?? '';
    }
}