import { 
    Required
} from '../core/decorators/Validators';
import { 
    Trim, AlphaNumericOnly
} from '../core/decorators/Transforms';

import { Entity } from '../core/decorators/RegisterEntity';

// ...existing code...
@Entity('Kho1_PhieuNhap')
export class Kho1_PhieuNhap {
    MaKho: number;

    @Required()
    @Trim()
    @AlphaNumericOnly() // [cite: 615]
    TenKho: string;

    @Trim() // [cite: 615]
    DiaChiKho: string;

    constructor(init?: Partial<Kho1_PhieuNhap>) {
        this.MaKho = init?.MaKho ?? 0;
        this.TenKho = init?.TenKho ?? '';
        this.DiaChiKho = init?.DiaChiKho ?? '';
    }
}