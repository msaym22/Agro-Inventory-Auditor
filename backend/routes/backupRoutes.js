const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth'); // CORRECTED IMPORT
const { backupUpload } = require('../middleware/upload');
const { createBackup, restoreBackup, getHistory, downloadBackup } = require('../controllers/backupController');

// CORRECTED: Use 'protect' instead of 'auth'
router.post('/create', protect, createBackup);
// Expect field name 'backup' to match frontend FormData.append('backup', file)
router.post('/restore', protect, backupUpload.single('backup'), restoreBackup);
router.get('/history', protect, getHistory);
router.get('/download/:filename', protect, downloadBackup);

module.exports = router;