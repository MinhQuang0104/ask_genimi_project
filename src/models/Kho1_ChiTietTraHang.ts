import { Entity as TypeOrmEntity, PrimaryColumn, Column } from "typeorm";
import { Required, IsInteger, Min} from '../core/decorators/Validators';
import { Trim, AlphaNumericOnly, Default} from '../core/decorators/Transforms';
import { UniqueKey } from '../core/decorators/Unique';
import { Entity as MyEntity } from '../core/decorators/RegisterEntity';

@TypeOrmEntity('Kho1_ChiTietTraHang')
@MyEntity('Kho1_ChiTietTraHang')
export class Kho1_ChiTietTraHang {
    @Required()
    @UniqueKey()
    @PrimaryColumn({ name: 'MaPTH' })
    MaPTH: number;

    @Required()
    @UniqueKey()
    @PrimaryColumn({ name: 'MaSP' })
    MaSP: number;

    @Required()
    @IsInteger()
    @Min(1)
    @Default(1)
    @Column({ name: 'SoLuongTra' })
    SoLuongTra: number;

    // @Trim()
    // @Column({ name: 'LyDoTra', type: 'nvarchar', length: 255, nullable: true })
    // LyDoTra: string;

    @AlphaNumericOnly()
    @Column({ name: 'TinhTrangSP', type: 'nvarchar', length: 100, nullable: true })
    TinhTrangSP: string;

    constructor(init?: Partial<Kho1_ChiTietTraHang>) {
        this.MaPTH = init?.MaPTH ?? 0;
        this.MaSP = init?.MaSP ?? 0;
        this.SoLuongTra = init?.SoLuongTra ?? 1;
        // this.LyDoTra = init?.LyDoTra ?? '';
        this.TinhTrangSP = init?.TinhTrangSP ?? '';
    }
}