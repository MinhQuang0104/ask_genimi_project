import { Entity as TypeOrmEntity, PrimaryGeneratedColumn, Column } from "typeorm";
import { Required, IsInteger, InRange } from '../core/decorators/Validators';
import { Trim, Default, DefaultDate } from '../core/decorators/Transforms';
import { UniqueKey } from '../core/decorators/Unique';
import { Entity as MyEntity } from '../core/decorators/RegisterEntity';

@TypeOrmEntity('Web1_DanhGia')
@MyEntity('Web1_DanhGia')
export class Web1_DanhGia {
    @UniqueKey()
    @PrimaryGeneratedColumn({ name: 'MaDG' })
    MaDG: number;

    @Required()
    @Column({ name: 'MaTK' })
    MaTK: number;

    @Required()
    @Column({ name: 'MaSP' })
    MaSP: number;

    @Column({ name: 'MaHD', nullable: true })
    MaHD: number;

    @Required()
    @IsInteger()
    @InRange(1, 5)
    @Default(1)
    @Column({ name: 'DiemDanhGia' })
    DiemDanhGia: number;

    @Trim()
    @Column({ name: 'NoiDung', type: 'nvarchar', length: 'max', nullable: true })
    NoiDung: string;

    @DefaultDate('now')
    @Column({ name: 'NgayDG', type: 'datetime', default: () => 'GETDATE()' })
    NgayDG: Date;

    constructor(init?: Partial<Web1_DanhGia>) {
        this.MaDG = init?.MaDG ?? 0;
        this.MaTK = init?.MaTK ?? 0;
        this.MaHD = init?.MaHD ?? 0;
        this.MaSP = init?.MaSP ?? 0;
        this.DiemDanhGia = init?.DiemDanhGia ?? 5;
        this.NoiDung = init?.NoiDung ?? '';
        this.NgayDG = init?.NgayDG ?? new Date();
    }
}