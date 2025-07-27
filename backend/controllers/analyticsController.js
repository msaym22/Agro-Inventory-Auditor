// msaym22/almadina-agro/Almadina-Agro-abd29d75b3664b7b4eb5cb4c7bcae0d6f2c03885/backend/controllers/analyticsController.js
const { Sale, Product, Customer, SaleItem } = require('../models');
const { sequelize } = require('../models'); // Import the sequelize instance
const { Op } = require('sequelize');
const moment = require('moment');

// @desc    Get overall sales analytics (total sales, total revenue, sales by period, product sales)
// @route   GET /api/analytics/sales?period={period}
// @access  Private
const getSalesAnalytics = async (req, res) => {
  const { period = 'monthly' } = req.query; // 'daily', 'weekly', 'monthly', 'yearly'

  let groupByFormat;
  let startDate;

  switch (period) {
    case 'daily':
      groupByFormat = '%Y-%m-%d';
      startDate = moment().subtract(30, 'days').toDate();
      break;
    case 'weekly':
      groupByFormat = '%Y-%W';
      startDate = moment().subtract(12, 'weeks').toDate();
      break;
    case 'monthly':
      groupByFormat = '%Y-%m';
      startDate = moment().subtract(12, 'months').toDate();
      break;
    case 'yearly':
      groupByFormat = '%Y';
      startDate = moment().subtract(5, 'years').toDate();
      break;
    default:
      groupByFormat = '%Y-%m';
      startDate = moment().subtract(12, 'months').toDate();
  }

  try {
    const totalSales = await Sale.count();
    const totalRevenueResult = await Sale.sum('totalAmount');
    const totalRevenue = totalRevenueResult || 0;

    const salesByPeriod = await Sale.findAll({
      attributes: [
        [sequelize.fn('strftime', groupByFormat, sequelize.col('saleDate')), 'period'],
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'total']
      ],
      where: {
        saleDate: {
          [Op.gte]: startDate
        }
      },
      group: ['period'],
      order: [['period', 'ASC']]
    });

    // Fetch product sales performance (top products by revenue)
    const productSalesRaw = await SaleItem.findAll({
      attributes: [
        'quantity',         // Fetch quantity
        'priceAtSale',      // Fetch priceAtSale
      ],
      include: [{
        model: Product,
        as: 'product', // FIX: Use 'product' (lowercase alias) here
        attributes: ['name'], // Only need name for grouping
        required: true
      }],
      raw: true, // Fetch raw data
    });

    // Calculate product sales revenue in JavaScript
    const productSalesMap = productSalesRaw.reduce((acc, item) => {
      const productName = item['product.name']; // FIX: Access aliased product name as 'product.name'
      const revenue = (item.quantity || 0) * (item.priceAtSale || 0);
      acc[productName] = (acc[productName] || 0) + revenue;
      return acc;
    }, {});

    // Convert map to sorted array
    const productSales = Object.entries(productSalesMap)
      .map(([productName, revenue]) => ({ productName, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10); // Limit to top 10

    res.json({
      totalSales,
      totalRevenue: parseFloat(totalRevenue).toFixed(2),
      salesByPeriod: salesByPeriod.map(s => ({
        period: s.getDataValue('period'),
        total: parseFloat(s.getDataValue('total') || 0).toFixed(2)
      })),
      productSales: productSales.map(p => ({
        productName: p.productName,
        revenue: parseFloat(p.revenue || 0).toFixed(2)
      })),
    });
  } catch (err) {
    console.error('Failed to fetch sales analytics:', err);
    res.status(500).json({ message: 'Error fetching sales analytics', error: err.message });
  }
};

// @desc    Get Overall Profit
// @route   GET /api/analytics/profit/overall
// @access  Private
const getOverallProfit = async (req, res) => {
  try {
    const profitItems = await SaleItem.findAll({
      attributes: [
        'quantity',         // Fetch quantity
        'priceAtSale',      // Fetch priceAtSale
      ],
      include: [{
        model: Product,
        as: 'product',      // FIX: Use 'product' (lowercase alias)
        attributes: ['costPrice'], // Fetch costPrice from Product model
        required: true
      }],
      raw: true, // Get raw data
    });

    // Calculate total profit in JavaScript
    const totalProfit = profitItems.reduce((sum, item) => {
      const quantity = item.quantity || 0;
      const priceAtSale = item.priceAtSale || 0;
      const costPrice = item['product.costPrice'] || 0; // FIX: Access aliased product costPrice as 'product.costPrice'
      return sum + (quantity * (priceAtSale - costPrice));
    }, 0);

    res.json({ totalProfit: parseFloat(totalProfit || 0).toFixed(2) }); 
  } catch (err) {
    console.error('Failed to fetch overall profit:', err);
    res.status(500).json({ message: 'Error fetching overall profit', error: err.message });
  }
};

// @desc    Get Profit by Product
// @route   GET /api/analytics/profit/by-product
// @access  Private
const getProfitByProduct = async (req, res) => {
  try {
    const profitByProductRaw = await SaleItem.findAll({
      attributes: [
        'quantity',
        'priceAtSale',
      ],
      include: [{
        model: Product,
        as: 'product',      // FIX: Use 'product' (lowercase alias)
        attributes: ['name', 'costPrice'], // Fetch name and costPrice
        required: true
      }],
      raw: true, // Get raw data
    });

    // Calculate profit per product in JavaScript
    const profitMap = profitByProductRaw.reduce((acc, item) => {
      const productName = item['product.name']; // FIX: Access aliased product name as 'product.name'
      const quantity = item.quantity || 0;
      const priceAtSale = item.priceAtSale || 0;
      const costPrice = item['product.costPrice'] || 0; // FIX: Access aliased product costPrice as 'product.costPrice'
      const profit = quantity * (priceAtSale - costPrice);
      acc[productName] = (acc[productName] || 0) + profit;
      return acc;
    }, {});

    // Convert map to sorted array (top 10)
    const profitByProduct = Object.entries(profitMap)
      .map(([productName, profit]) => ({ productName, profit }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 10);

    res.json({
      profitByProduct: profitByProduct.map(p => ({
        productName: p.productName,
        profit: parseFloat(p.profit || 0).toFixed(2)
      }))
    });
  } catch (err) {
    console.error('Failed to fetch profit by product:', err);
    res.status(500).json({ message: 'Error fetching profit by product', error: err.message });
  }
};

// @desc    Get Sales by Customer with Quantity
// @route   GET /api/analytics/sales/by-customer-quantity
// @access  Private
const getSalesByCustomerWithQuantity = async (req, res) => {
  try {
    const salesByCustomerRaw = await Sale.findAll({
      attributes: [
        'id', // Include Sale ID for potential grouping in JS if needed
        [sequelize.col('customer.name'), 'customerName'], // Customer name
      ],
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: [],
          required: false // Use required: false for left join, as customer might be null (walk-in)
        },
        {
          model: SaleItem,
          as: 'items', // FIX: Correct alias to 'items' (lowercase)
          attributes: ['quantity', 'priceAtSale'], // Ensure these are loaded for JS calculation
          required: true, 
          include: [{
            model: Product,
            as: 'product', // FIX: Use 'product' (lowercase alias)
            attributes: ['name'], // Fetch product name
            required: true
          }],
        },
      ],
      raw: true, // Get raw data
    });

    // Manually aggregate and map the results to correctly calculate totalRevenue and quantitySold
    const aggregatedSales = salesByCustomerRaw.reduce((acc, row) => {
        const customerName = row.customerName || 'Walk-in Customer';
        const productName = row['items.product.name']; // FIX: Access aliased product name from nested SaleItem
        const quantitySold = parseFloat(row.quantity || 0); // Use raw quantity from SaleItem
        const priceAtSale = parseFloat(row.priceAtSale || 0); // Use raw priceAtSale from SaleItem
        const totalRevenue = quantitySold * priceAtSale;

        // Create a unique key for each customer-product combination
        const key = `${customerName}-${productName}`;

        if (!acc[key]) {
            acc[key] = {
                customerName: customerName,
                productName: productName,
                quantitySold: 0,
                totalRevenue: 0
            };
        }
        acc[key].quantitySold += quantitySold;
        acc[key].totalRevenue += totalRevenue;
        return acc;
    }, {});

    const formattedSalesByCustomer = Object.values(aggregatedSales).map(s => ({
        ...s,
        totalRevenue: parseFloat(s.totalRevenue).toFixed(2),
        quantitySold: s.quantitySold // Quantity is already summed
    })).sort((a,b) => a.customerName.localeCompare(b.customerName) || b.quantitySold - a.quantitySold); // Re-sort if aggregation changes order


    res.json({ salesByCustomer: formattedSalesByCustomer });
  } catch (err) {
    console.error('Failed to fetch sales by customer with quantity:', err);
    res.status(500).json({ message: 'Error fetching sales by customer with quantity', error: err.message });
  }
};


