import fs from 'fs';
import path from 'path';
import { faker } from '@faker-js/faker/locale/vi'; // Dùng locale tiếng Việt
import { stringify } from 'csv-stringify/sync';

// Cấu hình thư mục output
const DATA_DIR_1 = path.join(__dirname, '../../resource/data_csv/staging'); // Web1

// Đảm bảo thư mục tồn tại
[DATA_DIR_1, DATA_DIR_1].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Helper ghi CSV
function writeCsv(dir: string, fileName: string, data: any[]) {
    const filePath = path.join(dir, fileName);
    const output = stringify(data, { header: true });
    fs.writeFileSync(filePath, output);
    console.log(`✅ Đã tạo: ${fileName} (${data.length} dòng)`);
}

// =========================================================
// PHẦN 1: DATASOURCE 1 - WEB BÁN HÀNG (WEB1)
// =========================================================

function generateWeb1_DanhMuc(count: number) {
    const data = [];
    for (let i = 1; i <= count; i++) {
        data.push({
            MaDM: i,
            TenDM: faker.commerce.department(),
            MoTa: faker.lorem.sentence()
        });
    }
    writeCsv(DATA_DIR_1, 'DanhMuc.csv', data);
    return count; // Trả về số lượng để bảng khác tham chiếu
}

function generateWeb1_TaiKhoan(count: number) {
    const data = [];
    for (let i = 1; i <= count; i++) {
        data.push({
            MaTK: i,
            TenDangNhap: faker.internet.username() + i, // Đảm bảo unique
            MatKhau: faker.internet.password(),
            HoTen: faker.person.fullName(),
            Email: faker.internet.email(),
            SoDienThoai: faker.phone.number().replace(/\D/g, ''),
            LoaiTaiKhoan: faker.helpers.arrayElement([0, 1]), // 0: User, 1: Admin
            NgayTao: faker.date.past().toISOString().split('T')[0]
        });
    }
    writeCsv(DATA_DIR_1, 'TaiKhoan.csv', data);
    return count;
}

function generateWeb1_SanPham(count: number, numDanhMuc: number) {
    const data = [];
    for (let i = 1; i <= count; i++) {
        data.push({
            MaSP: i,
            TenSP: faker.commerce.productName(),
            MaDM: faker.number.int({ min: 1, max: numDanhMuc }),
            GiaBan: faker.commerce.price({ min: 100000, max: 20000000, dec: 0 }),
            SoLuongTon: faker.number.int({ min: 0, max: 100 }),
            NhaSanXuat: faker.company.name()
        });
    }
    writeCsv(DATA_DIR_1, 'SanPham.csv', data);
    return count;
}

function generateWeb1_HoaDon(count: number, numTaiKhoan: number) {
    const data = [];
    for (let i = 1; i <= count; i++) {
        data.push({
            MaHD: i,
            MaTK: faker.number.int({ min: 1, max: numTaiKhoan }),
            NgayDat: faker.date.recent({ days: 60 }).toISOString().split('T')[0],
            TongTien: 0, // Sẽ tính sau hoặc để random
            TrangThaiDonHang: faker.helpers.arrayElement([1, 2, 3, 4]),
            DiaChiGiaoHang: faker.location.streetAddress({ useFullAddress: true }),
            SoDienThoaiNguoiNhan: faker.phone.number().replace(/\D/g, ''),
            TenNguoiNhan: faker.person.fullName()
        });
    }
    writeCsv(DATA_DIR_1, 'HoaDon.csv', data);
    return count;
}

function generateWeb1_ChiTietHoaDon(numHoaDon: number, numSanPham: number) {
    const data = [];
    // Mỗi hóa đơn mua ngẫu nhiên 1-3 sản phẩm
    for (let hd = 1; hd <= numHoaDon; hd++) {
        const numItems = faker.number.int({ min: 1, max: 3 });
        for (let k = 0; k < numItems; k++) {
            const qty = faker.number.int({ min: 1, max: 5 });
            const price = Number(faker.commerce.price({ min: 100000, max: 5000000, dec: 0 }));
            data.push({
                MaHD: hd,
                MaSP: faker.number.int({ min: 1, max: numSanPham }),
                SoLuong: qty,
                GiaBanLucDat: price,
                ThanhTien: qty * price
            });
        }
    }
    writeCsv(DATA_DIR_1, 'ChiTietHoaDon.csv', data);
}

