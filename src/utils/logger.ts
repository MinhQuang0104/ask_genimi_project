import { createLogger, format, transports } from 'winston';
import path from 'path';

const { combine, timestamp, printf, colorize, errors } = format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
});

const LOG_DIR = path.join(__dirname, '..', 'logger', 'log');

const logger = createLogger({
  level: 'info',
  format: combine(
    colorize(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: path.join(LOG_DIR, 'app.log'), level: 'info' }),
    new transports.File({ filename: path.join(LOG_DIR, 'err.log'), level: 'error' }),
  ],
  exceptionHandlers: [
    new transports.File({ filename: path.join(LOG_DIR, 'exceptions.log') }),
  ],
  rejectionHandlers: [
    new transports.File({ filename: path.join(LOG_DIR, 'rejections.log') }),
  ],
});

export default logger;
