// logger.js
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize, errors } = format;
const path = require('path');
// Custom format: ưu tiên stack nếu có
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
});

const LOG_DIR = path.join(__dirname, '..', 'logger', 'log')

const logger = createLogger({
  level: 'info',
  format: combine(
    colorize(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),   // 👈 BẮT STACK TRACE (file + dòng)
    logFormat
  ),
  
  transports: [
    new transports.Console(),
    new transports.File({ filename: path.join(LOG_DIR, 'app.log') , level: 'info' }),
    new transports.File({ filename: path.join(LOG_DIR, 'err.log'), level: 'error' }),
  ],

  // bắt lỗi chưa try-catch
  exceptionHandlers: [
    new transports.File({ filename: path.join(LOG_DIR, 'exceptions.log')})
  ],

  // bắt Promise.reject không catch
  rejectionHandlers: [
    new transports.File({ filename: path.join(LOG_DIR, 'rejections.log')})
  ]
});
module.exports = logger;