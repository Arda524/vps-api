const express = require('express');
const { exec } = require('child_process');
const router = express.Router();

// Get PM2 processes status
router.get('/', (req, res) => {
  exec('pm2 jlist', (err, stdout) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    try {
      const processes = JSON.parse(stdout);
      res.json({
        success: true,
        processes: processes.map(p => ({
          name: p.name,
          id: p.pm_id,
          status: p.pm2_env?.status || 'unknown',
          cpu: p.monit?.cpu || 0,
          memory: p.monit?.memory || 0,
          uptime: p.pm2_env?.pm_uptime || 0,
          restarts: p.pm2_env?.restart_time || 0
        }))
      });
    } catch (e) {
      res.status(500).json({ error: 'Failed to parse PM2 output' });
    }
  });
});

// Restart specific PM2 process
router.post('/restart', (req, res) => {
  const { processName } = req.body;
  
  if (!processName) {
    return res.status(400).json({ error: 'Process name required' });
  }
  
  exec(`pm2 restart ${processName}`, (err, stdout) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({
      success: true,
      message: `Process ${processName} restarted`,
      output: stdout
    });
  });
});

module.exports = router;