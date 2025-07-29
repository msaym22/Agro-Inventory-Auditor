// backend/routes/analyticsRoutes.js
const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getSalesAnalytics,
  getOverallProfit,
  getProfitByProduct,
  getSalesByCustomerWithQuantity,
  getProductsByQuantitySold, // NEW: Import this
  getCustomerDetailAnalytics, // NEW: Import this
  getProductDetailAnalytics,  // NEW: Import this
  getInventoryValuation,
  getMonthlySalesReport,
} = require('../controllers/analyticsController');

const router = express.Router();

// Existing routes (updated to support period/date filters via query params)
router.get('/sales', protect, getSalesAnalytics); // Now accepts period, startDate, endDate
router.get('/profit/overall', protect, getOverallProfit); // Now accepts period, startDate, endDate
router.get('/profit/by-product', protect, getProfitByProduct); // Now accepts period, startDate, endDate
router.get('/sales/by-customer-quantity', protect, getSalesByCustomerWithQuantity); // Now accepts period, startDate, endDate
router.get('/inventory-valuation', protect, getInventoryValuation);
router.get('/monthly-sales-report', protect, getMonthlySalesReport); // Now accepts period, startDate, endDate

// NEW Analytics Detail Routes
router.get('/customers/:id/detail', protect, getCustomerDetailAnalytics); // Accepts startDate, endDate
router.get('/products/:id/detail', protect, getProductDetailAnalytics); // Accepts startDate, endDate


module.exports = router;