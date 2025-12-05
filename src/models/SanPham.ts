import { Entity as TypeOrmEntity, PrimaryGeneratedColumn, Column } from "typeorm";
import { Required, IsInteger, IsDecimal, Min, IsUrlOrPath } from '../core/decorators/Validators';
import { Trim, AlphaNumericOnly, Default} from '../core/decorators/Transforms';
import { Entity as MyEntity } from '../core/decorators/RegisterEntity';
import { UniqueKey } from '../core/decorators/Unique';

@TypeOrmEntity('SanPham')
@MyEntity('SanPham')
export class SanPham {
    @UniqueKey()
    @PrimaryGeneratedColumn({ name: 'MaSP' })
    MaSP: number;

    @Required()
    @Trim()
    @AlphaNumericOnly()
    @Column({ name: 'TenSP', type: 'nvarchar', length: 255 })
    TenSP: string;

    @Required()
    @Column({ name: 'MaLoaiHang' }) // DB3 dùng MaLoaiHang, Code cũ dùng MaDM. Sửa lại cho khớp DB3.
    MaDM: number;

    @Column({ name: 'MaThue', nullable: true })
    MaThue: number;

    @Trim()
    @AlphaNumericOnly()
    @Column({ name: 'MoTaChiTiet', type: 'nvarchar', length: 'max', nullable: true })
    MoTaChiTiet: string;

    @Required()
    @IsDecimal()
    @Min(0)
    @Default(0)
    @Column({ name: 'GiaBan', type: 'decimal', precision: 18, scale: 2 })
    GiaBan: number;

    @Required()
    @IsInteger()
    @Min(0)
    @Default(0)
    @Column({ name: 'SoLuongTon', default: 0 })
    SoLuongTon: number;

    @Trim()
    @AlphaNumericOnly()
    @Column({ name: 'NhaSanXuat', type: 'nvarchar', length: 100, nullable: true })
    NhaSanXuat: string;

    @Trim()
    @IsUrlOrPath()
    @Column({ name: 'HinhAnh', type: 'nvarchar', length: 'max', nullable: true })
    HinhAnh: string;

    @Column({ name: 'TrangThai', default: true })
    TrangThai: boolean;

    constructor(init?: Partial<SanPham>) {
        this.MaSP = init?.MaSP ?? 0;
        this.TenSP = init?.TenSP ?? '';
        this.MaDM = init?.MaDM ?? 0;
        this.MaThue = init?.MaThue ?? 0;
        this.MoTaChiTiet = init?.MoTaChiTiet ?? '';
        this.GiaBan = init?.GiaBan ?? 0;
        this.SoLuongTon = init?.SoLuongTon ?? 0;
        this.NhaSanXuat = init?.NhaSanXuat ?? '';
        this.HinhAnh = init?.HinhAnh ?? '';
        this.TrangThai = init?.TrangThai ?? true;
    }
}