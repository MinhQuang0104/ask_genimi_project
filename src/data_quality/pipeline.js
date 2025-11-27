const fs = require('fs');
const path = require('path');
const csv_parse = require('csv-parse');
const { stringify } = require('csv-stringify');
const stream = require("stream"); // dùng pipeline, transform,
const logger = require('../logger');
const { createTransformStream } = require('./transformStream');

async function main() {
    const stagingDirname = path.join(__dirname, '..', 'staging');
    const qualityDataDirname = path.join(__dirname, '..', 'data_csv', 'quality');

    // Aggregate totals across all files
    const aggregated = {
        filesProcessed: 0,
        totalProcessed: 0,
        totalPassed: 0,
        totalFailed: 0,
        totalSkipped: 0
    };

    return new Promise((resolve, reject) => {
        fs.readdir(stagingDirname, (err, files) => {
            if (err) {
                logger.error('Không thể đọc thư mục:', err);
                return reject(err);
            }

            const csvFiles = files.filter(file => file.endsWith('.csv'));
            if (csvFiles.length === 0) {
                logger.warn('Không tìm thấy file CSV nào trong staging');
                return resolve(aggregated);
            }

            let completedCount = 0;
            let hasError = false;

            // Process each file
            csvFiles.forEach(filename => {
                const tableName = filename.split('.')[0];
                logger.info(`Bắt đầu xử lý file: ${filename}`);

                const inputPath = path.join(stagingDirname, filename);
                const outputPath = path.join(qualityDataDirname, `${tableName}_passed.csv`);

                // Ensure output directory exists
                if (!fs.existsSync(qualityDataDirname)) {
                    fs.mkdirSync(qualityDataDirname, { recursive: true });
                }

                const streamReadFile = fs.createReadStream(inputPath, "utf8");
                const streamParseToObject = csv_parse.parse({
                    bom: true,
                    columns: header => header.map(h => h.replace(/^\uFEFF|^['"]|['"]$/g, '').trim()),
                    trim: true
                });
                const streamTransform = createTransformStream(tableName);
                const streamParseToCSV = stringify({ header: true });
                const streamWriteFile = fs.createWriteStream(outputPath, { flags: 'a' });

                stream.pipeline(
                    streamReadFile,
                    streamParseToObject,
                    streamTransform,
                    streamParseToCSV,
                    streamWriteFile,
                    (err) => {
                        if (err) {
                            logger.error(`Lỗi xử lý file ${filename}: ${err.stack}`);
                            hasError = true;
                        } else {
                            const stats = streamTransform.status || {
                                processed: 0,
                                passed: 0,
                                failed: 0,
                                skipped: 0
                            };

                            // Log per-file stats
                            logger.info(
                                `File ${filename} đã xử lý xong | ` +
                                `Tổng: ${stats.processed}, ` +
                                `Thành công: ${stats.passed}, ` +
                                `Thất bại: ${stats.failed}, ` +
                                `Bỏ qua: ${stats.skipped}, `
                            );

                            // Accumulate to aggregated totals
                            aggregated.filesProcessed++;
                            aggregated.totalProcessed += stats.processed;
                            aggregated.totalPassed += stats.passed;
                            aggregated.totalFailed += stats.failed;
                            aggregated.totalSkipped += stats.skipped;
                        }

                        // Check if all files have been processed
                        completedCount++;
                        if (completedCount === csvFiles.length) {
                            // Log final aggregated summary
                            logger.info('='.repeat(80));
                            logger.info('TỔNG KẾT QUÁ TRÌNH XỬ LÝ');
                            logger.info('='.repeat(80));
                            logger.info(`Tổng file xử lý: ${aggregated.filesProcessed}/${csvFiles.length}`);
                            logger.info(`Tổng bản ghi xử lý: ${aggregated.totalProcessed}`);
                            logger.info(`  - Thành công: ${aggregated.totalPassed}`);
                            logger.info(`  - Thất bại: ${aggregated.totalFailed}`);
                            logger.info(`  - Bỏ qua: ${aggregated.totalSkipped}`);
                            logger.info('='.repeat(80));

                            if (hasError) {
                                reject(new Error('Có lỗi xảy ra khi xử lý các file'));
                            } else {
                                resolve(aggregated);
                            }
                        }
                    }
                );
            });
        });
    });
}

main()
    .then((result) => {
        logger.info('✓ Kết thúc quá trình xử lý dữ liệu.');
        logger.info(`Kết quả: ${result.totalPassed}/${result.totalProcessed} bản ghi pass`);
        process.exit(0);
    })
    .catch((err) => {
        logger.error('✗ Lỗi trong quá trình xử lý dữ liệu:', err.stack);
        process.exit(1);
    });