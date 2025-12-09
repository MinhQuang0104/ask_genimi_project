import { Handler, PipelineContext } from '../Handler';
import { AppDataSource } from '../../config/database/typeormConfig';
import logger from '../../utils/logger';

export class SqlSaveHandler extends Handler {

    // Danh sách các bảng có cột IDENTITY (Tự tăng) cần bật IDENTITY_INSERT
    private readonly IDENTITY_TABLES = [
        "Thue", "LoaiHang", "NhaCungCap", "KhoHang", "ViTriKho", 
        "SanPham", "AnhSanPham", "KhuyenMai", 
        "Web1_TaiKhoan", "Web1_SoDiaChi", "Web1_HoaDon", "Web1_DanhGia", 
        "Web1_GioHang", "Web1_ThanhToan", "Web1_LichSuDonHang",
        "Kho1_PhieuNhap", "Kho1_PhieuXuat", "Kho1_VanDon", 
        "Kho1_PhieuTraHang", "Kho1_PhieuKiemKe"
    ];

    async handle(context: PipelineContext): Promise<void> {
        const { tableName, entity, isValid } = context;
        const stageName = 'DB_SAVE';

        if (isValid && entity && tableName && !context.isSkipped) {
            
            const hasIdentity = this.IDENTITY_TABLES.includes(tableName);

            try {
                await AppDataSource.transaction(async (transactionalEntityManager) => {
                    if (hasIdentity) {
                        await transactionalEntityManager.query(`SET IDENTITY_INSERT ${tableName} ON`);
                    }

                    await transactionalEntityManager
                        .createQueryBuilder()
                        .insert()
                        .into(tableName)
                        .values(entity)
                        .execute();

                    if (hasIdentity) {
                        await transactionalEntityManager.query(`SET IDENTITY_INSERT ${tableName} OFF`);
                    }
                });

                context.isSavedToDB = true;
                
                const firstKey = Object.keys(entity)[0];
                const firstVal = entity[firstKey];
                
                // [BỔ SUNG] Thêm recordData vào log thành công
                logger.info(`DB Saved Success`, {
                    stage: stageName,
                    recordIndex: context.recordIndex,
                    tableName: tableName,
                    primaryKey: firstVal,
                    identityInsert: hasIdentity,
                    // Chi tiết toàn bộ field + value đã lưu
                    recordData: entity 
                });

            } catch (err: any) {
                if (err.message && err.message.includes('Violation of PRIMARY KEY')) {
                     // [BỔ SUNG] Thêm recordData vào log duplicate
                     logger.warn(`DB Duplicate Key`, {
                         stage: stageName,
                         recordIndex: context.recordIndex,
                         tableName: tableName,
                         error: err.message,
                         // Chi tiết dữ liệu bị trùng
                         recordData: entity 
                     });
                     
                     context.isSkipped = true; 
                } else {
                    logger.error(`DB Insert Error`, {
                        stage: stageName,
                        recordIndex: context.recordIndex,
                        tableName: tableName,
                        error: err.message,
                        // Code cũ của bạn đã có failingRecordData, tôi giữ nguyên và đảm bảo tính nhất quán
                        recordData: entity 
                    });

                    context.isValid = false;
                    context.errors = context.errors || [];
                    context.errors.push(`SQL Error: ${err.message}`);
                }
            }
        }

        await super.handle(context);
    }
}