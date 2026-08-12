const fs = require('fs');
const path = require('path');
const logger = require('./utils/logger');

const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = Number.parseInt(process.env.PORT, 10) || 3000;
const SERVER_API_KEY = process.env.SERVER_API_KEY;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ? process.env.ALLOWED_ORIGIN.trim() : '';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const PROJECTS_DIR = process.env.PROJECTS_DIR
  ? path.resolve(process.env.PROJECTS_DIR)
  : path.resolve('/var/www');
const UPLOADS_DIR = process.env.UPLOADS_DIR ? path.resolve(process.env.UPLOADS_DIR) : null;

function ensureDirectory(dir, name) {
  if (!dir) throw new Error(`${name} is required`);
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    throw new Error(`${name} does not exist or is not a directory: ${dir}`);
  }
  return dir;
}

function validateConfig() {
  if (!SERVER_API_KEY) {
    throw new Error('SERVER_API_KEY is required');
  }

  ensureDirectory(PROJECTS_DIR, 'PROJECTS_DIR');

  if (UPLOADS_DIR) {
    ensureDirectory(UPLOADS_DIR, 'UPLOADS_DIR');
  }

  return {
    NODE_ENV,
    PORT,
    SERVER_API_KEY,
    ALLOWED_ORIGIN,
    LOG_LEVEL,
    PROJECTS_DIR,
    UPLOADS_DIR,
  };
}

const config = validateConfig();
logger.info(`Config loaded: NODE_ENV=${config.NODE_ENV}, PORT=${config.PORT}, PROJECTS_DIR=${config.PROJECTS_DIR}`);

module.exports = config;