// @desc    Get inventory valuation
// @route   GET /api/analytics/inventory-valuation
// @access  Private
const getInventoryValuation = async (req, res) => {
  try {
    // Assuming 'currentStock' and 'costPrice' exist on the Product model
    const totalValuation = await Product.sum(sequelize.literal('currentStock * costPrice'));
    const totalRetailValue = await Product.sum(sequelize.literal('currentStock * sellingPrice'));

    res.json({
      totalValuation: parseFloat(totalValuation || 0).toFixed(2),
      totalRetailValue: parseFloat(totalRetailValue || 0).toFixed(2),
    });
  } catch (err) {
    console.error('Failed to get inventory valuation:', err);
    res.status(500).json({ error: 'Failed to get inventory valuation', details: err.message });
  }
};

// @desc    Get monthly sales report (similar to sales analytics but specifically for monthly)
// @route   GET /api/analytics/monthly-sales-report
// @access  Private
const getMonthlySalesReport = async (req, res) => {
  try {
    const monthlySales = await Sale.findAll({
      attributes: [
        [sequelize.fn('strftime', '%Y-%m', sequelize.col('saleDate')), 'month'],
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalSales']
      ],
      group: ['month'],
      order: [['month', 'ASC']]
    });

    res.json({
      monthlySales: monthlySales.map(s => ({
        month: s.getDataValue('month'),
        totalSales: parseFloat(s.getDataValue('totalSales') || 0).toFixed(2)
      }))
    });
  } catch (err) {
    console.error('Failed to get monthly sales report:', err);
    res.status(500).json({ error: 'Failed to get monthly sales report', details: err.message });
  }
};


module.exports = {
  getSalesAnalytics,
  getOverallProfit,
  getProfitByProduct,
  getSalesByCustomerWithQuantity,
  getInventoryValuation,
  getMonthlySalesReport,
};