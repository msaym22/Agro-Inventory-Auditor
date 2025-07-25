const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth'); // Correctly import the 'protect' function
const {
  getSalesAnalytics,
  getOverallProfit,
  getProfitByProduct,
  getSalesByCustomerWithQuantity,
  getInventoryValuation,
  getMonthlySalesReport,
} = require('../controllers/analyticsController');

// Correctly apply the 'protect' middleware to each route
router.get('/sales', protect, getSalesAnalytics);
router.get('/profit/overall', protect, getOverallProfit);
router.get('/profit/by-product', protect, getProfitByProduct);
router.get('/sales/by-customer-quantity', protect, getSalesByCustomerWithQuantity);
router.get('/inventory-valuation', protect, getInventoryValuation);
router.get('/monthly-sales-report', protect, getMonthlySalesReport);

module.exports = router;