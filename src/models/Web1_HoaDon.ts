import { Entity as TypeOrmEntity, PrimaryGeneratedColumn, Column } from "typeorm";
import { Required, IsDecimal, Min, InSet, IsPhoneNumber, MaxDate} from '../core/decorators/Validators';
import { Trim, Default, DefaultDate } from '../core/decorators/Transforms';
import { Entity as MyEntity } from '../core/decorators/RegisterEntity';
import { UniqueKey } from '../core/decorators/Unique';

@TypeOrmEntity('Web1_HoaDon')
@MyEntity('Web1_HoaDon')
export class Web1_HoaDon {
    @UniqueKey()
    @PrimaryGeneratedColumn({ name: 'MaHD' })
    MaHD: number;

    @Column({ name: 'MaTK', nullable: true })
    MaTK: number;

    @Column({ name: 'MaKM', nullable: true })
    MaKM: number;

    @DefaultDate('now')
    @MaxDate('now')
    @Column({ name: 'NgayDat', type: 'datetime', default: () => 'GETDATE()' })
    NgayDat: Date;

    @Column({ name: 'TongTienHang', type: 'decimal', precision: 18, scale: 2, default: 0 })
    TongTienHang: number;

    @Column({ name: 'SoTienGiam', type: 'decimal', precision: 18, scale: 2, default: 0 })
    SoTienGiam: number;

    @IsDecimal()
    @Min(0)
    @Default(0)
    @Column({ name: 'TongTienThanhToan', type: 'decimal', precision: 18, scale: 2, default: 0 })
    TongTienThanhToan: number;

    @Required()
    @InSet([1, 2, 3, 4, 5])
    @Default(1)
    @Column({ name: 'TrangThaiDonHang' })
    TrangThaiDonHang: number; 

    @Required()
    @Trim()
    @Column({ name: 'DiaChiGiaoHang', type: 'nvarchar', length: 500 })
    DiaChiGiaoHang: string;

    @Required()
    @IsPhoneNumber()
    @Column({ name: 'SoDienThoaiNguoiNhan', type: 'varchar', length: 15 })
    SoDienThoaiNguoiNhan: string;

    @Required()
    @Trim()
    @Column({ name: 'TenNguoiNhan', type: 'nvarchar', length: 100 })
    TenNguoiNhan: string;

    constructor(init?: Partial<Web1_HoaDon>) {
        this.MaHD = init?.MaHD ?? 0;
        this.MaTK = init?.MaTK ?? 0;
        this.MaKM = init?.MaKM ?? 0;
        this.NgayDat = init?.NgayDat ?? new Date();
        this.TongTienHang = init?.TongTienHang ?? 0;
        this.SoTienGiam = init?.SoTienGiam ?? 0;
        this.TongTienThanhToan = init?.TongTienThanhToan ?? 0;
        this.TrangThaiDonHang = init?.TrangThaiDonHang ?? 1;
        this.DiaChiGiaoHang = init?.DiaChiGiaoHang ?? '';
        this.SoDienThoaiNguoiNhan = init?.SoDienThoaiNguoiNhan ?? '';
        this.TenNguoiNhan = init?.TenNguoiNhan ?? '';
    }
}