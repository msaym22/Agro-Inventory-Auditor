const { Product, Sale, Customer } = require('../models');
const { Op } = require('sequelize'); // Import Op for queries
const {
  calculateMonthlySales, // This should be for sales report like business analytics
  calculateProductPerformance, // This should be for product analytics
  calculateStockTurnover // Also available but not used in current frontend dashboard
} = require('../utils/analytics'); // Import actual analytics utility functions

exports.getProductAnalytics = async (req, res) => {
  try {
    const products = await Product.findAll();
    const sales = await Sale.findAll(); // Fetch sales to calculate product performance

    // Use calculateProductPerformance from utils/analytics.js
    // It takes products and sales, and computes revenue for top products
    const productPerformance = calculateProductPerformance(products, sales);

    // Assuming you still want fastMoving from the previous version, based on 'stock'
    const fastMoving = products.filter(p => p.stock < 10); // Corrected property from stockQuantity to stock

    // You can structure the response as needed, similar to the original intent
    const analytics = {
      productPerformance: productPerformance, // Top products by revenue
      fastMovingProducts: fastMoving, // Products with low stock
      // turnoverRates: calculateStockTurnover(products) // If you want to include this too
    };
    res.json(analytics);
  } catch (error) {
    console.error("Error in getProductAnalytics:", error); // Log the error for debugging
    res.status(500).json({ error: error.message || 'Failed to get product analytics' });
  }
};

exports.getBusinessAnalytics = async (req, res) => {
  try {
    const { period } = req.query; // Period might be used to filter sales for the report
    const sales = await Sale.findAll(); // Fetch all sales to calculate monthly sales

    // Use calculateMonthlySales from utils/analytics.js for sales report
    const monthlyReport = calculateMonthlySales(sales);

    res.json(monthlyReport); // Return the calculated monthly sales
  } catch (error) {
    console.error("Error in getBusinessAnalytics:", error); // Log the error for debugging
    res.status(500).json({ error: error.message || 'Failed to get business analytics' });
  }
};

exports.getCustomerAnalytics = async (req, res) => {
  try {
    const customers = await Customer.findAll({
      include: [{ model: Sale, as: 'purchases' }]
    });

    const analytics = customers.map(customer => ({
      id: customer.id,
      name: customer.name, // Include name for better identification
      totalSpent: customer.purchases.reduce((sum, sale) => sum + sale.totalAmount, 0),
      lastPurchase: customer.purchases.sort((a,b) => new Date(b.date) - new Date(a.date))[0]?.date // Sort by date, not createdAt
    }));

    res.json(analytics);
  } catch (error) {
    console.error("Error in getCustomerAnalytics:", error); // Log the error for debugging
    res.status(500).json({ error: error.message || 'Failed to get customer analytics' });
  }
};