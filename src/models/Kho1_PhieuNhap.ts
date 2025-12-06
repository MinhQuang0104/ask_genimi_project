import { Entity as TypeOrmEntity, PrimaryGeneratedColumn, Column } from "typeorm";
import { Required, IsInteger } from '../core/decorators/Validators';
import { Trim, DefaultDate} from '../core/decorators/Transforms';
import { Entity as MyEntity } from '../core/decorators/RegisterEntity';
import { UniqueKey } from '../core/decorators/Unique';

@TypeOrmEntity('Kho1_PhieuNhap')
@MyEntity('Kho1_PhieuNhap')
export class Kho1_PhieuNhap {
    @UniqueKey()
    @PrimaryGeneratedColumn({ name: 'MaPN' })
    MaPN: number;

    @Required()
    @IsInteger()
    @Column({ name: 'MaNCC' })
    MaNCC: number;

    @Required()
    @IsInteger()
    @Column({ name: 'MaKho' })
    MaKho: number;

    @DefaultDate('now')
    @Column({ name: 'NgayNhap', type: 'datetime', default: () => 'GETDATE()' })
    NgayNhap: Date;

    @Trim()
    @Column({ name: 'NguoiNhap', type: 'nvarchar', length: 100, nullable: true })
    NguoiNhap: string;
    @Column({ name: 'TrangThaiPN', default: 1 })
    TrangThaiPN: number;
    @Trim()
    @Column({ name: 'GhiChu', type: 'nvarchar', length: 'max', nullable: true })
    GhiChu: string;
    
    // Trong Kho1_PhieuNhap.ts
    @Column({ name: 'TongTienNhap', type: 'decimal', precision: 18, scale: 2, default: 0 })
    TongTienNhap: number;
    constructor(init?: Partial<Kho1_PhieuNhap>) {
        this.MaPN = init?.MaPN ?? 0;
        this.MaNCC = init?.MaNCC ?? 0;
        this.MaKho = init?.MaKho ?? 0;
        this.TongTienNhap = init?.TongTienNhap ?? 0;
        this.TrangThaiPN = init?.TrangThaiPN ?? 1;
        this.NgayNhap = init?.NgayNhap ?? new Date();
        this.NguoiNhap = init?.NguoiNhap ?? '';
        this.GhiChu = init?.GhiChu ?? '';
    }
}