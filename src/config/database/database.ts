// src/config/database.ts
// import sql from 'mssql';
import logger from '../../utils/logger';
import sql from 'mssql/msnodesqlv8';


const config = {
  server: "DESKTOP-ENMQ292\SQLEXPRESS04",
  database: "web_kho_merged",
  options: {
    trustedConnection: true, // Set to true if using Windows Authentication
    trustServerCertificate: true, // Set to true if using self-signed certificates
  },
  // driver: "ODBC Driver 18 for SQL Server", // Uncomment to use specific driver
};

export class Database {
    private static pool: sql.ConnectionPool;

    static async connect() {
        if (!this.pool) {
            try {
                this.pool = await new sql.ConnectionPool(config).connect();
                logger.info('✅ Đã kết nối SQL Server');
            } catch (err) {
                logger.error('❌ Lỗi kết nối SQL Server:', err);
                throw err;
            }
        }
        return this.pool;
    }

    static async getPool() {
        if (!this.pool) await this.connect();
        return this.pool;
    }
}