require('dotenv').config();
const express = require('express');
const cors = require('cors');
const vpsRoutes = require('./routes');
const authMiddleware = require('./middleware/auth');

const app = express();

// CORS for portfolio
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN,
  credentials: true
}));

app.use(express.json());

// Routes (all require API key)
app.use('/api/vps', authMiddleware, vpsRoutes);

// Health check (public)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'VPS Server Management API',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 4004;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 VPS API running on port ${PORT}`);
  console.log(`📍 Status: /api/vps/status`);
  console.log(`📍 Processes: /api/vps/processes`);
  console.log(`📍 Storage: /api/vps/storage`);
  console.log(`📍 Deploy: /api/vps/deploy`);
  console.log(`📍 Uploads: /api/vps/uploads/list`);
  console.log(`📍 Logs: /api/vps/logs/pm2`);
});