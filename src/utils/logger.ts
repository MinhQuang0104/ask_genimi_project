import { createLogger, format, transports } from 'winston';
import path from 'path';

const { combine, timestamp, printf, colorize, errors, json, metadata } = format;

const LOG_DIR = path.join(__dirname, '..', 'logger', 'log');

// Format cho Console (Có màu, dễ đọc)
const consoleFormat = printf(({ level, message, timestamp, stack, metadata }) => {
  let metaStr = '';
  if (metadata && Object.keys(metadata).length > 0) {
      // In metadata (dữ liệu record, lỗi...) xuống dòng tiếp theo
      metaStr = '\n' + JSON.stringify(metadata, null, 2); 
  }
  return `${timestamp} [${level.toUpperCase()}]: ${stack || message} ${metaStr}`;
});

// Format cho File Debug (Pretty Print - Dễ đọc cho con người)
const fileReadableFormat = printf(({ level, message, timestamp, stack, metadata:object }) => {
    const logObj = {
        timestamp,
        level,
        message,
        stack,
        ...metadata // Bung toàn bộ dữ liệu ra
    };
    // Format JSON indent 2 spaces -> Dễ đọc như copy vào tool
    return JSON.stringify(logObj, null, 2) + '\n--------------------------------------------------'; 
});

const logger = createLogger({
  level: 'info',
  // Format chung mặc định (dùng cho app.log máy đọc)
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    metadata({ fillExcept: ['message', 'level', 'timestamp', 'stack'] })
  ),
  transports: [
    // 1. Console Log
    new transports.Console({
        format: combine(colorize(), consoleFormat)
    }),

    // 2. File log chuẩn (Dạng JSON 1 dòng - Dùng để lưu trữ gọn nhẹ hoặc đẩy vào ELK)
    new transports.File({ 
        filename: path.join(LOG_DIR, 'app.log'), 
        level: 'info',
        format: json() 
    }),

    // 3. File log lỗi riêng
    new transports.File({ 
        filename: path.join(LOG_DIR, 'err.log'), 
        level: 'error',
        format: json()
    }),

    // 4. [MỚI] File log DỄ ĐỌC cho Developer (Pretty Print)
    // File này sẽ tốn dung lượng hơn nhưng cực kỳ dễ debug
    new transports.File({ 
        filename: path.join(LOG_DIR, 'debug-readable.log'), 
        level: 'info', 
        format: fileReadableFormat 
    }),
  ],
});

export default logger;