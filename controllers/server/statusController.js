const os = require('os');

function status(req, res, next) {
  try {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    res.json({
      success: true,
      uptime: os.uptime(),
      cpu: { cores: os.cpus().length, load: os.loadavg(), model: os.cpus()[0]?.model || 'Unknown' },
      memory: { total: totalMem, used: usedMem, free: freeMem, usedPercent: ((usedMem/totalMem)*100).toFixed(1) },
      hostname: os.hostname(), platform: os.platform(), timestamp: new Date().toISOString()
    });
  } catch (err) { next(err); }
}

module.exports = { status };
