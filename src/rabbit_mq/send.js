const fs = require("fs");
const path = require("path");
const readline = require("readline");
const rabbit = require("rabbitmq-stream-js-client");
const logger = require("../logger"); 


const OFFSET_DIR = path.join(__dirname, '..', 'config','rabbitmq_config', "offset");

if (!fs.existsSync(OFFSET_DIR)) fs.mkdirSync(OFFSET_DIR);

async function sendDataSource(client, sourceName, sourcePath) {
  logger.info(`Bắt đầu gửi cho ${sourceName} → stream ${sourceName}_stream`);

  // Tạo stream riêng cho mỗi data source
  const streamName = `${sourceName}_stream`;
  await client.createStream({ stream: streamName, maxAge: "6h" });
  const publisher = await client.declarePublisher({ stream: streamName });

  // Đọc tất cả file .csv trong thư mục
  const files = fs.readdirSync(sourcePath).filter((f) => f.endsWith(".csv"));
  if (files.length === 0) {
    logger.warn(`Không có file CSV nào trong ${sourcePath}`);
    return;
  }

  // Gửi từng file
  for (const file of files) {
    const filePath = path.join(sourcePath, file);
    const offsetFile = path.join(OFFSET_DIR, `${streamName}_${file}_send.json`);

    let lastOffset = 0;
    if (fs.existsSync(offsetFile)) {
      try {
        lastOffset = JSON.parse(fs.readFileSync(offsetFile, "utf8")).offset || 0;
        logger.info(`Resume gửi ${file} từ dòng ${lastOffset + 1}`);

      } catch {
        logger.warn(`Offset file của ${file} bị lỗi, gửi lại từ đầu.`);
      }
    }

    const rl = readline.createInterface({
      input: fs.createReadStream(filePath),
      crlfDelay: Infinity,
    });

    let currentLine = 0;
    for await (const line of rl) {
      currentLine++;
      if (currentLine <= lastOffset || !line.trim()) continue;

      await publisher.send(Buffer.from(`${file}:${line}`)); // ghi rõ file để trace
      fs.writeFileSync(offsetFile, JSON.stringify({ offset: currentLine }));
      logger.info(`${sourceName}/${file}: dòng ${currentLine}`);

    }
  }


}
async function main() {
  const client = await rabbit.connect({
    hostname: "localhost",
    port: 5552,
    username: "guest",
    password: "guest",
  });
  const dataSources = [
    { name: "data_source1_kho", path: path.join(__dirname, '..', 'data_csv', "datasource1") },
    { name: "data_source2_web", path: path.join(__dirname, '..', 'data_csv', "datasource2") },
  ];
  for (const ds of dataSources) {
    await sendDataSource(client, ds.name, ds.path);
  }

  await client.close();
  console.log("\n Đã hoàn tất việc gửi dữ liệu cho tất cả data sources!");

}
main().catch((err) => {
  logger.error("Error khi gửi", err);
  process.exit(1);
});
