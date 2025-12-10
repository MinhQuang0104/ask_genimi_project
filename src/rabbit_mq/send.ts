import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import * as rabbit from "rabbitmq-stream-js-client";
import logger from "../utils/logger"; 

// ---------------------------
// PATH CONFIG
// ---------------------------
const OFFSET_DIR = path.join(__dirname, "../config/rabbitMQ_config/offset");

// [FIX] data_csv nằm ở root (ngoài src), nên cần ../..
const DATA_SOURCE_DIR_1 = path.join(__dirname, "../../resource/data_csv/datasource1");
const DATA_SOURCE_DIR_2 = path.join(__dirname, "../../resource/data_csv/datasource2");

// Tự động tạo thư mục offset nếu chưa có
if (!fs.existsSync(OFFSET_DIR)) fs.mkdirSync(OFFSET_DIR, { recursive: true });

// ---------------------------
// LOGIC GỬI DỮ LIỆU
// ---------------------------
async function sendDataSource(client: rabbit.Client, sourceName: string, sourcePath: string) {
  logger.info(`🔌 Bắt đầu gửi cho ${sourceName} → stream ${sourceName}_stream`);

  const streamName = `${sourceName}_stream`;
  
  // 1. Tạo Stream (nếu chưa có)
  try {
    await client.createStream({ stream: streamName });
  } catch (e: any) {
    // Bỏ qua lỗi nếu stream đã tồn tại
    if (e.code !== 17) logger.warn(`Lỗi tạo stream: ${e.message}`); 
  }

  // 2. Khởi tạo Publisher
  const publisher = await client.declarePublisher({ stream: streamName });

  // 3. Đọc file CSV
  if (!fs.existsSync(sourcePath)) {
      logger.warn(`❌ Thư mục không tồn tại: ${sourcePath}`);
      return;
  }

  const files = fs.readdirSync(sourcePath).filter(f => f.endsWith(".csv"));
  if (files.length === 0) {
    logger.warn(`⚠️ Không có file CSV nào trong ${sourcePath}`);
    return;
  }

  for (const file of files) {
    const filePath = path.join(sourcePath, file);
    const offsetFile = path.join(OFFSET_DIR, `${streamName}_${file}_send.json`);

    // Load Offset cũ
    let lastOffset = 0;
    if (fs.existsSync(offsetFile)) {
      try {
        lastOffset = JSON.parse(fs.readFileSync(offsetFile, "utf8")).offset || 0;
        logger.info(`Resume gửi ${file} từ dòng ${lastOffset + 1}`);
      } catch {
        logger.warn(`Offset file lỗi, gửi lại từ đầu: ${file}`);
      }
    }

    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    let currentLine = 0;
    
    // Đọc từng dòng (Streaming)
    for await (const line of rl) {
      currentLine++;
      
      // Bỏ qua dòng đã gửi hoặc dòng trống
      if (currentLine <= lastOffset || !line.trim()) continue;

      // Gửi message: Format "TênFile:NộiDung"
      // Ví dụ: "TaiKhoan.csv:1,user01,..."
      await publisher.send(Buffer.from(`${file}:${line}`));
      
      // Lưu Offset ngay lập tức (Strong consistency)
      fs.writeFileSync(offsetFile, JSON.stringify({ offset: currentLine }));
      
      // Log nhẹ (có thể comment lại nếu spam quá)
      // logger.info(`[SENT] ${file}: dòng ${currentLine}`);
    }
    logger.info(`✅ Hoàn tất file ${file}`);
  }
}

// ---------------------------
// MAIN
// ---------------------------
async function main() {
  logger.info("🚀 STARTING RABBITMQ PRODUCER...");

  try {
    const client = await rabbit.connect({
      hostname: "localhost",
      port: 5552,
      username: "guest",
      password: "guest",
      vhost: "/"
    });

    logger.info("✅ Kết nối RabbitMQ thành công!");

    const dataSources = [
      { name: "data_source1_kho", path: DATA_SOURCE_DIR_1 },
      { name: "data_source2_web", path: DATA_SOURCE_DIR_2 },
    ];

    for (const ds of dataSources) {
      await sendDataSource(client, ds.name, ds.path);
    }

    await client.close();
    logger.info("✅ Đã gửi xong tất cả dữ liệu!");
  } catch (err: any) {
    logger.error("❌ Lỗi RabbitMQ:", {
      message: err.message,
      code: err.code,
      stack: err.stack
    });
    process.exit(1);
  }
}

main().catch(err => {
  logger.error("Fatal Error:", err);
  process.exit(1);
});
