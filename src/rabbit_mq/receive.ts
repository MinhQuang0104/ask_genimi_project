import fs from "fs";
import path from "path";
import crypto from "crypto";
import * as rabbit from "rabbitmq-stream-js-client";
import Fuse from "fuse.js"; 
import logger from "../utils/logger";  

// ---------------------------
// 1. CONFIG PATHS
// ---------------------------
const ROOT_DIR = path.resolve(__dirname, "../../"); 
const STAGING_DIR = path.join(ROOT_DIR, "resource", "data_csv", "staging");
const CONFIG_DIR = path.join(__dirname, "..", "config");
const RABBIT_CONFIG_DIR = path.join(CONFIG_DIR, "rabbitmq_config");
const OFFSET_DIR = path.join(RABBIT_CONFIG_DIR, "offset");
const RECEIVED_DIR = path.join(RABBIT_CONFIG_DIR, "received_data");

// Tạo các thư mục cần thiết
const dirsToCreate = [OFFSET_DIR, RECEIVED_DIR, STAGING_DIR];
dirsToCreate.forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ---------------------------
// 2. CONFIG MAPPING (SOURCE -> TARGET MODEL)
// ---------------------------

// Danh sách chính xác tên các Model trong src/models (Target)
const TARGET_MODELS = [
    "AnhSanPham",
    "Kho1_ChiTietKiemKe",
    "Kho1_ChiTietPhieuNhap",
    "Kho1_ChiTietPhieuXuat",
    "Kho1_ChiTietTraHang",
    "Kho1_PhieuKiemKe",
    "Kho1_PhieuNhap",
    "Kho1_PhieuTraHang",
    "Kho1_PhieuXuat",
    "Kho1_TonKho",
    "Kho1_TonKhoChiTiet",
    "Kho1_VanDon",
    "KhoHang",
    "KhuyenMai",
    "LoaiHang",
    "NhaCungCap",
    "SanPham",
    "SanPham_KhuyenMai",
    "Thue",
    "ViTriKho",
    "Web1_ChiTietHoaDon",
    "Web1_DanhGia",
    "Web1_GioHang",
    "Web1_HoaDon",
    "Web1_SoDiaChi",
    "Web1_TaiKhoan",
    "Web1_ThanhToan"
];

// Map cứng các trường hợp tên khác nhau hoàn toàn (Dictionary Mapping)
const HARD_MAPPING: Record<string, string> = {
    // DB2 (Kho) -> DB3
    "MatHang": "SanPham",
    "PhieuNhap": "Kho1_PhieuNhap",
    "PhieuXuat": "Kho1_PhieuXuat",
    "TonKho": "Kho1_TonKho",
    "ChiTietNhapHang": "Kho1_ChiTietPhieuNhap",
    "ChiTietPhieuXuat": "Kho1_ChiTietPhieuXuat",
    // DB1 (Web) -> DB3
    "DanhMuc": "LoaiHang",
    "User": "Web1_TaiKhoan",
    "KhachHang": "Web1_TaiKhoan",
    "HoaDon": "Web1_HoaDon",
    "ChiTietHoaDon": "Web1_ChiTietHoaDon",
    "GioHang": "Web1_GioHang",
    "DanhGia": "Web1_DanhGia",
    "ThanhToan": "Web1_ThanhToan"
};

// Cấu hình Fuzzy Matching để tìm tên bảng đích dựa trên độ giống nhau của chuỗi ký tự
const fuseOptions = {
    includeScore: true,
    threshold: 0.4, // Độ chính xác (Càng nhỏ càng khắt khe)
};
const fuseModelMatcher = new Fuse(TARGET_MODELS, fuseOptions);

/**
 * Hàm xác định tên Model đích từ tên bảng nguồn
 */
