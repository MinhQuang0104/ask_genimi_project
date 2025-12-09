import fs from "fs";
import path from "path";
import * as rabbit from "rabbitmq-stream-js-client";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

import { DataIntegrator } from "../core/integration/DataIntegrator";
import { MergeService } from "../services/MergeService"; 
import { CSV_CONFIG } from "../config/CsvMappingConfig";
import logger from "../utils/logger";

const ROOT_DIR = path.resolve(__dirname, "../../");
const STAGING_DIR = path.join(ROOT_DIR, "resource", "data_csv", "staging");

// 1. ĐỊNH NGHĨA THỨ TỰ ƯU TIÊN (PHASES)
const PHASES = [
    // PHASE 1: MASTER DATA
    [
        "LoaiHang", "NhaCungCap", "KhoHang", "ViTriKho", 
        "Thue", "KhuyenMai", "Web1_TaiKhoan", "Web1_SoDiaChi"
    ],
    // PHASE 2: PRODUCT DATA
    [
        "SanPham", "AnhSanPham", "SanPham_Thue", "SanPham_KhuyenMai"
    ],
    // PHASE 3: INVENTORY & OPS
    [
        "Kho1_TonKho", "Kho1_PhieuNhap", "Kho1_ChiTietPhieuNhap",
        "Kho1_PhieuXuat", "Kho1_ChiTietPhieuXuat", "Kho1_VanDon",
        "Kho1_PhieuKiemKe", "Kho1_ChiTietKiemKe", "Kho1_PhieuTraHang", "Kho1_ChiTietTraHang"
    ],
    // PHASE 4: TRANSACTION
    [
        "Web1_HoaDon", "Web1_ChiTietHoaDon", "Web1_GioHang", 
        "Web1_DanhGia", "Web1_ThanhToan", "Web1_LichSuDonHang"
    ]
];

function getConfigKey(source: string, rawTable: string): string {
    const cleanTable = rawTable.replace(/\.csv$/i, '').trim();
    return `${source}_${cleanTable}`; 
}

function getRawNameForLog(rawTable: string): string {
    return rawTable.replace(/\.csv$/i, '').replace(/^SOURCE\d+_?/i, '').trim();
}

