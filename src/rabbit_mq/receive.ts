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

const PHASES = [
    ["LoaiHang", "NhaCungCap", "KhoHang", "ViTriKho", "Thue", "KhuyenMai", "Web1_TaiKhoan", "Web1_SoDiaChi"],
    ["SanPham", "AnhSanPham", "SanPham_Thue", "SanPham_KhuyenMai"],
    ["Kho1_TonKho", "Kho1_PhieuNhap", "Kho1_ChiTietPhieuNhap", "Kho1_PhieuXuat", "Kho1_ChiTietPhieuXuat", "Kho1_VanDon", "Kho1_PhieuKiemKe", "Kho1_ChiTietKiemKe", "Kho1_PhieuTraHang", "Kho1_ChiTietTraHang"],
    ["Web1_HoaDon", "Web1_ChiTietHoaDon", "Web1_GioHang", "Web1_DanhGia", "Web1_ThanhToan", "Web1_LichSuDonHang"]
];

function getConfigKey(source: string, rawTable: string): string {
    const cleanTable = rawTable.replace(/\.csv$/i, '').trim();
    return `${source}_${cleanTable}`; 
}

function getRawNameForLog(rawTable: string): string {
    return rawTable.replace(/\.csv$/i, '').replace(/^SOURCE\d+_?/i, '').trim();
}

async function consumePhase(client: rabbit.Client, streams: string[], targetTables: string[]) {
    const promises = streams.map(streamName => {
        return new Promise<void>(async (resolve) => {
            const sourceName = streamName.includes("data_source1") ? "SOURCE1" : "SOURCE2";
            
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

                        if (targetTables.includes(targetModel)) {
                            if (config) {
                                const rows = parse(rowData, { relax_column_count: true, skip_empty_lines: true });
                                if (rows.length > 0) {
                                    let cols = rows[0]; 
                                    const oldId = cols[config.idIndex];

                                    let rawName = "";
                                    if (Array.isArray(config.nameIndex)) {
                                        rawName = config.nameIndex.map(idx => cols[idx]).filter(val => val).join(" - ");
                                    } else {
                                        rawName = cols[config.nameIndex];
                                    }

                                    const headerKeywords = ["Ma", "ID", "Code", "Stt", "Ten", "Name", "Source", "Nguon"];
                                    const isHeader = oldId && headerKeywords.some(k => oldId.toString().toLowerCase().startsWith(k.toLowerCase())) && isNaN(Number(oldId));

                                    if (isHeader) return; 

                                    if (oldId && rawName) {
                                        const rawTableNameClean = getRawNameForLog(rawTable);
                                        
                                        // [FIX] GỌI ĐÚNG 5 THAM SỐ
                                        const result = MergeService.processRecord(
                                            targetModel,        // 1
                                            sourceName,         // 2
                                            rawTableNameClean,  // 3 (Thêm mới)
                                            oldId,              // 4
                                            rawName             // 5
                                        );

                                        cols[config.idIndex] = result.newId; 
                                        if (!Array.isArray(config.nameIndex)) {
                                            cols[config.nameIndex] = result.newName;
                                        }

                                        if (config.foreignKeys) {
                                            for (const fk of config.foreignKeys) {
                                                const fkOldVal = cols[fk.colIndex];
                                                const fkNewVal = MergeService.translateForeignKey(fk.parentModel, sourceName, fkOldVal);
                                                cols[fk.colIndex] = fkNewVal;
                                            }
                                        }
                                        rowData = stringify([cols]).trim();
                                    }
                                }
                            }
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
}

async function main() {
    if (fs.existsSync(STAGING_DIR)) {
        fs.rmSync(STAGING_DIR, { recursive: true, force: true });
        fs.mkdirSync(STAGING_DIR, { recursive: true });
    }

    MergeService.clear();

    const client = await rabbit.connect({
        hostname: "localhost",
        port: 5552,
        username: "guest",
        password: "guest",
        vhost: "/"
    });

    const streamSource1 = ["data_source1_kho_stream"];
    const streamSource2 = ["data_source2_web_stream"];

    logger.info("🔥 BẮT ĐẦU QUÁ TRÌNH INTEGRATION VỚI MERGE SERVICE...");

    for (const phaseTables of PHASES) {
        logger.info(`\n=== ĐANG XỬ LÝ PHASE: [${phaseTables.join(", ")}] ===`);
        
        logger.info(`>> Đang nạp dữ liệu gốc từ SOURCE 1...`);
        await consumePhase(client, streamSource1, phaseTables);

        logger.info(`>> Đang nạp và gộp dữ liệu từ SOURCE 2...`);
        await consumePhase(client, streamSource2, phaseTables);
    }

    logger.info("📊 Đang tạo báo cáo gộp dữ liệu chi tiết (Detailed Merge Report)...");
    
    try {
        const reportPath = path.join(ROOT_DIR, "resource", "data_csv", "MERGE_REPORT_DETAILED.csv");
        
        if (MergeService.mergeLogs.length > 0) {
            const csvData = stringify(MergeService.mergeLogs, {
                header: true,
                columns: [
                    "TargetModel", 
                    "Match_Type", "Similarity_Score", 
                    "Unified_ID",
                    "Incoming_Source", "Incoming_RefTable", "Incoming_ID", "Incoming_Name", 
                    "Anchor_Source", "Anchor_RefTable", "Anchor_ID", "Anchor_Name"        
                ]
            });
            
            fs.writeFileSync(reportPath, csvData);
            logger.info(`✅ Đã xuất báo cáo chi tiết tại: ${reportPath}`);
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