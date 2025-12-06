import { Entity as TypeOrmEntity, PrimaryColumn, Column } from "typeorm";
import { Required, IsInteger, MaxLen} from '../core/decorators/Validators';
import { Trim } from '../core/decorators/Transforms';
import { Entity as MyEntity } from '../core/decorators/RegisterEntity';

@TypeOrmEntity('Kho1_ChiTietKiemKe')
@MyEntity('Kho1_ChiTietKiemKe')
export class Kho1_ChiTietKiemKe {
    @Required()
    @PrimaryColumn({ name: 'MaKK' })
    MaKK: number; 

    @Required()
    @PrimaryColumn({ name: 'MaSP' })
    MaSP: number; 

    @Required()
    @IsInteger()
    @Column({ name: 'SoLuongHeThong' })
    SoLuongHeThong: number;

    @Required()
    @IsInteger()
    @Column({ name: 'SoLuongThucTe' })
    SoLuongThucTe: number;

    // @Column({ name: 'SoLuongLech', nullable: true })
    // SoLuongLech: number; 

    @Trim()
    @MaxLen(255)
    @Column({ name: 'LyDoLech', type: 'nvarchar', length: 255, nullable: true })
    LyDoLech: string;

    constructor(init?: Partial<Kho1_ChiTietKiemKe>) {
        this.MaKK = init?.MaKK ?? 0;
        this.MaSP = init?.MaSP ?? 0;
        this.SoLuongHeThong = init?.SoLuongHeThong ?? 0;
        this.SoLuongThucTe = init?.SoLuongThucTe ?? 0;
        // this.SoLuongLech = init?.SoLuongLech ?? 0;
        this.LyDoLech = init?.LyDoLech ?? '';
    }
}