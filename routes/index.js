const express = require('express');
const router = express.Router();

const statusRoutes = require('./status');
const processesRoutes = require('./processes');
const storageRoutes = require('./storage');
const deployRoutes = require('./deploy');
const filesRoutes = require('./files');
const logsRoutes = require('./logs');

router.use('/status', statusRoutes);
router.use('/processes', processesRoutes);
router.use('/storage', storageRoutes);
router.use('/', deployRoutes);  // check-updates, deploy, deploy-info
router.use('/uploads', filesRoutes);
router.use('/logs', logsRoutes);

module.exports = router;