const express = require('express');
const router = express.Router();
const controller = require('../../controllers/server/filesController');

router.get('/list', (req, res, next) => controller.list(req, res, next));
router.get('/file', (req, res, next) => controller.file(req, res, next));
router.get('/download', (req, res, next) => controller.download(req, res, next));
router.delete('/delete', (req, res, next) => controller.remove(req, res, next));
router.get('/projects', (req, res, next) => controller.listUploadProjects(req, res, next));

module.exports = router;
