const express = require('express');
const { exec } = require('child_process');
const router = express.Router();

// Get disk/storage information
router.get('/', (req, res) => {
  exec('df -h /', (err, stdout) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const lines = stdout.trim().split('\n');
    const dataLine = lines[1].split(/\s+/);
    
    exec('du -sh /var/www 2>/dev/null', (err2, wwwSize) => {
      res.json({
        success: true,
        root: {
          total: dataLine[1],
          used: dataLine[2],
          available: dataLine[3],
          usedPercent: dataLine[4],
          mount: dataLine[5]
        },
        varWww: {
          size: wwwSize.trim().split(/\s+/)[0] || '0',
          path: '/var/www'
        }
      });
    });
  });
});

/**
 * Get detailed storage info for directories under /var/www
 * (replaces hardcoded list so dashboard shows real folders)
 */
router.get('/detailed', (req, res) => {
  // List only immediate subdirectories under /var/www (safe on Linux)
  exec('find /var/www -mindepth 1 -maxdepth 1 -type d -print 2>/dev/null', (err, stdout) => {
    if (err) {
      return res.json({ success: true, directories: [] });
    }
    const dirs = (stdout || '')
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    if (dirs.length === 0) {
      return res.json({ success: true, directories: [] });
    }

    const results = [];
    let completed = 0;

    dirs.forEach(dir => {
      exec(`du -sh "${dir}" 2>/dev/null`, (duErr, duStdout) => {
        let size = '0';
        if (!duErr && duStdout) {
          size = duStdout.trim().split(/\s+/)[0] || '0';
        }

        results.push({ path: dir, size });
        completed++;

        if (completed === dirs.length) {
          // Keep response shape consistent with previous implementation
          res.json({ success: true, directories: results });
        }
      });
    });
  });
});

module.exports = router;
