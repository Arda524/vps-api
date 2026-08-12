require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const logger = require('./utils/logger');
const config = require('./config');
const serverRoutes = require('./routes/server');
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.set('trust proxy', true);
app.use(helmet());
app.use(compression());
app.use(cors({ origin: config.ALLOWED_ORIGIN || true, credentials: true }));
app.use(express.json({ limit: '50kb' }));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
app.use(limiter);

// Access logs
app.use(morgan('combined', { stream: logger.stream }));

// API routes
app.use('/api/server', authMiddleware, serverRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'VPS API', timestamp: new Date().toISOString() });
});

// 404 catcher for unknown routes
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not Found' });
});

// Error handler (should be last middleware)
app.use(errorHandler);

module.exports = app;
