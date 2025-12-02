import { 
    Required, IsDecimal, InRange 
} from '../core/decorators/Validators';
import { 
    Trim, AlphaNumericOnly, RemoveWhitespace, ToLowerCase, 
    ToUpperCase, Default, DefaultDate 
} from '../core/decorators/Transforms';

import { Entity } from '../core/decorators/RegisterEntity';

// ...existing code...
@Entity('Thue')
export class Thue {
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