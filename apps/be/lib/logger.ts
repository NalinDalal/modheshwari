import winston from 'winston';

const { combine, timestamp, printf, errors } = winston.format;

const myFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level}: ${stack || message}`;
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp(),
    errors({ stack: true }),
    myFormat
  ),
  transports: [
    new winston.transports.Console(),
  ],
});

export default logger;
