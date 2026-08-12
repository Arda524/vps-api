const express = require('express');
const router = express.Router();
const controller = require('../../../controllers/server/logsController');

router.get('/all', (req, res, next) => controller.allLogs(req, res, next));
router.get('/pm2', (req, res, next) => controller.pm2Logs(req, res, next));
router.get('/nginx', (req, res, next) => controller.nginxLogs(req, res, next));
router.get('/auth', (req, res, next) => controller.authLogs(req, res, next));
router.get('/system', (req, res, next) => controller.systemLogs(req, res, next));
router.get('/mongodb', (req, res, next) => controller.mongodbLogs(req, res, next));
router.get('/kernel', (req, res, next) => controller.kernelLogs(req, res, next));
router.get('/failed-logins', (req, res, next) => controller.failedLogins(req, res, next));
router.get('/git-history', (req, res, next) => controller.gitHistory(req, res, next));
router.get('/projects', (req, res, next) => controller.listProjects(req, res, next));
router.get('/firewall', (req, res, next) => controller.firewall(req, res, next));
router.get('/health', (req, res, next) => controller.health(req, res, next));

module.exports = router;
