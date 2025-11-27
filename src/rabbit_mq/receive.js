const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const rabbit = require("rabbitmq-stream-js-client");
// --- logger ---
const logger = require("../logger");

const OFFSET_DIR = path.join(__dirname, '..','config', 'rabbitMQ_config', "offset");
const STAGING_DIR = path.join(__dirname, '..', 'staging');
const CONFIG_DIR = path.join(__dirname, '..', 'config');
const TABLE_DIR = path.join(STAGING_DIR, "tables");
const RECEIVED_DIR = path.join(__dirname, '..','config','rabbitMQ_config',"received_data");

if (!fs.existsSync(OFFSET_DIR)) fs.mkdirSync(OFFSET_DIR);
if (!fs.existsSync(RECEIVED_DIR)) fs.mkdirSync(RECEIVED_DIR);
if (!fs.existsSync(STAGING_DIR)) fs.mkdirSync(STAGING_DIR);
if (!fs.existsSync(TABLE_DIR)) fs.mkdirSync(TABLE_DIR);


// --- logger ---
// Thống kê 
let totalReceived = 0;
let totalProcessed = 0;
let totalSkipped = 0;

// Hàm chọn đúng Offset API
function getOffsetAPI() {
  if (rabbit.OffsetSpecification && rabbit.OffsetSpecification.first) {
    return {
      first: rabbit.OffsetSpecification.first,
      offset: rabbit.OffsetSpecification.offset,
    };
  }
  if (rabbit.Offset && rabbit.Offset.first) {
    return {
      first: rabbit.Offset.first,
      offset: rabbit.Offset.offset,
    };
  }
  throw new Error("Không tìm thấy API Offset phù hợp!");
}
// Hash một dòng dữ liệu
function getLineHash(line) {
  return crypto.createHash("sha1").update(line).digest("hex");
}

async function receiveStream(client, streamName, outputFile) {
  const OffsetAPI = getOffsetAPI();

  await client.createStream({ stream: streamName, maxAge: "6h" });

  // File offset và hash riêng cho từng stream
  const offsetFile = path.join(OFFSET_DIR, `${streamName}_recv.json`);
  const hashFile = path.join(RECEIVED_DIR, `${streamName}_hash.json`);  

  // Load offset
  let startOffset = OffsetAPI.first();
  if (fs.existsSync(offsetFile)) {
    try {
      const stored = JSON.parse(fs.readFileSync(offsetFile, "utf8")).offset;
      if (typeof stored === "number" && !isNaN(stored)) {
        startOffset = OffsetAPI.offset(BigInt(stored) + 1n);
        console.log(`Resume ${streamName} từ offset ${stored + 1}`);
        // --- logger ---
        logger.info(`Resume ${streamName} từ offset ${stored + 1}`);
      }
    } catch {
      console.warn(`Offset lỗi → đọc lại từ đầu.`);
      // --- logger ---
      logger.warn(`Offset lỗi → đọc lại từ đầu (stream=${streamName}).`);
    }
  }

  // Load hash vĩnh viễn
  let seenHashes = new Set();
  if (fs.existsSync(hashFile)) {
    try {
      const arr = JSON.parse(fs.readFileSync(hashFile, "utf8"));
      if (Array.isArray(arr)) seenHashes = new Set(arr);
    } catch {
      console.warn(`Hash file lỗi → tạo mới.`);
      // --- logger ---
      logger.warn(`Hash file lỗi → tạo mới (stream=${streamName}).`);
    }
  }

  // Hash trong cùng session runtime
  const sessionSet = new Set();

  console.log(`Bắt đầu nhận stream: ${streamName}`);

  // --- logger ---
  logger.info(` Bắt đầu nhận stream ${streamName} với offset ${startOffset.value || startOffset}`);
  // Nhận dữ liệu
  await client.declareConsumer(
    { stream: streamName, offset: startOffset },
    (msg) => {
      try {
        const text = msg.content.toString();
        // --- logger ---
        totalReceived++;
        logger.info(`[${streamName}] Nhận record offset=${msg.offset}`);
        const hash = getLineHash(text);

        // Kiểm tra trùng lặp
        if (sessionSet.has(hash) || seenHashes.has(hash)) {
          //Nếu hash đã tồn tại ở session hiện tại (sessionSet) hoặc file vĩnh viễn (seenHashes), bỏ qua . 
          totalSkipped++;

          logger.warn(`[${streamName}]  BỎ QUA record trùng hash=${hash}`);
          return;
          
        }

        // Lưu hash cho session và vĩnh viễn
        sessionSet.add(hash); // lưu hash trong phiên runtime hiện tại
        seenHashes.add(hash); // lưu hash vĩnh viễn trên file

        // Ghi offset
        fs.writeFileSync(
          offsetFile,
          JSON.stringify({ offset: Number(msg.offset) })
        );
        //   TÁCH FILE THEO TỪNG BẢNG 
        const parts = text.split(":");
        if (parts.length < 2) {
          console.warn(" Dòng không hợp lệ, bỏ qua:", text);
          // --- logger ---
          logger.warn(`[${streamName}]  Dòng không hợp lệ, bỏ qua: ${text}`);
          return;
        }

        const tableName = parts[0].trim();  // VD: ChiTietHoaDon.csv
        const rowData = parts.slice(1).join(":"); // phần sau dấu :  

        // Tạo file theo bảng
        const tableFile = path.join(STAGING_DIR, tableName);

        fs.appendFileSync(tableFile, rowData + "\n");

        // Ghi hash file
        fs.writeFileSync(hashFile, JSON.stringify([...seenHashes]));

        console.log(`[${streamName}] → ${tableName} | offset=${msg.offset}`);
        // --- logger ---
        totalProcessed++;
        logger.info(`[${streamName}] ✔️ Ghi vào bảng ${tableName}, offset=${msg.offset}`);

      } catch (err) {
        // --- logger ---
        logger.error(` Lỗi xử lý record offset=${msg?.offset}: ${err.stack}`); 
      }
    }
  );
}
// --- logger ---
// Ghi log thống kê mỗi 5 giây
setInterval(() => {
  logger.info(
    `THỐNG KÊ: Tổng nhận=${totalReceived}, ` +
    `Đã xử lý=${totalProcessed}, Bỏ qua=${totalSkipped}`
  );
}, 5000);
// hàm kết nối
async function main() {
  const client = await rabbit.connect({
    hostname: "localhost",
    port: 5552,
    username: "guest",
    password: "guest",
  });
//// xem lại đoạn này

  const streams = [
    { name: "data_source1_kho_stream", output: path.join(STAGING_DIR, "data_source1_received.csv") },
    { name: "data_source2_web_stream", output: path.join(STAGING_DIR, "data_source2_received.csv") },
  ];

  // Chạy song song 2 stream
  await Promise.all(streams.map(s => receiveStream(client, s.name, s.output)));

  console.log(" Đang lắng nghe các stream...");
  // --- logger ---
  logger.info(" Hệ thống đã khởi động, đang lắng nghe tất cả stream...");
}

main().catch((err) => {
  console.error(" Error khi nhận:", err);
  // --- logger ---
  logger.error(` Lỗi không bắt được trong main(): ${err.stack}`);
  
  process.exit(1);
});
