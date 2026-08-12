const express = require('express');
const router = express.Router();
const controller = require('../../controllers/server/processesController');

router.get('/', (req, res, next) => controller.listProcesses(req, res, next));
router.post('/restart', (req, res, next) => controller.restart(req, res, next));

module.exports = router;
