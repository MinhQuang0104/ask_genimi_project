import { Entity as TypeOrmEntity, PrimaryGeneratedColumn, Column } from "typeorm";
import { Required, IsDecimal, Min, InSet} from '../core/decorators/Validators';
import {Trim, AlphaNumericOnly, ToUpperCase, Default, DefaultDate } from '../core/decorators/Transforms';
import { Entity as MyEntity } from '../core/decorators/RegisterEntity';
import { UniqueKey } from '../core/decorators/Unique';

@TypeOrmEntity('KhuyenMai')
@MyEntity('KhuyenMai')
export class KhuyenMai {
    @UniqueKey()
    @PrimaryGeneratedColumn({ name: 'MaKM' })
    MaKM: number;

    @Required()
    @Trim()
    @AlphaNumericOnly()
    @Column({ name: 'TenKM', type: 'nvarchar', length: 100 })
    TenKM: string;

    @ToUpperCase()
    @Column({ name: 'MaCode', type: 'varchar', length: 20, nullable: true })
    MaCode: string;

    @Required()
    @InSet([1, 2])
    @Default(1)
    @Column({ name: 'LoaiKM' })
    LoaiKM: number; 

    @Required()
    @IsDecimal()
    @Min(0)
    @Default(0)
    @Column({ name: 'GiaTriGiam', type: 'decimal', precision: 18, scale: 2 })
    GiaTriGiam: number;

    @Column({ name: 'DieuKienTongTien', type: 'decimal', precision: 18, scale: 2, default: 0 })
    DieuKienTongTien: number;

    @Required()
    @DefaultDate('now')
    @Column({ name: 'NgayBatDau', type: 'datetime' })
    NgayBatDau: Date;

    @Required()
    @Column({ name: 'NgayKetThuc', type: 'datetime' })
    NgayKetThuc: Date; 

    @Trim()
    @Column({ name: 'DieuKienTongTien' }) // <-- Phải khớp với DB3.sql
    DieuKienApDung: number;

    @Column({ name: 'TrangThai', default: true })
    TrangThai: boolean;

    constructor(init?: Partial<KhuyenMai>) {
        this.MaKM = init?.MaKM ?? 0;
        this.TenKM = init?.TenKM ?? '';
        this.MaCode = init?.MaCode ?? '';
        this.LoaiKM = init?.LoaiKM ?? 0;
        this.GiaTriGiam = init?.GiaTriGiam ?? 0;
        this.DieuKienTongTien = init?.DieuKienTongTien ?? 0;
        this.NgayBatDau = init?.NgayBatDau ?? new Date();
        this.NgayKetThuc = init?.NgayKetThuc ?? new Date();
        this.DieuKienApDung = init?.DieuKienApDung ?? 0;
        this.TrangThai = init?.TrangThai ?? true;
    }
}