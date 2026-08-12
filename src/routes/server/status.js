const express = require('express');
const router = express.Router();
const controller = require('../../controllers/server/statusController');

router.get('/', (req, res, next) => controller.status(req, res, next));

module.exports = router;
