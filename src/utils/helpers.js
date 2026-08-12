
// Format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Sanitize path
function sanitizePath(inputPath) {
  if (!inputPath) return '';
  return inputPath.replace(/\.\./g, '').replace(/\/\//g, '/').replace(/^\/+|\/+$/g, '');
}

// Format uptime
function formatUptime(seconds) {
  if (!seconds && seconds !== 0) return '-';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

module.exports = {
  formatFileSize,
  sanitizePath,
  formatUptime
};