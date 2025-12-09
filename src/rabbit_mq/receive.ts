import fs from "fs";
import path from "path";
import * as rabbit from "rabbitmq-stream-js-client";
import { DataIntegrator } from "../core/integration/DataIntegrator";
import logger from "../utils/logger";

const ROOT_DIR = path.resolve(__dirname, "../../");
const STAGING_DIR = path.join(ROOT_DIR, "resource", "data_csv", "staging");

// 1. ĐỊNH NGHĨA THỨ TỰ ƯU TIÊN (PRIORITY PHASES)
const PHASES = [
    // PHASE 1: MASTER DATA (Độc lập - Cần có trước để bảng con tham chiếu)
    ["LoaiHang", "NhaCungCap", "KhoHang", "Thue", "KhuyenMai", "Web1_TaiKhoan", "ViTriKho"],
    
    // PHASE 2: PRODUCT DATA (Phụ thuộc Phase 1)
    ["SanPham", "AnhSanPham", "Web1_SoDiaChi"],
    
    // PHASE 3: INVENTORY & STOCK (Phụ thuộc Product)
    ["Kho1_TonKho", "Kho1_TonKhoChiTiet", "Kho1_PhieuNhap", "Kho1_PhieuKiemKe"],
    
    // PHASE 4: TRANSACTION (Phụ thuộc tất cả)
    ["Web1_HoaDon", "Web1_GioHang", "Web1_DanhGia", "Web1_ChiTietHoaDon", "Kho1_PhieuXuat", "Kho1_VanDon"]
];

// Helper map tên bảng nguồn sang bảng đích (để filter)
// Bạn có thể dùng hàm resolveTargetModel cũ hoặc map cứng ở đây
function getTargetModelFromRawMsg(rawTableName: string): string {
    // Normalize raw table name: remove .csv suffix and SOURCE prefixes, lower-case for matching
    let name = rawTableName.replace(/\.csv$/i, '').replace(/^SOURCE\d+_?/i, '').trim();
    const n = name.toLowerCase();

    // Map known variations to canonical target models (must match names in PHASES and SchemaConfig)
    if (n.includes('mathang') || n.includes('sanpham') || n.includes('website_sanpham') || n.includes('anhsanpham') || n.includes('sanpham_thue')) return 'SanPham';
    if (n.includes('danhmuc') || n.includes('loaihang')) return 'LoaiHang';
    if (n.includes('nhacungcap') || n.includes('nhacungcap')) return 'NhaCungCap';
    if (n.includes('khohang') || n === 'kho' || n.includes('kho_')) return 'KhoHang';
    if (n.includes('vitri') || n.includes('vitrikho') || n.includes('vitrikho')) return 'ViTriKho';
    if (n.includes('thue')) return 'Thue';
    if (n.includes('khuyenmai') || n.includes('khuyen_mai')) return 'KhuyenMai';
    if (n.includes('taikhoan') || n.includes('tai_khoan') || n.includes('tk')) return 'Web1_TaiKhoan';
    if (n.includes('sodiachi') || n.includes('so_diachi') || n.includes('diachi')) return 'Web1_SoDiaChi';
    if (n.includes('anh')) return 'AnhSanPham';
    if (n.includes('tonkho') || n.includes('ton_kho')) return 'Kho1_TonKho';
    if (n.includes('chitiettonkho') || n.includes('tonkhochitiet') || n.includes('ton_kho_chitiet')) return 'Kho1_TonKhoChiTiet';
    if (n.includes('phieunhap') || n.includes('phieu_nhap')) return 'Kho1_PhieuNhap';
    if (n.includes('phieuxuat') || n.includes('phieu_xuat')) return 'Kho1_PhieuXuat';
    if (n.includes('phieukiemke') || n.includes('kiemke')) return 'Kho1_PhieuKiemKe';
    if (n.includes('hoadon') || n.includes('hoa_don')) return 'Web1_HoaDon';
    if (n.includes('chitiethoadon') || n.includes('chi_tiet_hoa_don')) return 'Web1_ChiTietHoaDon';
    if (n.includes('giohang') || n.includes('gio_hang')) return 'Web1_GioHang';
    if (n.includes('danhgia') || n.includes('danh_gia')) return 'Web1_DanhGia';

    // Default fallback: return normalized name but strip any leftover prefixes/suffixes
    return name;
}

