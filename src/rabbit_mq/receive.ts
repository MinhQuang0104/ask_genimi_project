import fs from "fs";
import path from "path";
import crypto from "crypto";
import * as rabbit from "rabbitmq-stream-js-client";
import Fuse from "fuse.js"; 
// [FIX] Import logger đúng đường dẫn
import logger from "../utils/logger";  

// ---------------------------
// CONFIG PATHS
// ---------------------------
// Lấy root dir (thư mục chứa package.json)
const ROOT_DIR = path.resolve(__dirname, "../../"); 
const STAGING_DIR = path.join(ROOT_DIR, "resource", "data_csv", "staging");

// Config RabbitMQ
const CONFIG_DIR = path.join(__dirname, "..", "config");
const RABBIT_CONFIG_DIR = path.join(CONFIG_DIR, "rabbitmq_config");
const OFFSET_DIR = path.join(RABBIT_CONFIG_DIR, "offset");
const RECEIVED_DIR = path.join(RABBIT_CONFIG_DIR, "received_data");

// Các thư mục output của quy trình Receive
const TABLE_DIR = path.join(STAGING_DIR, "tables"); // Dữ liệu thô (Raw)
const OUTPUT_MATCHED = path.join(STAGING_DIR, "matched"); // Trùng (Fuzzy Match)
const OUTPUT_NEW = path.join(STAGING_DIR, "new_items");   // Mới hoàn toàn
const OUTPUT_REVIEW = path.join(STAGING_DIR, "manual_review"); // Cần review

// Tạo thư mục nếu chưa có
const dirsToCreate = [
    OFFSET_DIR, RECEIVED_DIR, STAGING_DIR, 
    TABLE_DIR, OUTPUT_MATCHED, OUTPUT_NEW, OUTPUT_REVIEW
];

dirsToCreate.forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ---------------------------
// STATE & VARIABLES
// ---------------------------
let totalReceived = 0;
let totalProcessed = 0;
let totalSkipped = 0;

// Master Data (Dùng cho Fuzzy Matching)
// Trong thực tế, cái này nên load từ DB hoặc file chuẩn
let masterData: string[] = []; 

// Fuse instance
let fuse: Fuse<string>;

// ---------------------------
// HELPERS
// ---------------------------

// Giả lập load Master Data (Ví dụ lấy tên sản phẩm từ file đã clean)
function loadMasterData() {
    // TODO: Implement logic đọc từ file _passed.csv hoặc DB
    // Đây là dữ liệu mẫu để test fuzzy matching
    masterData = [
        "iPhone 14 Pro Max",
        "Samsung Galaxy S23 Ultra",
        "MacBook Pro M2",
        "Sony WH-1000XM5"
    ];
    
    // Cấu hình Fuse.js
    const options = {
        includeScore: true,
        threshold: 0.4, // Độ chính xác (0.0 = tuyệt đối, 1.0 = rất lỏng)
    };
    fuse = new Fuse(masterData, options);
    logger.info(`Đã load ${masterData.length} bản ghi Master Data cho Fuzzy Matching.`);
}

function getOffsetAPI() {
  if ((rabbit as any).OffsetSpecification?.first) {
    return {
      first: (rabbit as any).OffsetSpecification.first,
      offset: (rabbit as any).OffsetSpecification.offset,
    };
  }
  if ((rabbit as any).Offset?.first) {
    return {
      first: (rabbit as any).Offset.first,
      offset: (rabbit as any).Offset.offset,
    };
  }
  throw new Error("Không tìm thấy API Offset phù hợp!");
}

function getLineHash(line: string) {
  return crypto.createHash("sha1").update(line).digest("hex");
}

function safeAppendFile(filePath: string, data: string) {
    try {
        fs.appendFileSync(filePath, data);
    } catch (err) {
        logger.error(`Lỗi ghi file ${filePath}: ${err}`);
    }
}

// ---------------------------
// LOGIC RECEIVE
// ---------------------------

