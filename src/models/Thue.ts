import { Entity as TypeOrmEntity, PrimaryGeneratedColumn, Column } from "typeorm";
import { Required, IsDecimal, InRange } from '../core/decorators/Validators';
import { Trim, AlphaNumericOnly, Default} from '../core/decorators/Transforms';
import { Entity as MyEntity } from '../core/decorators/RegisterEntity';
import { UniqueKey } from '../core/decorators/Unique';

@TypeOrmEntity('Thue')
@MyEntity('Thue')
export class Thue {
    @UniqueKey()
    @PrimaryGeneratedColumn({ name: 'MaThue' })
    MaThue: number;

    @Required()
    @Trim()
    @AlphaNumericOnly()
    @Column({ name: 'TenThue', type: 'nvarchar', length: 50 })
    TenThue: string;

    @Required()
    @IsDecimal()
    @InRange(0, 100)
    @Default(0)
    @Column({ name: 'PhanTramThue', type: 'decimal', precision: 5, scale: 2 })
    PhanTramThue: number;

    constructor(init?: Partial<Thue>) {
        this.MaThue = init?.MaThue ?? 0;
        this.TenThue = init?.TenThue ?? '';
        this.PhanTramThue = init?.PhanTramThue ?? 0;
    }
}