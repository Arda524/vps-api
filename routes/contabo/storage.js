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

// Get detailed storage info for specific directories
router.get('/detailed', (req, res) => {
  const directories = [
    '/var/www/rashmaliarefan',
    '/var/www/portfolio-downloader',
    '/var/www/rashmaliarefan/public/uploads'
  ];
  
  const results = [];
  let completed = 0;
  
  directories.forEach(dir => {
    exec(`du -sh "${dir}" 2>/dev/null`, (err, stdout) => {
      let size = '0';
      if (!err && stdout) {
        size = stdout.trim().split(/\s+/)[0] || '0';
      }
      results.push({ path: dir, size: size });
      completed++;
      
      if (completed === directories.length) {
        res.json({ success: true, directories: results });
      }
    });
  });
});

module.exports = router;