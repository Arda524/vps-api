const fs = require('fs').promises;
const path = require('path');
const system = require('../../services/systemService');

async function rootInfo(req, res, next) {
  try {
    const { stdout } = await system.runCommand('df', ['-h', '/']);
    const lines = stdout.trim().split('\n');
    const dataLine = lines[1].split(/\s+/);
    const { stdout: wwwSizeStd } = await system.runCommand('du', ['-sh', '/var/www']);
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
        size: (wwwSizeStd || '').trim().split(/\s+/)[0] || '0',
        path: '/var/www'
      }
    });
  } catch (err) {
    next(err);
  }
}

async function detailed(req, res, next) {
  try {
    const target = '/var/www';
    const dirents = await fs.readdir(target, { withFileTypes: true });
    const results = [];

    for (const dirent of dirents) {
      if (!dirent.isDirectory()) continue;
      const dirPath = path.join(target, dirent.name);
      const { stdout: duOut } = await system.runCommand('du', ['-sh', dirPath]);
      results.push({ path: dirPath, size: (duOut || '').trim().split(/\s+/)[0] || '0' });
    }

    res.json({ success: true, directories: results });
  } catch (err) {
    next(err);
  }
}

module.exports = { rootInfo, detailed };
