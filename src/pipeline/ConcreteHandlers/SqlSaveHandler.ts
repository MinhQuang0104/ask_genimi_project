// src/pipeline/ConcreteHandlers/SqlSaveHandler.ts
import { Handler, PipelineContext } from '../Handler';
import { AppDataSource } from '../../config/database/typeormConfig';
import logger from '../../utils/logger';

export class SqlSaveHandler extends Handler {

    // Danh sách các bảng có cột IDENTITY (Tự tăng) cần bật IDENTITY_INSERT khi import
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

        // Chỉ xử lý nếu dữ liệu hợp lệ và chưa bị đánh dấu skip
        if (isValid && entity && tableName && !context.isSkipped) {
            
            // Kiểm tra xem bảng hiện tại có nằm trong danh sách cần bật Identity Insert không
            const hasIdentity = this.IDENTITY_TABLES.includes(tableName);

            try {
                // Sử dụng Transaction để đảm bảo an toàn dữ liệu
                await AppDataSource.transaction(async (transactionalEntityManager) => {
                    
                    if (hasIdentity) {
                        // 1. Bật IDENTITY_INSERT cho bảng hiện tại
                        await transactionalEntityManager.query(`SET IDENTITY_INSERT ${tableName} ON`);
                    }

                    // 2. Thực hiện Insert
                    // LƯU Ý: Phải dùng createQueryBuilder().insert() thay vì save()
                    // Lý do: save() của TypeORM sẽ tự động bỏ qua giá trị ID nếu model khai báo @PrimaryGeneratedColumn
                    await transactionalEntityManager
                        .createQueryBuilder()
                        .insert()
                        .into(tableName)
                        .values(entity)
                        .execute();

                    if (hasIdentity) {
                        // 3. Tắt IDENTITY_INSERT ngay lập tức
                        await transactionalEntityManager.query(`SET IDENTITY_INSERT ${tableName} OFF`);
                    }
                });

                // --- GHI LOG THÀNH CÔNG ---
                context.isSavedToDB = true;
                
                // Lấy giá trị khóa chính để log (Field đầu tiên của object)
                const firstKey = Object.keys(entity)[0];
                const firstVal = entity[firstKey];
                logger.info(`  [Record ${context.recordIndex}] DB Saved: ${tableName} (Key: ${firstVal}) ${hasIdentity ? '[Identity Insert]' : ''}`);

            } catch (err: any) {
                // Xử lý lỗi trùng lặp (Violation of PRIMARY KEY constraint)
                if (err.message && err.message.includes('Violation of PRIMARY KEY')) {
                     logger.warn(`  [Record ${context.recordIndex}] DB Skip: Record đã tồn tại (Duplicate Key).`);
                     context.isSkipped = true; // Đánh dấu là skip để không tính là lỗi
                } else {
                    logger.error(`  [Record ${context.recordIndex}] DB Error: ${err.message}`);
                    context.isValid = false;
                    context.errors = context.errors || [];
                    context.errors.push(`SQL Error: ${err.message}`);
                }
            }
        }

        await super.handle(context);
    }
}