const crypto = require('crypto');
const logger = require('../utils/logger');

const API_KEY = process.env.SERVER_API_KEY;

module.exports = (req, res, next) => {
  const key = req.headers['x-api-key'];

  if (!API_KEY) {
    logger.warn('No SERVER_API_KEY configured');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  if (!key) return res.status(401).json({ error: 'Unauthorized. API key required.' });

  try {
    const a = Buffer.from(key);
    const b = Buffer.from(API_KEY);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return res.status(401).json({ error: 'Unauthorized. Invalid API key.' });
    }
  } catch (e) {
    return res.status(401).json({ error: 'Unauthorized. Invalid API key.' });
  }

  next();
};