async function consumePhase(client: rabbit.Client, streams: string[], targetTables: string[]) {
    logger.info(`\n🚀 BẮT ĐẦU PHASE: [${targetTables.join(", ")}]`);
    
    const promises = streams.map(streamName => {
        return new Promise<void>(async (resolve) => {
            const sourceName = streamName.includes("datasource1") ? "SOURCE1" : "SOURCE2";
            
            // Luôn đọc từ đầu stream (offset first) để quét lại dữ liệu cho Phase này
            // RabbitMQ Stream cho phép đọc lại bao nhiêu lần tùy thích
            let consumer: any;
            let idleTimer: NodeJS.Timeout;

            // Hàm kết thúc consumer khi không còn tin nhắn mới (Idle)
            const finish = async () => {
                clearTimeout(idleTimer);
                if (consumer) await consumer.close();
                resolve();
            };

            const resetIdleTimer = () => {
                if (idleTimer) clearTimeout(idleTimer);
                // Nếu 2 giây không có tin nhắn mới -> Coi như hết stream -> Next Phase
                idleTimer = setTimeout(finish, 2000); 
            };

            consumer = await client.declareConsumer(
                { stream: streamName, offset: rabbit.Offset.first() },
                async (msg) => {
                    resetIdleTimer(); // Có tin nhắn -> Reset timer
                    
                    try {
                        const text = msg.content.toString();
                        const firstColon = text.indexOf(":");
                        if (firstColon === -1) return;

                        const rawTable = text.substring(0, firstColon).trim();
                        const rowData = text.substring(firstColon + 1);

                        // 1. Xác định Model đích
                        // (Lưu ý: Bạn cần import hàm resolveTargetModel từ code cũ hoặc viết lại)
                        // Giả sử hàm resolveTargetModel đã có
                        const targetModel = getTargetModelFromRawMsg(rawTable); // Cần implement chuẩn

                        // 2. CHECK: Model này có thuộc Phase hiện tại không?
                        if (targetTables.includes(targetModel)) {
                            // Xử lý Gộp & Transform
                            await DataIntegrator.processRecord(sourceName, rawTable, targetModel, rowData);
                        } else {
                            // Bỏ qua (Sẽ được xử lý ở Phase khác)
                        }

                    } catch (e) {
                        logger.error(e);
                    }
                }
            );
            
            // Khởi động timer lần đầu
            resetIdleTimer();
        });
    });

    await Promise.all(promises);
    logger.info(`✅ HOÀN TẤT PHASE.`);
}

async function main() {
    // 0. Xóa sạch Staging cũ để tạo lại từ đầu
    if (fs.existsSync(STAGING_DIR)) {
        fs.rmSync(STAGING_DIR, { recursive: true, force: true });
        fs.mkdirSync(STAGING_DIR, { recursive: true });
    }

    const client = await rabbit.connect({
        hostname: "localhost",
        port: 5552,
        username: "guest",
        password: "guest",
        vhost: "/"
    });

    const streams = ["data_source1_kho_stream", "data_source2_web_stream"];

    // CHẠY TUẦN TỰ TỪNG PHASE
    for (const phaseTables of PHASES) {
        await consumePhase(client, streams, phaseTables);
    }

    logger.info("🎉 TOÀN BỘ QUÁ TRÌNH TÍCH HỢP HOÀN TẤT. Dữ liệu đã sẵn sàng ở folder Staging.");
    process.exit(0);
}

main().catch(console.error);