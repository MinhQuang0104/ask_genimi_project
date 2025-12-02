import { Required} from '../core/decorators/Validators';
import { Trim, AlphaNumericOnly} from '../core/decorators/Transforms';
import { Entity } from '../core/decorators/RegisterEntity';
import { UniqueKey } from '../core/decorators/Unique';

@Entity('NhaCungCap')
export class NhaCungCap {
    @UniqueKey()
    MaNCC: number;

    @Required()
    @Trim()
    @AlphaNumericOnly()
    TenNCC: string;

    @Trim() 
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