// backend/routes/backupRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { createBackup, restoreBackup, getHistory, downloadBackup } = require('../controllers/backupController'); // Ensure all are imported

// CORRECTED: Change this route from GET to POST
router.post('/create', auth, createBackup); // Now accepts POST requests for /api/backup/create

router.post('/restore', auth, upload.backup, restoreBackup);
router.get('/history', auth, getHistory);
router.get('/download/:filename', auth, downloadBackup);

module.exports = router;