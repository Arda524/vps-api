const system = require('../../services/systemService');

async function listProcesses(req, res, next) {
  try {
    const { stdout } = await system.runCommand('pm2', ['jlist']);
    const processes = JSON.parse(stdout || '[]');
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
  } catch (err) {
    next(err);
  }
}

async function restart(req, res, next) {
  try {
    const { processName } = req.body;
    if (!processName) return res.status(400).json({ error: 'Process name required' });
    if (!/^[a-zA-Z0-9-_]+$/.test(processName)) return res.status(400).json({ error: 'Invalid process name' });
    const { stdout } = await system.runCommand('pm2', ['restart', processName]);
    res.json({ success: true, message: `Process ${processName} restarted`, output: stdout });
  } catch (err) {
    next(err);
  }
}

module.exports = { listProcesses, restart };
