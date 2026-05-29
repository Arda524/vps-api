const express = require('express');
const { exec } = require('child_process');
const router = express.Router();

// Get ALL logs
router.get('/all', (req, res) => {
  const { lines = 100 } = req.query;
  
  const logs = { pm2: {}, nginx: {}, system: {}, auth: {}, mongodb: {} };
  let completed = 0;
  const total = 6;
  
  const checkComplete = () => {
    completed++;
    if (completed === total) {
      res.json({ success: true, timestamp: new Date().toISOString(), logs });
    }
  };
  
  exec(`pm2 logs rashmaliarefan --lines ${lines} --nostream 2>&1`, (err, stdout) => {
    logs.pm2.rashmaliarefan = err ? `Error: ${err.message}` : (stdout || 'No logs');
    checkComplete();
  });
  
  exec(`pm2 logs portfolio-downloader --lines ${lines} --nostream 2>&1`, (err, stdout) => {
    logs.pm2['portfolio-downloader'] = err ? `Error: ${err.message}` : (stdout || 'No logs');
    checkComplete();
  });
  
  exec(`tail -n ${lines} /var/log/nginx/access.log 2>&1`, (err, stdout) => {
    logs.nginx = logs.nginx || {};
    logs.nginx.access = err ? `Error: ${err.message}` : (stdout || 'No logs');
    checkComplete();
  });
  
  exec(`tail -n ${lines} /var/log/nginx/error.log 2>&1`, (err, stdout) => {
    logs.nginx.error = err ? `Error: ${err.message}` : (stdout || 'No logs');
    checkComplete();
  });
  
  exec(`journalctl --since "1 hour ago" --no-pager -n ${lines} 2>&1`, (err, stdout) => {
    logs.system = err ? `Error: ${err.message}` : (stdout || 'No logs');
    checkComplete();
  });
  
  exec(`tail -n ${lines} /var/log/auth.log 2>&1`, (err, stdout) => {
    logs.auth = err ? `Error: ${err.message}` : (stdout || 'No logs');
    checkComplete();
  });
});

// PM2 logs
router.get('/pm2', (req, res) => {
  const { processName = 'rashmaliarefan', lines = 50 } = req.query;
  const allowed = ['rashmaliarefan', 'portfolio-downloader'];
  if (!allowed.includes(processName)) {
    return res.status(400).json({ error: 'Invalid process name' });
  }
  
  exec(`pm2 logs ${processName} --lines ${lines} --nostream 2>&1`, (err, stdout) => {
    if (err) return res.status(500).json({ error: err.message });
    const logLines = stdout.split('\n').filter(l => l.trim());
    res.json({ success: true, processName, lines: logLines, totalLines: logLines.length, timestamp: new Date().toISOString() });
  });
});

// Nginx logs
router.get('/nginx', (req, res) => {
  const { type = 'access', lines = 50 } = req.query;
  const logFile = type === 'access' ? '/var/log/nginx/access.log' : '/var/log/nginx/error.log';
  
  exec(`tail -n ${lines} ${logFile} 2>&1`, (err, stdout) => {
    if (err) return res.status(500).json({ error: err.message });
    const logLines = stdout.split('\n').filter(l => l.trim());
    res.json({ success: true, type, lines: logLines, totalLines: logLines.length, timestamp: new Date().toISOString() });
  });
});

// Auth logs
router.get('/auth', (req, res) => {
  const { type = 'all', lines = 50 } = req.query;
  let command = `tail -n ${lines} /var/log/auth.log`;
  if (type === 'failures') command = `grep "Failed password" /var/log/auth.log | tail -n ${lines}`;
  if (type === 'sudo') command = `grep "sudo:" /var/log/auth.log | tail -n ${lines}`;
  
  exec(command, (err, stdout) => {
    if (err) return res.status(500).json({ error: err.message });
    const logLines = stdout.split('\n').filter(l => l.trim());
    res.json({ success: true, type, lines: logLines, totalLines: logLines.length, timestamp: new Date().toISOString() });
  });
});

// System logs
router.get('/system', (req, res) => {
  const { unit, lines = 50, since = '1 hour ago' } = req.query;
  let command = `journalctl --since "${since}" --no-pager -n ${lines}`;
  if (unit) command = `journalctl -u ${unit} --since "${since}" --no-pager -n ${lines}`;
  
  exec(command, (err, stdout) => {
    if (err) return res.status(500).json({ error: err.message });
    const logLines = stdout.split('\n').filter(l => l.trim());
    res.json({ success: true, unit: unit || 'all', since, lines: logLines, totalLines: logLines.length, timestamp: new Date().toISOString() });
  });
});

// MongoDB logs
router.get('/mongodb', (req, res) => {
  const { lines = 50 } = req.query;
  exec(`tail -n ${lines} /var/log/mongodb/mongod.log 2>&1`, (err, stdout) => {
    if (err) return res.status(500).json({ error: err.message });
    const logLines = stdout.split('\n').filter(l => l.trim());
    res.json({ success: true, lines: logLines, totalLines: logLines.length, timestamp: new Date().toISOString() });
  });
});

// Kernel logs
router.get('/kernel', (req, res) => {
  const { lines = 100 } = req.query;
  exec(`dmesg | tail -n ${lines} 2>&1`, (err, stdout) => {
    if (err) return res.status(500).json({ error: err.message });
    const logLines = stdout.split('\n').filter(l => l.trim());
    res.json({ success: true, type: 'kernel', lines: logLines, totalLines: logLines.length, timestamp: new Date().toISOString() });
  });
});

// Failed logins
router.get('/failed-logins', (req, res) => {
  const { lines = 50 } = req.query;
  exec(`grep "Failed password" /var/log/auth.log | tail -n ${lines} 2>&1`, (err, stdout) => {
    if (err) return res.status(500).json({ error: err.message });
    const logLines = stdout.split('\n').filter(l => l.trim());
    res.json({ success: true, type: 'failed_logins', lines: logLines, totalLines: logLines.length, timestamp: new Date().toISOString() });
  });
});

// Git history
router.get('/git-history', (req, res) => {
  const { projectName, lines = 20 } = req.query;
  let projectPath;
  switch(projectName) {
    case 'rashmaliarefan': projectPath = '/var/www/rashmaliarefan'; break;
    case 'portfolio-downloader': projectPath = '/var/www/portfolio-downloader'; break;
    default: return res.status(400).json({ error: 'Unknown project' });
  }
  
  exec(`cd "${projectPath}" && git log --oneline -n ${lines}`, (err, stdout) => {
    if (err) return res.status(500).json({ error: err.message });
    const commits = stdout.split('\n').filter(l => l.trim());
    res.json({ success: true, project: projectName, commits, totalCommits: commits.length, timestamp: new Date().toISOString() });
  });
});

// Firewall status
router.get('/firewall', (req, res) => {
  exec('ufw status verbose', (err, stdout) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, status: stdout, timestamp: new Date().toISOString() });
  });
});

// System health
router.get('/health', (req, res) => {
  exec('df -h / && echo "---SEP---" && free -h && echo "---SEP---" && uptime', (err, stdout) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, info: stdout, timestamp: new Date().toISOString() });
  });
});

module.exports = router;