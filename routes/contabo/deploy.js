const express = require('express');
const { exec } = require('child_process');
const router = express.Router();

// Check for GitHub updates
router.get('/check-updates', (req, res) => {
  const { projectName } = req.query;
  
  if (!projectName) {
    return res.status(400).json({ error: 'Project name required' });
  }
  
  let projectPath;
  switch(projectName) {
    case 'rashmaliarefan':
      projectPath = '/var/www/rashmaliarefan';
      break;
    case 'portfolio-downloader':
      projectPath = '/var/www/portfolio-downloader';
      break;
    default:
      return res.status(400).json({ error: 'Unknown project' });
  }
  
  exec(`cd "${projectPath}" && git fetch && git status -uno`, (err, stdout) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const hasUpdates = stdout.includes('Your branch is behind');
    const behindMatch = stdout.match(/Your branch is behind 'origin\/[^']+' by (\d+) commit/);
    const behindCount = behindMatch ? parseInt(behindMatch[1]) : 0;
    
    exec(`cd "${projectPath}" && git log -1 --pretty=%B`, (err, commitMsg) => {
      res.json({
        success: true,
        hasUpdates: hasUpdates,
        behindCount: behindCount,
        currentBranch: 'main',
        lastCommit: commitMsg?.trim() || '',
        details: stdout
      });
    });
  });
});

// Deploy from GitHub
router.post('/deploy', (req, res) => {
  const { projectName } = req.body;
  
  if (!projectName) {
    return res.status(400).json({ error: 'Project name required' });
  }
  
  let projectPath;
  let pm2Name;
  let buildCommand = '';
  
  switch(projectName) {
    case 'rashmaliarefan':
      projectPath = '/var/www/rashmaliarefan';
      pm2Name = 'rashmaliarefan';
      buildCommand = 'npm install && npm run build';
      break;
    case 'portfolio-downloader':
      projectPath = '/var/www/portfolio-downloader';
      pm2Name = 'tiktok-downloader';
      buildCommand = 'npm install';
      break;
    default:
      return res.status(400).json({ error: 'Unknown project' });
  }
  
  const deployCommand = `
    cd "${projectPath}" && \
    echo "📦 Pulling latest changes..." && \
    git pull && \
    echo "📦 Installing dependencies..." && \
    ${buildCommand} && \
    echo "🔄 Restarting PM2 process..." && \
    pm2 restart ${pm2Name} && \
    echo "✅ Deployment complete!"
  `;
  
  exec(deployCommand, { timeout: 120000 }, (err, stdout, stderr) => {
    if (err) {
      console.error(`Deploy error: ${err.message}`);
      return res.status(500).json({ 
        success: false, 
        error: err.message,
        output: stderr || stdout
      });
    }
    
    res.json({
      success: true,
      message: `${projectName} deployed successfully`,
      output: stdout
    });
  });
});

// Get deployment status / last deploy info
router.get('/deploy-info', (req, res) => {
  const { projectName } = req.query;
  
  if (!projectName) {
    return res.status(400).json({ error: 'Project name required' });
  }
  
  let projectPath;
  switch(projectName) {
    case 'rashmaliarefan':
      projectPath = '/var/www/rashmaliarefan';
      break;
    case 'portfolio-downloader':
      projectPath = '/var/www/portfolio-downloader';
      break;
    default:
      return res.status(400).json({ error: 'Unknown project' });
  }
  
  exec(`cd "${projectPath}" && git log -1 --format="%h|%an|%ae|%s|%ar"`, (err, stdout) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const parts = stdout.trim().split('|');
    res.json({
      success: true,
      commit: {
        hash: parts[0],
        author: parts[1],
        email: parts[2],
        message: parts[3],
        when: parts[4]
      }
    });
  });
});

module.exports = router;