// src/test-typeorm.ts
import "reflect-metadata"; // BẮT BUỘC với TypeORM
import { DataSource } from "typeorm";

// 1. Cấu hình kết nối (Hardcode để test cho nhanh)
const TestDataSource = new DataSource({
    type: "mssql",
    host: "localhost",      // Dùng localhost
    port: 1433,             // Port mặc định
    username: "sa",         // Tài khoản SA
    password: "123", // <--- THAY MẬT KHẨU CỦA BẠN VÀO ĐÂY
    database: "web_kho_merged",
    synchronize: false,
    logging: false,
    entities: [],           // Để rỗng vì ta chỉ test kết nối
    options: {
        encrypt: false,     // Tắt encrypt khi chạy local
        trustServerCertificate: true,
        instanceName: "SQLEXPRESS04" // Tên instance của bạn
    }
});

async function runTest() {
    console.log("⏳ Đang kết nối tới SQL Server bằng TypeORM...");

    try {
        // 2. Thử khởi tạo kết nối
        await TestDataSource.initialize();
        console.log("✅ KẾT NỐI THÀNH CÔNG!");

        // 3. Chạy thử một câu query đơn giản để chắc chắn DB phản hồi
        const result = await TestDataSource.query("SELECT @@VERSION AS version");
        console.log("📊 Phiên bản SQL Server:");
        console.log(result[0].version);

    } catch (error) {
        console.error("❌ LỖI KẾT NỐI:");
        console.error(error);
    } finally {
        // 4. Đóng kết nối
        if (TestDataSource.isInitialized) {
            await TestDataSource.destroy();
            console.log("🔌 Đã đóng kết nối.");
        }
    }
}

runTest();