import { Required, IsDecimal, InRange } from '../core/decorators/Validators';
import { Trim, AlphaNumericOnly, Default} from '../core/decorators/Transforms';
import { Entity } from '../core/decorators/RegisterEntity';
import { UniqueKey } from '../core/decorators/Unique';

@Entity('Thue')
export class Thue {
    @UniqueKey()
    MaThue: number;

    @Required()
    @Trim()
    @AlphaNumericOnly()
    TenThue: string;

    @Required()
    @IsDecimal()
    @InRange(0, 100)
    @Default(0) 
    PhanTramThue: number;

    constructor(init?: Partial<Thue>) {
        this.MaThue = init?.MaThue ?? 0;
        this.TenThue = init?.TenThue ?? '';
        this.PhanTramThue = init?.PhanTramThue ?? 0;
    }
}