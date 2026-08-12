const system = require('../../../services/systemService');

function tailLines(output, lines) {
  const entries = (output || '').split('\n').filter(Boolean);
  return entries.slice(-lines);
}

async function allLogs(req, res, next) {
  try {
    const lines = system.parseLines(req.query.lines, 100);
    const logs = { pm2: {}, nginx: {}, system: {}, auth: {}, mongodb: {} };

    const processNames = await system.getPm2ProcessNames();
    await Promise.all(processNames.map(async (processName) => {
      const { stdout } = await system.runCommand('pm2', ['logs', processName, '--lines', String(lines), '--nostream']);
      logs.pm2[processName] = stdout || 'No logs';
    }));

    const p3 = await system.runCommand('tail', ['-n', String(lines), '/var/log/nginx/access.log']);
    logs.nginx.access = p3.stdout || 'No logs';

    const p4 = await system.runCommand('tail', ['-n', String(lines), '/var/log/nginx/error.log']);
    logs.nginx.error = p4.stdout || 'No logs';

    const p5 = await system.runCommand('journalctl', ['--since', '1 hour ago', '--no-pager', '-n', String(lines)]);
    logs.system = p5.stdout || 'No logs';

    const p6 = await system.runCommand('tail', ['-n', String(lines), '/var/log/auth.log']);
    logs.auth = p6.stdout || 'No logs';

    res.json({ success: true, timestamp: new Date().toISOString(), logs });
  } catch (err) {
    next(err);
  }
}

async function pm2Logs(req, res, next) {
  try {
    const { processName } = req.query;
    const lines = system.parseLines(req.query.lines, 50);
    const availableProcessNames = await system.getPm2ProcessNames();
    const target = processName || availableProcessNames[0];
    if (!target || !availableProcessNames.includes(target)) {
      return res.status(400).json({ error: 'Invalid or missing PM2 process name', available: availableProcessNames });
    }
    const { stdout } = await system.runCommand('pm2', ['logs', target, '--lines', String(lines), '--nostream']);
    const logLines = (stdout || '').split('\n').filter(l => l.trim());
    res.json({ success: true, processName: target, lines: logLines, totalLines: logLines.length, timestamp: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
}

async function nginxLogs(req, res, next) {
  try {
    const { type = 'access' } = req.query;
    const lines = system.parseLines(req.query.lines, 50);
    const logFile = type === 'access' ? '/var/log/nginx/access.log' : '/var/log/nginx/error.log';
    const { stdout } = await system.runCommand('tail', ['-n', String(lines), logFile]);
    const logLines = (stdout || '').split('\n').filter(l => l.trim());
    res.json({ success: true, type, lines: logLines, totalLines: logLines.length, timestamp: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
}

async function authLogs(req, res, next) {
  try {
    const { type = 'all' } = req.query;
    const lines = system.parseLines(req.query.lines, 50);
    let grepArgs = [];
    if (type === 'failures') grepArgs = ['Failed password', '/var/log/auth.log'];
    else if (type === 'sudo') grepArgs = ['sudo:', '/var/log/auth.log'];
    const { stdout } = grepArgs.length > 0
      ? await system.runCommand('grep', grepArgs)
      : await system.runCommand('tail', ['-n', String(lines), '/var/log/auth.log']);
    const logLines = tailLines(stdout, lines);
    res.json({ success: true, type, lines: logLines, totalLines: logLines.length, timestamp: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
}

async function systemLogs(req, res, next) {
  try {
    const unit = system.validateUnit(req.query.unit);
    const lines = system.parseLines(req.query.lines, 50);
    const since = system.validateSince(req.query.since || '1 hour ago');
    const args = ['--since', since, '--no-pager', '-n', String(lines)];
    if (unit) args.unshift('-u', unit);
    const { stdout } = await system.runCommand('journalctl', args);
    const logLines = (stdout || '').split('\n').filter(l => l.trim());
    res.json({ success: true, unit: unit || 'all', since, lines: logLines, totalLines: logLines.length, timestamp: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
}

async function mongodbLogs(req, res, next) {
  try {
    const lines = system.parseLines(req.query.lines, 50);
    const { stdout } = await system.runCommand('tail', ['-n', String(lines), '/var/log/mongodb/mongod.log']);
    const logLines = (stdout || '').split('\n').filter(l => l.trim());
    res.json({ success: true, lines: logLines, totalLines: logLines.length, timestamp: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
}

async function kernelLogs(req, res, next) {
  try {
    const lines = system.parseLines(req.query.lines, 100);
    const { stdout } = await system.runCommand('dmesg', []);
    const logLines = tailLines(stdout, lines);
    res.json({ success: true, type: 'kernel', lines: logLines, totalLines: logLines.length, timestamp: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
}

async function failedLogins(req, res, next) {
  try {
    const lines = system.parseLines(req.query.lines, 50);
    const { stdout } = await system.runCommand('grep', ['Failed password', '/var/log/auth.log']);
    const logLines = tailLines(stdout, lines);
    res.json({ success: true, type: 'failed_logins', lines: logLines, totalLines: logLines.length, timestamp: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
}

async function gitHistory(req, res, next) {
  try {
    const projectName = req.query.projectName;
    if (!projectName) {
      const projects = await system.listProjectDirectories();
      return res.status(400).json({ error: 'Missing projectName', availableProjects: projects });
    }

    const validProjectName = await system.validateProject(projectName);
    const lines = system.parseLines(req.query.lines, 20);
    const projectPath = system.resolveProjectPath(validProjectName);
    const { stdout } = await system.runCommand('git', ['-C', projectPath, 'log', '--oneline', '-n', String(lines)]);
    const commits = (stdout || '').split('\n').filter(l => l.trim());
    res.json({ success: true, project: validProjectName, commits, totalCommits: commits.length, timestamp: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
}

async function listProjects(req, res, next) {
  try {
    const projects = await system.listProjectDirectories();
    res.json({ success: true, projects, count: projects.length, timestamp: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
}

async function firewall(req, res, next) {
  try {
    const { stdout } = await system.runCommand('ufw', ['status', 'verbose']);
    res.json({ success: true, status: stdout, timestamp: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
}

async function health(req, res, next) {
  try {
    const df = await system.runCommand('df', ['-h', '/']);
    const free = await system.runCommand('free', ['-h']);
    const uptime = await system.runCommand('uptime', []);
    res.json({ success: true, info: `${df.stdout || ''}\n---SEP---\n${free.stdout || ''}\n---SEP---\n${uptime.stdout || ''}`, timestamp: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
}

module.exports = { allLogs, pm2Logs, nginxLogs, authLogs, systemLogs, mongodbLogs, kernelLogs, failedLogins, gitHistory, firewall, health };
