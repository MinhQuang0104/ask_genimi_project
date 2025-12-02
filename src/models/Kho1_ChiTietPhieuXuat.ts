import { 
    Required, MinLen, IsInteger, IsDecimal, Min, InSet, 
    IsEmail, IsPhoneNumber, MaxDate, IsUrlOrPath, InRange 
} from '../core/decorators/Validators';
import { 
    Trim, AlphaNumericOnly, RemoveWhitespace, ToLowerCase, 
    ToUpperCase, Default, DefaultDate 
} from '../core/decorators/Transforms';

import { Entity } from '../core/decorators/RegisterEntity';

// ...existing code...
@Entity('Kho1_ChiTietPhieuXuat')
export class Kho1_ChiTietPhieuXuat {
    @Required()
    MaPX: number;

    @Required()
    MaSP: number;

    @Required()
    @IsInteger()
    @Min(1)
    @Default(1) // [cite: 631]
    SoLuongXuat: number;

    constructor(init?: Partial<Kho1_ChiTietPhieuXuat>) {
        this.MaPX = init?.MaPX ?? 0;
        this.MaSP = init?.MaSP ?? 0;
        this.SoLuongXuat = init?.SoLuongXuat ?? 1;
    }
}