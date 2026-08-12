const mime = require('mime-types');
const { formatFileSize, sanitizePath } = require('../../utils/helpers');
const fileService = require('../../services/fileService');
const system = require('../../services/systemService');
const config = require('../../config');

async function resolveUploadsBaseDir(projectName) {
  if (projectName) return system.resolveProjectUploadDir(projectName);
  if (config.UPLOADS_DIR) return config.UPLOADS_DIR;
  return system.resolveDefaultUploadDir();
}

async function list(req, res, next) {
  try {
    const { path: reqPath = '', projectName } = req.query;
    const baseDir = await resolveUploadsBaseDir(projectName);
    const { items } = await fileService.listDirectory(baseDir, reqPath, sanitizePath);
    const files = items.map(entry => ({
      name: entry.name,
      path: entry.path,
      isDirectory: entry.isDirectory,
      size: entry.stat && entry.stat.isFile() ? entry.stat.size : 0,
      sizeFormatted: entry.stat && entry.stat.isFile() ? formatFileSize(entry.stat.size) : '-',
      modified: entry.stat ? entry.stat.mtime.toISOString() : null
    }));
    files.sort((a,b)=> (a.isDirectory&&!b.isDirectory)?-1:(!a.isDirectory&&b.isDirectory)?1:a.name.localeCompare(b.name));
    res.json({ success: true, currentPath: reqPath || '/', projectName: projectName || null, files });
  } catch (err) {
    next(err);
  }
}

async function file(req, res, next) {
  try {
    const { path: filePath, projectName } = req.query;
    if (!filePath) return res.status(400).json({ error: 'File path required' });
    const baseDir = await resolveUploadsBaseDir(projectName);
    const { data, stat, resolvedTarget } = await fileService.readFile(baseDir, filePath, sanitizePath, null);
    const mimeType = mime.lookup(resolvedTarget) || 'application/octet-stream';
    const isImage = mimeType.startsWith('image/');
    const isText = mimeType.startsWith('text/') || mimeType.includes('javascript') || mimeType.includes('json');
    if (isImage) return res.json({ success: true, type: 'image', mimeType, content: data.toString('base64'), filename: filePath.split('/').pop() });
    if (isText) return res.json({ success: true, type: 'text', mimeType, content: data.toString('utf8'), filename: filePath.split('/').pop() });
    res.json({ success: true, type: 'binary', mimeType, filename: filePath.split('/').pop(), downloadUrl: `/api/server/uploads/download?path=${encodeURIComponent(sanitizePath(filePath))}&projectName=${encodeURIComponent(projectName || '')}` });
  } catch (err) { next(err); }
}

async function download(req, res, next) {
  try {
    const { path: filePath, projectName } = req.query;
    if (!filePath) return res.status(400).json({ error: 'File path required' });
    const baseDir = await resolveUploadsBaseDir(projectName);
    const { resolvedTarget } = await fileService.readFile(baseDir, filePath, sanitizePath, null);
    res.download(resolvedTarget, sanitizePath(filePath).split('/').pop());
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const { path: filePath, projectName } = req.query;
    if (!filePath) return res.status(400).json({ error: 'File path required' });
    const baseDir = await resolveUploadsBaseDir(projectName);
    await fileService.deleteFile(baseDir, filePath, sanitizePath);
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (err) { next(err); }
}

async function listUploadProjects(req, res, next) {
  try {
    const projects = await system.listProjectUploadDirectories();
    res.json({ success: true, projects, count: projects.length, timestamp: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, file, download, remove, listUploadProjects };
