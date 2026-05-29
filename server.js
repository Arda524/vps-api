require('dotenv').config();
const express = require('express');
const cors = require('cors');
const contaboRoutes = require('./routes/contabo');
const authMiddleware = require('./middleware/auth');

const app = express();

// CORS portfolio
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN,
  credentials: true
}));

app.use(express.json());

app.use('/api/contabo', authMiddleware, contaboRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'TikTok Downloader & Server API',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`📍 Server: /api/contabo/status (requires API key)`);
});
