const express = require('express');
const router = express.Router();
const aiDetectionController = require('../controllers/aiDetectionController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Detect product from image
router.post('/detect', aiDetectionController.detectProduct);

module.exports = router;

