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
@Entity('Kho1_PhieuXuat')
export class Kho1_PhieuXuat {
    MaPX: number;

    @Required()
    MaKho: number;

    MaHD: number;

    @DefaultDate('now')
    @MaxDate('now') // [cite: 629]
    NgayLap: Date;

    @Required()
    @InSet([0, 1, 2])
    @Default(1) // [cite: 629]
    TrangThaiPX: number; 

    NguoiLap: string;

    constructor(init?: Partial<Kho1_PhieuXuat>) {
        this.MaPX = init?.MaPX ?? 0;
        this.MaKho = init?.MaKho ?? 0;
        this.MaHD = init?.MaHD ?? 0;
        this.NgayLap = init?.NgayLap ?? new Date();
        this.TrangThaiPX = init?.TrangThaiPX ?? 1;
        this.NguoiLap = init?.NguoiLap ?? '';
    }
}