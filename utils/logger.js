const { createLogger, format, transports } = require('winston');

const isProd = process.env.NODE_ENV === 'production';

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: isProd
    ? format.combine(format.timestamp(), format.json())
    : format.combine(format.colorize(), format.timestamp(), format.simple()),
  transports: [new transports.Console()]
});

// morgan stream
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

module.exports = logger;
