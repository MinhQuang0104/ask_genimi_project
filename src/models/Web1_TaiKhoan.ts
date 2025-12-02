import { Required, MinLen, InSet, IsEmail, IsPhoneNumber, MaxDate} from '../core/decorators/Validators';
import { Trim, AlphaNumericOnly, RemoveWhitespace, ToLowerCase, Default, DefaultDate } from '../core/decorators/Transforms';
import { Entity } from '../core/decorators/RegisterEntity';
import { UniqueKey } from '../core/decorators/Unique';

@Entity('Web1_TaiKhoan')
export class Web1_TaiKhoan {
    @UniqueKey()
    MaTK: number;

    @Required()
    @RemoveWhitespace()
    @AlphaNumericOnly() 
    TenDangNhap: string;

    @Required()
    @Trim()
    @MinLen(6)  
    MatKhau: string;

    @Required()
    @Trim()
    @AlphaNumericOnly()  
    HoTen: string;

    @Required()
    @ToLowerCase()
    @IsEmail()
    @Default('')  
    Email: string;

    @Trim()
    @IsPhoneNumber()
    @Default('')  
    SoDienThoai: string;

    @Required()
    @InSet([1, 2])
    @Default(2)   // (Default là khách hàng)
    LoaiTaiKhoan: number; 

    @DefaultDate('now')
    @MaxDate('now')  
    NgayTao: Date;

    constructor(init?: Partial<Web1_TaiKhoan>) {
        this.MaTK = init?.MaTK ?? 0;
        this.TenDangNhap = init?.TenDangNhap ?? '';
        this.MatKhau = init?.MatKhau ?? '';
        this.HoTen = init?.HoTen ?? '';
        this.Email = init?.Email ?? '';
        this.SoDienThoai = init?.SoDienThoai ?? '';
        this.LoaiTaiKhoan = init?.LoaiTaiKhoan ?? 2;
        this.NgayTao = init?.NgayTao ?? new Date();
    }
}