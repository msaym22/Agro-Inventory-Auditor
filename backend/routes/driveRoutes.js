// backend/routes/driveRoutes.js
const express = require('express');
const router = express.Router();
const driveController = require('../controllers/driveController');

router.get('/auth-url', driveController.getAuthUrl);
router.post('/authenticate', driveController.authenticate);
router.post('/sync', driveController.syncDatabase);

module.exports = router;