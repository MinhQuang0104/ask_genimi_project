import { Required, IsInteger, Min} from '../core/decorators/Validators';
import { Default} from '../core/decorators/Transforms';
import { UniqueKey } from '../core/decorators/Unique';
import { Entity } from '../core/decorators/RegisterEntity';

@Entity('Kho1_ChiTietPhieuXuat')
export class Kho1_ChiTietPhieuXuat {
    @Required()
    @UniqueKey()
    MaPX: number;

    @Required()
    @UniqueKey()
    MaSP: number;

    @Required()
    @IsInteger()
    @Min(1)
    @Default(1) // [cite: 631]
    SoLuongXuat: number;

    constructor(init?: Partial<Kho1_ChiTietPhieuXuat>) {
        this.MaPX = init?.MaPX ?? 0;
        this.MaSP = init?.MaSP ?? 0;
        this.SoLuongXuat = init?.SoLuongXuat ?? 1;
    }
}