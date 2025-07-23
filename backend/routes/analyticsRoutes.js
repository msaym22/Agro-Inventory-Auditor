const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getSalesAnalytics,
  getOverallProfit, // Import new function
  getProfitByProduct, // Import new function
  getSalesByCustomerWithQuantity, // Import new function
  getInventoryValuation,
  getMonthlySalesReport,
} = require('../controllers/analyticsController');

router.get('/sales', auth, getSalesAnalytics);
router.get('/profit/overall', auth, getOverallProfit); // New route
router.get('/profit/by-product', auth, getProfitByProduct); // New route
router.get('/sales/by-customer-quantity', auth, getSalesByCustomerWithQuantity); // New route
router.get('/inventory-valuation', auth, getInventoryValuation);
router.get('/monthly-sales-report', auth, getMonthlySalesReport);


module.exports = router;