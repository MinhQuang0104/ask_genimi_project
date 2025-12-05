import { Entity as TypeOrmEntity, PrimaryColumn, Column } from "typeorm";
import { Required, MinLen, IsInteger, IsDecimal, Min} from '../core/decorators/Validators';
import { Default} from '../core/decorators/Transforms';
import { Entity as MyEntity } from '../core/decorators/RegisterEntity';
import { UniqueKey } from '../core/decorators/Unique';

@TypeOrmEntity('Kho1_TonKho')
@MyEntity('Kho1_TonKho')
export class Kho1_TonKho {
    @Required()
    @UniqueKey()
    @PrimaryColumn({ name: 'MaKho' })
    MaKho: number;

    @Required()
    @UniqueKey()
    @PrimaryColumn({ name: 'MaSP' })
    MaSP: number;

    @Required()
    @IsInteger()
    @Min(0)
    @Default(0)
    @Column({ name: 'SoLuongTon', default: 0 })
    SoLuongTon: number;

    @Required()
    @IsInteger()
    @Min(0)
    @Default(0)
    @Column({ name: 'SoLuongTamGiu', default: 0 })
    SoLuongTamGiu: number;

    // Cột Computed: SoLuongCoTheBan. 
    // Trong TypeORM để insert dữ liệu chúng ta không map cột computed.
    // Nếu bạn muốn đọc về, có thể dùng @Column({ select: false }) hoặc @Column({ insert: false, update: false })
    @Column({ name: 'SoLuongCoTheBan', insert: false, update: false, nullable: true })
    SoLuongCoTheBan: number; 

    @Column({ name: 'NgayCapNhat', type: 'datetime', default: () => 'GETDATE()' })
    NgayCapNhat: Date;

    constructor(init?: Partial<Kho1_TonKho>) {
        this.MaKho = init?.MaKho ?? 0;
        this.MaSP = init?.MaSP ?? 0;
        this.SoLuongTon = init?.SoLuongTon ?? 0;
        this.SoLuongTamGiu = init?.SoLuongTamGiu ?? 0;
        this.SoLuongCoTheBan = init?.SoLuongCoTheBan ?? 0;
        this.NgayCapNhat = init?.NgayCapNhat ?? new Date();
    }
}