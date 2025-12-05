// src/config/database/typeormConfig.ts
import { DataSource } from "typeorm";
import logger from "../../utils/logger";
import path from "path";

export const AppDataSource = new DataSource({
    type: "mssql",
    host: "localhost", // Dùng localhost
    port: 1433,        // Đảm bảo bạn đã bật TCP/IP port 1433 như hướng dẫn trước
    
    // --- CẤU HÌNH TÀI KHOẢN SA ---
    username: "sa",              // Tên đăng nhập
    password: "123",   // Mật khẩu bạn vừa đặt ở Bước 1 (VD: '123456')
    database: "web_kho_merged",
    // -----------------------------

    synchronize: false, // Tắt để tránh sửa đổi cấu trúc bảng tự động
    logging: false,     // Bật true nếu muốn xem câu lệnh SQL chạy ngầm
    entities: [path.join(__dirname, "../../models/**/*.{ts,js}")],
    
    options: {
        encrypt: false, // Tắt mã hóa cho local dev
        trustServerCertificate: true, // Tin cậy chứng chỉ tự ký
        instanceName: "SQLEXPRESS04"  // Tên instance của bạn (để chắc chắn kết nối đúng)
    }
});

export const initializeDatabase = async () => {
    try {
        await AppDataSource.initialize();
        logger.info("✅ TypeORM: Kết nối SQL Server thành công (User: sa)!");
    } catch (error) {
        logger.error("❌ TypeORM: Lỗi kết nối:", error);
        throw error;
    }
};