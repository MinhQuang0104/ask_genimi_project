import { Entity as TypeOrmEntity, PrimaryGeneratedColumn, Column } from "typeorm";
import { Required, MinLen, InSet, IsEmail, IsPhoneNumber, MaxDate} from '../core/decorators/Validators';
import { Trim, AlphaNumericOnly, RemoveWhitespace, ToLowerCase, Default, DefaultDate } from '../core/decorators/Transforms';
import { Entity as MyEntity } from '../core/decorators/RegisterEntity';
import { UniqueKey } from '../core/decorators/Unique';

@TypeOrmEntity('Web1_TaiKhoan')
@MyEntity('Web1_TaiKhoan')
export class Web1_TaiKhoan {
    @UniqueKey()
    @PrimaryGeneratedColumn({ name: 'MaTK' })
    MaTK: number;

    @Required()
    @RemoveWhitespace()
    @AlphaNumericOnly()
    @Column({ name: 'TenDangNhap', type: 'varchar', length: 50 })
    TenDangNhap: string;

    @Required()
    @Trim()
    @MinLen(6)
    @Column({ name: 'MatKhau', type: 'varchar', length: 255 })
    MatKhau: string;

    @Required()
    @Trim()
    @AlphaNumericOnly()
    @Column({ name: 'HoTen', type: 'nvarchar', length: 100 })
    HoTen: string;

    @Required()
    @ToLowerCase()
    @IsEmail()
    @Default('')
    @Column({ name: 'Email', type: 'nvarchar', length: 100 })
    Email: string;

    @Trim()
    @IsPhoneNumber()
    @Default('')
    @Column({ name: 'SoDienThoai', type: 'varchar', length: 15, nullable: true })
    SoDienThoai: string;

    @Required()
    @InSet([1, 2])
    @Default(2)
    @Column({ name: 'LoaiTaiKhoan', default: 2 })
    LoaiTaiKhoan: number; 

    @DefaultDate('now')
    @MaxDate('now')
    @Column({ name: 'NgayTao', type: 'datetime', default: () => 'GETDATE()' })
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