async function receiveStream(client: rabbit.Client, streamName: string, outputFile: string) {
  const OffsetAPI = getOffsetAPI();

  // Tạo stream nếu chưa có
  try {
      await client.createStream({ stream: streamName });
  } catch (e: any) {
      if (e.code !== 17) logger.warn(`Lỗi tạo stream ${streamName}: ${e.message}`);
  }

  const offsetFile = path.join(OFFSET_DIR, `${streamName}_recv.json`);
  const hashFile = path.join(RECEIVED_DIR, `${streamName}_hash.json`);  

  // Load Offset
  let startOffset = OffsetAPI.first();
  if (fs.existsSync(offsetFile)) {
    try {
      const stored = JSON.parse(fs.readFileSync(offsetFile, "utf8")).offset;
      if (typeof stored === "number" && !isNaN(stored)) {
        startOffset = OffsetAPI.offset(BigInt(stored) + 1n);
        logger.info(`Resume ${streamName} từ offset ${stored + 1}`);
      }
    } catch {
      logger.warn(`Offset lỗi → đọc lại từ đầu (${streamName}).`);
    }
  }

  // Load Hash (Dedup)
  let seenHashes = new Set<string>();
  if (fs.existsSync(hashFile)) {
    try {
      const arr = JSON.parse(fs.readFileSync(hashFile, "utf8"));
      if (Array.isArray(arr)) seenHashes = new Set(arr);
    } catch {
        // Ignore error
    }
  }
  const sessionSet = new Set<string>();

  logger.info(`🎧 Đang lắng nghe stream: ${streamName}`);

  await client.declareConsumer(
    { stream: streamName, offset: startOffset },
    (msg) => {
      try {
        const text = msg.content.toString();
        totalReceived++;
        
        // 1. Deduplication (Check trùng chính xác 100%)
        const hash = getLineHash(text);
        if (sessionSet.has(hash) || seenHashes.has(hash)) {
          totalSkipped++;
          return; // Bỏ qua
        }

        sessionSet.add(hash);
        seenHashes.add(hash);

        // Lưu Offset
        fs.writeFileSync(offsetFile, JSON.stringify({ offset: Number(msg.offset) }));

        // 2. Parse Data
        const parts = text.split(":");
        if (parts.length < 2) return;

        const tableName = parts[0].trim();
        const rowData = parts.slice(1).join(":");
        
        // Ghi vào bảng Staging (Raw Data)
        const tableFile = path.join(TABLE_DIR, tableName);
        safeAppendFile(tableFile, rowData + "\n");

        // 3. Fuzzy Matching Logic (Mới bổ sung)
        // Giả sử rowData là tên sản phẩm hoặc chứa tên sản phẩm
        // Ở đây ta check đơn giản trên chuỗi rowData
        const searchResult = fuse.search(rowData);
        
        if (searchResult.length > 0) {
            // CASE: Tìm thấy dữ liệu tương tự trong Master Data
            const bestMatch = searchResult[0];
            if (bestMatch.score && bestMatch.score < 0.1) {
                 // Rất giống -> Coi như trùng -> Ghi vào Matched
                 safeAppendFile(path.join(OUTPUT_MATCHED, `${tableName}_matched.csv`), 
                    `${rowData} | MATCHED: ${bestMatch.item} (Score: ${bestMatch.score})\n`);
            } else {
                 // Hơi giống -> Cần review thủ công
                 safeAppendFile(path.join(OUTPUT_REVIEW, `${tableName}_review.csv`), 
                    `${rowData} | MAYBE: ${bestMatch.item} (Score: ${bestMatch.score})\n`);
            }
        } else {
            // CASE: Mới hoàn toàn
            safeAppendFile(path.join(OUTPUT_NEW, `${tableName}_new.csv`), rowData + "\n");
        }

        // Lưu Hash File (Checkpoint)
        fs.writeFileSync(hashFile, JSON.stringify([...seenHashes]));

        totalProcessed++;
        // logger.info(`[${streamName}] ✔️ Xử lý xong offset=${msg.offset}`);

      } catch (err: any) {
        logger.error(`Lỗi xử lý record: ${err.stack}`);
      }
    }
  );
}

// ---------------------------
// STATS LOGGING
// ---------------------------
setInterval(() => {
  if (totalReceived > 0) {
      logger.info(
        `📊 THỐNG KÊ: Recv=${totalReceived} | Proc=${totalProcessed} | Skip=${totalSkipped}`
      );
  }
}, 5000);

// ---------------------------
// MAIN
// ---------------------------
async function main() {
  // Load dữ liệu mẫu để so khớp
  loadMasterData();

  const client = await rabbit.connect({
    hostname: "localhost",
    port: 5552,
    username: "guest",
    password: "guest",
    vhost: "/"
  });

  const streams = [
    { name: "data_source1_kho_stream", output: "" },
    { name: "data_source2_web_stream", output: "" },
  ];

  await Promise.all(streams.map(s => receiveStream(client, s.name, s.output)));

  logger.info("🚀 Hệ thống đang chạy. Nhấn Ctrl+C để dừng.");
}

main().catch((err) => {
  logger.error(`🔥 Fatal Error: ${err.stack}`);
  process.exit(1);
});