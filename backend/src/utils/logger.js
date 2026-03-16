/**
 * Winston Logger Utility
 *
 * Structured JSON logging with daily file rotation.
 * Logs to both console (for docker logs) and rotating files (for persistence).
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

const LOG_DIR = process.env.LOG_FILE_PATH
  ? path.dirname(process.env.LOG_FILE_PATH)
  : './logs';

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

/**
 * Custom format that produces structured JSON with consistent fields.
 */
const structuredFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Console format for local development — human-readable.
 */
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, event, ...meta }) => {
    const eventTag = event ? ` [${event}]` : '';
    const metaStr = Object.keys(meta).length > 0
      ? ` ${JSON.stringify(meta)}`
      : '';
    return `${timestamp} ${level.toUpperCase()}${eventTag} ${message}${metaStr}`;
  })
);

/**
 * Daily rotating file transport for all logs.
 */
const fileTransport = new DailyRotateFile({
  dirname: LOG_DIR,
  filename: 'app-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: process.env.LOG_MAX_SIZE || '10m',
  maxFiles: process.env.LOG_MAX_FILES || '30d',
  format: structuredFormat,
});

/**
 * Separate rotating file for audit events only (auth, invitations, admin actions).
 */
const auditTransport = new DailyRotateFile({
  dirname: LOG_DIR,
  filename: 'audit-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: process.env.LOG_MAX_SIZE || '10m',
  maxFiles: process.env.LOG_MAX_FILES || '90d',
  level: 'info',
  format: structuredFormat,
});

// Reason: Only write to audit log when the 'audit' metadata flag is set
auditTransport.log = ((originalLog) => {
  return function (info, callback) {
    if (info.audit) {
      return originalLog.call(this, info, callback);
    }
    if (callback) callback();
  };
})(auditTransport.log.bind(auditTransport));

/**
 * Console transport — always active so `docker logs` works.
 */
const consoleTransport = new winston.transports.Console({
  format: process.env.NODE_ENV === 'production' ? structuredFormat : consoleFormat,
});

const logger = winston.createLogger({
  level: LOG_LEVEL,
  defaultMeta: { service: 'streaming-tracker' },
  transports: [
    consoleTransport,
    fileTransport,
    auditTransport,
  ],
});

/**
 * Log an audit event (auth, invitation, admin action).
 * These go to both the main log and the dedicated audit log.
 *
 * @param {string} event - Event name (e.g., 'LOGIN_SUCCESS', 'INVITATION_SENT')
 * @param {Object} data - Event-specific data
 */
export function audit(event, data = {}) {
  logger.info(data.message || event, { event, audit: true, ...data });
}

export default logger;
