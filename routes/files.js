const express = require('express');
const { exec } = require('child_process');
const { formatFileSize, sanitizePath } = require('../utils/helpers');
const router = express.Router();

// List files in directories
router.get('/list', (req, res) => {
  const { path = '', baseDir = '/var/www/rashmaliarefan/public/uploads' } = req.query;
  
  const cleanPath = sanitizePath(path);
  const targetPath = cleanPath ? `${baseDir}/${cleanPath}` : baseDir;
  
  if (!targetPath.startsWith(baseDir)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  exec(`test -d "${targetPath}" && echo "exists" || echo "notfound"`, (err, exists) => {
    if (exists && exists.trim() !== 'exists') {
      return res.status(404).json({ error: 'Directory not found' });
    }
    
    exec(`ls -la "${targetPath}"`, (err, stdout) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const lines = stdout.split('\n').slice(1);
      const files = [];
      
      for (const line of lines) {
        if (!line.trim()) continue;
        
        const parts = line.split(/\s+/);
        if (parts.length < 9) continue;
        
        const isDir = parts[0].startsWith('d');
        const name = parts.slice(8).join(' ');
        const size = parseInt(parts[4]);
        const modified = `${parts[5]} ${parts[6]} ${parts[7]}`;
        
        if (name === '.' || name === '..') continue;
        
        files.push({
          name: name,
          path: cleanPath ? `${cleanPath}/${name}` : name,
          isDirectory: isDir,
          size: size,
          sizeFormatted: formatFileSize(size),
          modified: modified
        });
      }
      
      files.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });
      
      res.json({
        success: true,
        currentPath: cleanPath || '/',
        files: files
      });
    });
  });
});

// Get file content for preview
router.get('/file', (req, res) => {
  const { path: filePath, baseDir = '/var/www/rashmaliarefan/public/uploads' } = req.query;
  
  if (!filePath) {
    return res.status(400).json({ error: 'File path required' });
  }
  
  const cleanPath = sanitizePath(filePath);
  const targetPath = `${baseDir}/${cleanPath}`;
  
  if (!targetPath.startsWith(baseDir)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  exec(`test -f "${targetPath}" && echo "exists" || echo "notfound"`, (err, exists) => {
    if (exists && exists.trim() !== 'exists') {
      return res.status(404).json({ error: 'File not found' });
    }
    
    exec(`file -b --mime-type "${targetPath}"`, (err, mimeType) => {
      if (err) return res.status(500).json({ error: err.message });
      
      const mime = mimeType.trim();
      const isImage = mime.startsWith('image/');
      const isText = mime.startsWith('text/') || mime.includes('javascript') || mime.includes('json');
      
      if (isImage) {
        exec(`base64 "${targetPath}"`, (err, base64Data) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({
            success: true,
            type: 'image',
            mimeType: mime,
            content: base64Data.trim(),
            filename: cleanPath.split('/').pop()
          });
        });
      } else if (isText) {
        exec(`cat "${targetPath}"`, (err, content) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({
            success: true,
            type: 'text',
            mimeType: mime,
            content: content,
            filename: cleanPath.split('/').pop()
          });
        });
      } else {
        res.json({
          success: true,
          type: 'binary',
          mimeType: mime,
          filename: cleanPath.split('/').pop(),
          downloadUrl: `/api/vps/uploads/download?path=${encodeURIComponent(cleanPath)}&baseDir=${encodeURIComponent(baseDir)}`
        });
      }
    });
  });
});

// Download file
router.get('/download', (req, res) => {
  const { path: filePath, baseDir = '/var/www/rashmaliarefan/public/uploads' } = req.query;
  
  if (!filePath) {
    return res.status(400).json({ error: 'File path required' });
  }
  
  const cleanPath = sanitizePath(filePath);
  const targetPath = `${baseDir}/${cleanPath}`;
  
  if (!targetPath.startsWith(baseDir)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  res.download(targetPath, cleanPath.split('/').pop());
});

// Delete file
router.delete('/delete', (req, res) => {
  const { path: filePath, baseDir = '/var/www/rashmaliarefan/public/uploads' } = req.query;
  
  if (!filePath) {
    return res.status(400).json({ error: 'File path required' });
  }
  
  const cleanPath = sanitizePath(filePath);
  const targetPath = `${baseDir}/${cleanPath}`;
  
  if (!targetPath.startsWith(baseDir)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  exec(`rm -f "${targetPath}"`, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: 'File deleted successfully' });
  });
});

module.exports = router;