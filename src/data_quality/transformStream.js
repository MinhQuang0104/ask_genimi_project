const path = require('path');
const crypto = require('crypto');
const rulesConfig = require(path.join(__dirname, '..', 'config', 'data_quality_config', 'rule_deatail_config', "index.js"));
const logger = require('../logger');
const stream = require("stream"); // dùng pipeline, transform,
const { processRecord } = require('./processRecord');
// sửa import để dùng checkpointStore trong cùng thư mục
const { getMap, mark, flushAsync } = require('./checkpointStore');

// STREAM xử lý dữ liệu,  
function createTransformStream(tableName) {
    const trasformStream = new stream.Transform({
        objectMode: true,
        transform(record, encoding, callback) {
            try {
                this.status.processed++;
                const trackingProcess = getMap(tableName);
                const result = processRecord(tableName, record);
                // console.log('Result.output:', result.output);
                // console.log('Value for MaTK:', result.output['MaTK']);
                if (!result) {
                    logger.error(`processRecord trả về undefined cho bảng ${tableName}`);
                    this.status.failed++;
                    return callback();
                }
                if (result.isValid) {
                    const pk = rulesConfig[tableName]?.primaryKey;
                    console.log('Primary Key=', pk);
                    // tính id_record từ primaryKey sau khi headers đã được sanitize
                    const id_record = Array.isArray(pk)
                        ? pk.map(k => String(result.output[k] ?? '').trim()).join('_')
                        : '';
                    // debug keys/values (tùy bật khi cần)
                    console.log('PK keys =', pk, 'PK values =', pk.map(k => result.output[k]));
                    if (!Array.isArray(pk) || pk.length === 0) {
                        logger.error(`primaryKey không cấu hình cho bảng ${tableName}`);
                        this.status.failed++;
                        return callback(); // skip
                    }

                    if (!id_record) {
                        logger.error(`Không tạo được id_record cho bảng ${tableName}`);
                        console.error('IDRECORD=', id_record);
                        this.status.failed++;
                        return callback();
                    }

                    if (!trackingProcess.has(id_record)) {
                        const hash = crypto.createHash('md5').update(JSON.stringify(record)).digest('hex');
                        // chỉ mark vào in-memory; checkpointStore sẽ schedule ghi (debounce/atomic)
                        mark(tableName, id_record, hash)
                            .catch(err => {
                                logger.error(`Lỗi mark checkpoint: ${err.message}`);
                            });
                        this.status.passed++;

                        return callback(null, result.output);
                    } else {
                        this.status.skipped++;
                        logger.info(`Bỏ qua bản ghi trùng lặp ID=${id_record}`);
                        return callback();
                    }
                } else {
                    logger.info(`Bản ghi không hợp lệ (bảng ${tableName}): ${JSON.stringify(result.errors)}`);
                    this.status.failed++;
                    return callback();
                }
            } catch (err) {
                logger.error(`Lỗi tạo transformStream cho bảng ${tableName}: ${err.stack}`);
                this.status.failed++;
                return callback(err);
            }
        },
        // khi stream này kết thúc, đảm bảo flush checkpoint ra file
        final(callback) {
            flushAsync()
                .then(() => callback())
                .catch(err => {
                    logger.error(`flushAsync thất bại: ${err.stack}`);
                    callback(err);
                });
        }
    })
    trasformStream.status = {
        processed: 0, // tổng số bản ghi đã xử lý
        passed: 0, // số bản ghi đã pass
        failed: 0, // số bản ghi fail
        skipped: 0, // số bản ghi đã bỏ qua (vì đã được xử lý trước đos)
    }
    return trasformStream;
}

module.exports = { createTransformStream };