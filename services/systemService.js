const fs = require('fs').promises;
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const config = require('../config');
const execFileP = promisify(execFile);

const PROJECTS_DIR = config.PROJECTS_DIR;

function parseLines(value, defaultValue = 50) {
  const lines = parseInt(value, 10);
  return Number.isFinite(lines) && lines > 0 ? lines : defaultValue;
}

function validateSince(value) {
  if (!value) return '1 hour ago';
  const allowed = /^\d+\s+(second|seconds|minute|minutes|hour|hours|day|days|week|weeks|month|months|year|years)\s+ago$/;
  if (value === '1 hour ago' || allowed.test(value)) return value;
  throw new Error('Invalid time range');
}

function validateUnit(unit) {
  if (!unit) return null;
  if (!/^[a-zA-Z0-9_.-]+$/.test(unit)) throw new Error('Invalid unit name');
  return unit;
}

async function listProjectDirectories(baseDir = PROJECTS_DIR) {
  const entries = await fs.readdir(baseDir, { withFileTypes: true });
  return entries.filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);
}

async function validateProject(projectName, baseDir = PROJECTS_DIR) {
  if (!projectName || !/^[a-zA-Z0-9_.-]+$/.test(projectName)) throw new Error('Invalid project name');
  const projectPath = path.join(baseDir, projectName);
  const stats = await fs.stat(projectPath).catch(() => null);
  if (!stats || !stats.isDirectory()) throw new Error('Unknown project');
  return projectName;
}

function resolveProjectPath(projectName, baseDir = PROJECTS_DIR) {
  return path.join(baseDir, projectName);
}

function resolveUploadDir(projectName, baseDir = PROJECTS_DIR) {
  return path.join(baseDir, projectName, 'public', 'uploads');
}

async function listProjectUploadDirectories(baseDir = PROJECTS_DIR) {
  const projects = await listProjectDirectories(baseDir);
  const uploadProjects = [];
  for (const projectName of projects) {
    const uploads = resolveUploadDir(projectName, baseDir);
    const stats = await fs.stat(uploads).catch(() => null);
    if (stats && stats.isDirectory()) uploadProjects.push(projectName);
  }
  return uploadProjects;
}

async function resolveProjectUploadDir(projectName, baseDir = PROJECTS_DIR) {
  await validateProject(projectName, baseDir);
  const uploads = resolveUploadDir(projectName, baseDir);
  const stats = await fs.stat(uploads).catch(() => null);
  if (!stats || !stats.isDirectory()) throw new Error(`Upload directory not found for project ${projectName}`);
  return uploads;
}

async function resolveDefaultUploadDir(baseDir = PROJECTS_DIR) {
  const uploadProjects = await listProjectUploadDirectories(baseDir);
  if (uploadProjects.length === 1) return resolveProjectUploadDir(uploadProjects[0], baseDir);
  if (uploadProjects.length === 0) throw new Error('No upload directories found for any project');
  throw new Error('Multiple upload projects found; specify projectName');
}

async function getPm2ProcessNames() {
  const { stdout } = await runCommand('pm2', ['jlist']);
  const processes = JSON.parse(stdout || '[]');
  return processes.map(item => item.name).filter(Boolean);
}

async function runCommand(command, args = [], opts = {}) {
  return execFileP(command, args, { maxBuffer: 10 * 1024 * 1024, ...opts });
}

module.exports = { runCommand, parseLines, validateSince, validateUnit, validateProject, resolveProjectPath, listProjectDirectories, listProjectUploadDirectories, resolveProjectUploadDir, resolveDefaultUploadDir, getPm2ProcessNames };