// =========================================================
// PHẦN 2: DATASOURCE 2 - KHO HÀNG (KHO1)
// =========================================================

function generateKho1_LoaiHang(count: number) {
    const data = [];
    for (let i = 1; i <= count; i++) {
        data.push({
            MaLoaiHang: i,
            TenLoaiHang: faker.commerce.department()
        });
    }
    writeCsv(DATA_DIR_1, 'LoaiHang.csv', data);
    return count;
}

function generateKho1_KhoHang(count: number) {
    const data = [];
    for (let i = 1; i <= count; i++) {
        data.push({
            MaKho: i,
            TenKho: `Kho ${faker.location.city()}`,
            DiaChiKho: faker.location.streetAddress({ useFullAddress: true })
        });
    }
    writeCsv(DATA_DIR_1, 'KhoHang.csv', data);
    return count;
}

function generateKho1_NhaCungCap(count: number) {
    const data = [];
    for (let i = 1; i <= count; i++) {
        data.push({
            MaNCC: i,
            TenNCC: faker.company.name(),
            DiaChiNCC: faker.location.streetAddress({ useFullAddress: true })
        });
    }
    writeCsv(DATA_DIR_1, 'NhaCungCap.csv', data);
    return count;
}

function generateKho1_MatHang(count: number, numLoaiHang: number) {
    const data = [];
    for (let i = 1; i <= count; i++) {
        const giaNhap = Number(faker.commerce.price({ min: 50000, max: 10000000, dec: 0 }));
        data.push({
            MaSP: i,
            TenSP: faker.commerce.productName(),
            MaLoaiHang: faker.number.int({ min: 1, max: numLoaiHang }),
            SoLuong: faker.number.int({ min: 0, max: 500 }),
            GiaNhap: giaNhap,
            GiaBan: Math.floor(giaNhap * 1.2), // Lãi 20%
            TrangThai: 1
        });
    }
    writeCsv(DATA_DIR_1, 'MatHang.csv', data);
    return count;
}

function generateKho1_PhieuNhap(count: number, numNCC: number, numKho: number) {
    const data = [];
    for (let i = 1; i <= count; i++) {
        data.push({
            MaPN: i,
            MaNCC: faker.number.int({ min: 1, max: numNCC }),
            MaKho: faker.number.int({ min: 1, max: numKho }),
            NgayNhap: faker.date.recent({ days: 30 }).toISOString().split('T')[0],
            TongTienNhap: faker.commerce.price({ min: 1000000, max: 50000000, dec: 0 }),
            TrangThaiPN: 1
        });
    }
    writeCsv(DATA_DIR_1, 'PhieuNhap.csv', data);
    return count;
}

function generateKho1_TonKho(numMatHang: number) {
    const data = [];
    // Giả sử chỉ có 1 kho chính để đơn giản hóa logic fake
    // Hoặc random mỗi mặt hàng tồn ở 1 kho
    for (let i = 1; i <= numMatHang; i++) {
        const slTon = faker.number.int({ min: 10, max: 200 });
        const slTamGiu = faker.number.int({ min: 0, max: 5 });
        data.push({
            MaSP: i,
            SoLuongTon: slTon,
            SoLuongTamGiu: slTamGiu,
            SoLuongKhaDung: slTon - slTamGiu // Computed
        });
    }
    writeCsv(DATA_DIR_1, 'TonKho.csv', data);
}

// =========================================================
// MAIN EXECUTION
// =========================================================

function main() {
    console.log("🚀 Bắt đầu sinh dữ liệu giả...");

    // --- Web1 Generation ---
    const numWebDM = generateWeb1_DanhMuc(10);
    const numWebTK = generateWeb1_TaiKhoan(50);
    const numWebSP = generateWeb1_SanPham(100, numWebDM);
    const numWebHD = generateWeb1_HoaDon(50, numWebTK);
    generateWeb1_ChiTietHoaDon(numWebHD, numWebSP);

    // --- Kho1 Generation ---
    const numKhoLH = generateKho1_LoaiHang(8);
    const numKho = generateKho1_KhoHang(5);
    const numNCC = generateKho1_NhaCungCap(10);
    const numKhoMH = generateKho1_MatHang(200, numKhoLH);
    generateKho1_PhieuNhap(20, numNCC, numKho);
    generateKho1_TonKho(numKhoMH);

    console.log("\n🎉 HOÀN TẤT! Dữ liệu đã được tạo trong thư mục data_csv.");
}

main();