async function consumePhase(client: rabbit.Client, streams: string[], targetTables: string[]) {
    logger.info(`\n🚀 BẮT ĐẦU PHASE: [${targetTables.join(", ")}]`);
    
    const promises = streams.map(streamName => {
        return new Promise<void>(async (resolve) => {
            const sourceName = streamName.includes("datasource1") ? "SOURCE1" : "SOURCE2";
            let consumer: any;
            let idleTimer: NodeJS.Timeout;

            const finish = async () => {
                clearTimeout(idleTimer);
                if (consumer) await consumer.close();
                resolve();
            };

            const resetIdleTimer = () => {
                if (idleTimer) clearTimeout(idleTimer);
                idleTimer = setTimeout(finish, 2000); 
            };

            consumer = await client.declareConsumer(
                { stream: streamName, offset: rabbit.Offset.first() },
                async (msg) => {
                    resetIdleTimer();
                    try {
                        const text = msg.content.toString();
                        const firstColon = text.indexOf(":");
                        if (firstColon === -1) return;

                        const rawTable = text.substring(0, firstColon).trim();
                        let rowData = text.substring(firstColon + 1);

                        const configKey = getConfigKey(sourceName, rawTable);
                        const config = CSV_CONFIG[configKey];

                        let targetModel = "";
                        if (config && config.targetModel) {
                            targetModel = config.targetModel;
                        } else {
                            targetModel = getRawNameForLog(rawTable);
                        }

                        // 3. Kiểm tra: Model này có thuộc Phase đang chạy không?
                        if (targetTables.includes(targetModel)) {
                            
                            // === LOGIC GỘP DỮ LIỆU & ÁNH XẠ ID ===
                            if (config) {
                                const rows = parse(rowData, { relax_column_count: true, skip_empty_lines: true });
                                if (rows.length > 0) {
                                    let cols = rows[0]; 
                                    
                                    const oldId = cols[config.idIndex];

                                    // ===================================
                                    // [CODE MỚI] XỬ LÝ NHIỀU CỘT TÊN
                                    // ===================================
                                    let rawName = "";

                                    if (Array.isArray(config.nameIndex)) {
                                        // Trường hợp nhiều cột: Nối lại bằng dấu gạch ngang
                                        // Ví dụ: "iPhone 15" + "Titan" -> "iPhone 15 - Titan"
                                        rawName = config.nameIndex
                                            .map(idx => cols[idx]) // Lấy giá trị từng cột
                                            .filter(val => val)    // Bỏ giá trị rỗng (null/undefined)
                                            .join(" - ");          // Nối lại
                                    } else {
                                        // Trường hợp 1 cột (Cũ)
                                        rawName = cols[config.nameIndex];
                                    }
                                    // ===================================

                                    // =======================================================================
                                    // [CODE CŨ] BỘ LỌC HEADER (HEADER FILTER)
                                    // =======================================================================
                                    const headerKeywords = [
                                        "Ma", "ID", "Code", "Stt", 
                                        "Ten", "Name",             
                                        "Source", "Nguon"
                                    ];

                                    const isHeader = oldId && 
                                                     headerKeywords.some(k => oldId.toString().toLowerCase().startsWith(k.toLowerCase())) && 
                                                     isNaN(Number(oldId));

                                    if (isHeader) {
                                        return; // Dừng xử lý dòng này ngay lập tức
                                    }
                                    // =======================================================================

                                    if (oldId && rawName) {
                                        // A. Gọi Service để Chuẩn hóa Tên & Lấy ID thống nhất
                                        const result = MergeService.processRecord(targetModel, sourceName, oldId, rawName);

                                        // B. Cập nhật lại CSV (ID mới + Tên chuẩn)
                                        cols[config.idIndex] = result.newId; 
                                        
                                        // Nếu nameIndex là 1 cột đơn thì update lại cột đó
                                        // (Nếu là mảng nhiều cột thì ta không ghi đè lại CSV gốc để giữ nguyên dữ liệu tách biệt, 
                                        //  chỉ dùng rawName đã gộp để mapping ID thôi)
                                        if (!Array.isArray(config.nameIndex)) {
                                            cols[config.nameIndex] = result.newName;
                                        }

                                        // C. Xử lý Khóa Ngoại (Foreign Keys)
                                        if (config.foreignKeys) {
                                            for (const fk of config.foreignKeys) {
                                                const fkOldVal = cols[fk.colIndex];
                                                const fkNewVal = MergeService.translateForeignKey(fk.parentModel, sourceName, fkOldVal);
                                                cols[fk.colIndex] = fkNewVal;
                                            }
                                        }

                                        // Đóng gói lại thành chuỗi CSV
                                        rowData = stringify([cols]).trim();
                                    }
                                }
                            }
                            // === KẾT THÚC LOGIC GỘP ===

                            // Đẩy vào Pipeline xử lý tiếp
                            await DataIntegrator.processRecord(sourceName, rawTable, targetModel, rowData);
                        }

                    } catch (e) {
                        logger.error(`Error processing msg: ${e}`);
                    }
                }
            );
            
            resetIdleTimer();
        });
    });

    await Promise.all(promises);
    logger.info(`✅ HOÀN TẤT PHASE.`);
}

async function main() {
    // 0. Dọn dẹp Staging cũ
    if (fs.existsSync(STAGING_DIR)) {
        fs.rmSync(STAGING_DIR, { recursive: true, force: true });
        fs.mkdirSync(STAGING_DIR, { recursive: true });
    }

    // 1. Reset bộ nhớ đệm
    MergeService.clear();

    // 2. Kết nối RabbitMQ Stream
    const client = await rabbit.connect({
        hostname: "localhost",
        port: 5552,
        username: "guest",
        password: "guest",
        vhost: "/"
    });

    const streams = ["data_source1_kho_stream", "data_source2_web_stream"];

    logger.info("🔥 BẮT ĐẦU QUÁ TRÌNH INTEGRATION VỚI MERGE SERVICE...");

    // 3. CHẠY TUẦN TỰ TỪNG PHASE
    for (const phaseTables of PHASES) {
        await consumePhase(client, streams, phaseTables);
    }

    // 4. XUẤT BÁO CÁO MERGE
    logger.info("📊 Đang tạo báo cáo gộp dữ liệu (Merge Report)...");
    try {
        const reportPath = path.join(ROOT_DIR, "resource", "data_csv", "MERGE_REPORT.csv");
        
        if (MergeService.mergeLogs.length > 0) {
            const csvData = stringify(MergeService.mergeLogs, {
                header: true,
                columns: ["TableName", "Source", "OriginalID", "OriginalName", "FinalName", "FinalID", "Status", "Score"]
            });
            
            fs.writeFileSync(reportPath, csvData);
            logger.info(`✅ Đã xuất báo cáo tại: ${reportPath}`);
        } else {
            logger.warn("⚠️ Không có dữ liệu nào được xử lý để báo cáo.");
        }
    } catch (err) {
        logger.error("❌ Lỗi khi ghi báo cáo:", err);
    }

    logger.info("🎉 TOÀN BỘ QUÁ TRÌNH TÍCH HỢP HOÀN TẤT.");
    process.exit(0);
}

main().catch(console.error);