function resolveTargetModel(sourceTableName: string): string {
    // 1. Chuẩn hóa tên nguồn (bỏ .csv nếu có)
    const cleanSource = sourceTableName.replace(/\.csv$/i, '').trim();

    // 2. Check Map cứng (Ưu tiên cao nhất)
    if (HARD_MAPPING[cleanSource]) {
        return HARD_MAPPING[cleanSource];
    }

    // 3. Check xem tên nguồn có trùng khớp 100% với model nào không
    if (TARGET_MODELS.includes(cleanSource)) {
        return cleanSource;
    }

    // 4. Dùng Fuzzy Matching để tìm tên Model giống nhất
    const searchResult = fuseModelMatcher.search(cleanSource);
    
    if (searchResult.length > 0) {
        const bestMatch = searchResult[0];
        // Nếu độ khớp tốt (score < 0.6)
        if (bestMatch.score && bestMatch.score < 0.6) {
             logger.info(`🔍 Mapping: '${cleanSource}' -> '${bestMatch.item}' (Score: ${bestMatch.score.toFixed(3)})`);
             return bestMatch.item;
        }
    }

    // 5. Fallback: Nếu không tìm thấy, trả về tên gốc (sẽ tạo ra file csv lạ, dễ debug)
    return cleanSource; 
}

// ---------------------------
// 3. HELPERS
// ---------------------------

function getOffsetAPI(rabbitInstance: any) {
  if (rabbitInstance.OffsetSpecification?.first) {
    return {
      first: rabbitInstance.OffsetSpecification.first,
      offset: rabbitInstance.OffsetSpecification.offset,
    };
  }
  if (rabbitInstance.Offset?.first) {
    return {
      first: rabbitInstance.Offset.first,
      offset: rabbitInstance.Offset.offset,
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
// 4. CORE LOGIC
// ---------------------------

let totalReceived = 0;
let totalProcessed = 0;

async function receiveStream(client: rabbit.Client, streamName: string) {
  const OffsetAPI = getOffsetAPI(rabbit);

  // Tạo stream
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
    } catch {}
  }
  const sessionSet = new Set<string>();

  logger.info(`🎧 Đang lắng nghe stream: ${streamName}`);

  await client.declareConsumer(
    { stream: streamName, offset: startOffset },
    (msg) => {
      try {
        const text = msg.content.toString();
        totalReceived++;
        
        // --- Deduplication ---
        const hash = getLineHash(text);
        if (sessionSet.has(hash) || seenHashes.has(hash)) {
          return; // Skip trùng
        }

        sessionSet.add(hash);
        seenHashes.add(hash);

        // Lưu Offset
        fs.writeFileSync(offsetFile, JSON.stringify({ offset: Number(msg.offset) }));

        // --- Parse & Route Data ---
        // Message Format: "TenBangGoc:Data1,Data2..."
        const firstColonIndex = text.indexOf(":");
        if (firstColonIndex === -1) return;

        const originalTableName = text.substring(0, firstColonIndex).trim();
        const rowData = text.substring(firstColonIndex + 1);
        
        // XÁC ĐỊNH TÊN FILE ĐÍCH (MODEL NAME)
        const targetModelName = resolveTargetModel(originalTableName);
        
        // Ghi xuống file CSV trong STAGING
        const targetFile = path.join(STAGING_DIR, `${targetModelName}.csv`);
        safeAppendFile(targetFile, rowData + "\n");

        // Lưu Hash (Checkpoint)
        fs.writeFileSync(hashFile, JSON.stringify([...seenHashes]));

        totalProcessed++;

      } catch (err: any) {
        logger.error(`Lỗi xử lý record: ${err.stack}`);
      }
    }
  );
}

// Stats Log
setInterval(() => {
  if (totalReceived > 0) {
      logger.info(`📊 [Integration] Received=${totalReceived} | Merged=${totalProcessed}`);
  }
}, 5000);

// ---------------------------
// 5. MAIN
// ---------------------------
async function main() {
  const client = await rabbit.connect({
    hostname: "localhost",
    port: 5552,
    username: "guest",
    password: "guest",
    vhost: "/"
  });

  const streams = [
    "data_source1_kho_stream",
    "data_source2_web_stream",
  ];

  await Promise.all(streams.map(s => receiveStream(client, s)));

  logger.info("🚀 Hệ thống Integration đang chạy. Nhấn Ctrl+C để dừng.");
}

main().catch((err) => {
  logger.error(`🔥 Fatal Error: ${err.stack}`);
  process.exit(1);
});