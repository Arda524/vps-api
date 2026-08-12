const express = require('express');
const router = express.Router();
const controller = require('../../../controllers/server/storageController');

router.get('/', (req, res, next) => controller.rootInfo(req, res, next));
router.get('/detailed', (req, res, next) => controller.detailed(req, res, next));

module.exports = router;
