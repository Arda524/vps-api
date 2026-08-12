const app = require('./app');
const logger = require('./utils/logger');
const config = require('./config');

const server = app.listen(config.PORT, '0.0.0.0', () => {
  logger.info(`Server listening on port ${config.PORT}`);
});

const shutdown = (signal) => {
  logger.info(`Received ${signal}, shutting down`);
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
