import { Entity as TypeOrmEntity, PrimaryGeneratedColumn, Column } from "typeorm";
import { Required, IsInteger, Min, MaxLen } from '../core/decorators/Validators';
import { Trim, Default } from '../core/decorators/Transforms';
import { Entity as MyEntity } from '../core/decorators/RegisterEntity';
import { UniqueKey } from '../core/decorators/Unique';

@TypeOrmEntity('Kho1_PhieuKiemKe')
@MyEntity('Kho1_PhieuKiemKe')
export class Kho1_PhieuKiemKe {
    @UniqueKey()
    @PrimaryGeneratedColumn({ name: 'MaKK' })
    MaKK: number;

    @Required()
    @Column({ name: 'MaKho' })
    MaKho: number;

    @Required()
    @Default('GETDATE()')
    @Column({ name: 'NgayLap', type: 'datetime', default: () => 'GETDATE()' })
    NgayLap: Date;

    @Required()
    @IsInteger()
    @Min(1)
    @Default(1)
    @Column({ name: 'LoaiKiemKe', default: 1 })
    LoaiKiemKe: number;

    @Required()
    @IsInteger()
    @Min(1)
    @Default(1)
    @Column({ name: 'TrangThaiKK', default: 1 })
    TrangThaiKK: number;

    @Trim()
    @MaxLen(100)
    @Column({ name: 'NguoiLap', type: 'nvarchar', length: 100, nullable: true })
    NguoiLap: string;

    constructor(init?: Partial<Kho1_PhieuKiemKe>) {
        this.MaKK = init?.MaKK ?? 0;
        this.MaKho = init?.MaKho ?? 0;
        this.NgayLap = init?.NgayLap ?? new Date();
        this.LoaiKiemKe = init?.LoaiKiemKe ?? 1;
        this.TrangThaiKK = init?.TrangThaiKK ?? 1;
        this.NguoiLap = init?.NguoiLap ?? '';
    }
}