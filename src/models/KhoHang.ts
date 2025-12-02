import { Required} from '../core/decorators/Validators';
import { Trim, AlphaNumericOnly} from '../core/decorators/Transforms';
import { Entity } from '../core/decorators/RegisterEntity';
import { UniqueKey } from '../core/decorators/Unique';

@Entity('KhoHang')
export class KhoHang {
    @UniqueKey()
    MaKho: number;

    @Required()
    @Trim()
    @AlphaNumericOnly()
    TenKho: string;
    
    @Trim() 
    DiaChiKho: string;

    constructor(init?: Partial<KhoHang>) {
        this.MaKho = init?.MaKho ?? 0;
        this.TenKho = init?.TenKho ?? '';
        this.DiaChiKho = init?.DiaChiKho ?? '';
    }
}