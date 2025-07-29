const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getSalesAnalytics,
  getOverallProfit,
  getProfitByProduct,
  getSalesByCustomerWithQuantity,
  getInventoryValuation, // Corrected spelling here
  getMonthlySalesReport,
  getProductsByQuantitySold, // Ensuring this and other new functions are imported
  getCustomerHistory,
  getProductHistory,
} = require('../controllers/analyticsController');

// Apply the 'protect' middleware to each route
router.get('/sales', protect, getSalesAnalytics);
router.get('/profit/overall', protect, getOverallProfit);
router.get('/profit/by-product', protect, getProfitByProduct);
router.get('/sales/by-customer-quantity', protect, getSalesByCustomerWithQuantity);
router.get('/inventory-valuation', protect, getInventoryValuation); // Corrected spelling here
router.get('/monthly-sales-report', protect, getMonthlySalesReport);
router.get('/products/quantity-sold', protect, getProductsByQuantitySold);
router.get('/customer-history/:customerId', protect, getCustomerHistory);
router.get('/product-history/:productId', protect, getProductHistory);

module.exports = router;