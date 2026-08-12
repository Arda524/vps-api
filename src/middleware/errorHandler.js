const logger = require('../utils/logger');

module.exports = (err, req, res, next) => {
  logger.error(err.stack || err.message || err);

  const isProd = process.env.NODE_ENV === 'production';
  const message = isProd ? 'Internal server error' : err.message || err;

  res.status(err.status || 500).json({ success: false, error: message });
};
