const fs = require('fs').promises;
const path = require('path');

async function resolveBase(baseDir) {
  return path.resolve(baseDir);
}

async function listDirectory(baseDir, relPath, sanitize) {
  const cleanPath = sanitize(relPath);
  const resolvedBase = await resolveBase(baseDir);
  const resolvedTarget = cleanPath ? path.resolve(resolvedBase, cleanPath) : resolvedBase;
  if (!resolvedTarget.startsWith(resolvedBase)) throw new Error('Access denied');

  const stat = await fs.stat(resolvedTarget).catch(() => null);
  if (!stat || !stat.isDirectory()) throw new Error('Directory not found');

  const dirents = await fs.readdir(resolvedTarget, { withFileTypes: true });
  const items = [];
  for (const dirent of dirents) {
    const name = dirent.name;
    if (name === '.' || name === '..') continue;
    const entryPath = path.join(resolvedTarget, name);
    const entryStat = await fs.stat(entryPath).catch(() => null);
    items.push({
      name,
      path: cleanPath ? `${cleanPath}/${name}` : name,
      isDirectory: dirent.isDirectory(),
      size: entryStat && entryStat.isFile() ? entryStat.size : 0,
      stat: entryStat
    });
  }
  return { base: resolvedBase, target: resolvedTarget, items };
}

async function readFile(baseDir, relPath, sanitize, encoding = null) {
  const cleanPath = sanitize(relPath);
  const resolvedBase = await resolveBase(baseDir);
  const resolvedTarget = path.resolve(resolvedBase, cleanPath);
  if (!resolvedTarget.startsWith(resolvedBase)) throw new Error('Access denied');
  const stat = await fs.stat(resolvedTarget).catch(() => null);
  if (!stat || !stat.isFile()) throw new Error('File not found');
  const data = await fs.readFile(resolvedTarget, encoding || null);
  return { data, stat, resolvedTarget };
}

async function deleteFile(baseDir, relPath, sanitize) {
  const cleanPath = sanitize(relPath);
  const resolvedBase = await resolveBase(baseDir);
  const resolvedTarget = path.resolve(resolvedBase, cleanPath);
  if (!resolvedTarget.startsWith(resolvedBase)) throw new Error('Access denied');
  await fs.unlink(resolvedTarget);
  return true;
}

module.exports = { listDirectory, readFile, deleteFile };
