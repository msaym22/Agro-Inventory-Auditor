const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/auth');

router.get('/products', authMiddleware, analyticsController.getProductAnalytics);
router.get('/business', authMiddleware, analyticsController.getBusinessAnalytics); // This is likely for overall business analytics or monthly sales
router.get('/customers', authMiddleware, analyticsController.getCustomerAnalytics);
router.get('/sales', authMiddleware, analyticsController.getBusinessAnalytics); // New: Map /analytics/sales to getBusinessAnalytics

module.exports = router;