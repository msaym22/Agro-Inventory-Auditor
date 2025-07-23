const { Sale, Product, Customer, SaleItem } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

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
    const productSales = await SaleItem.findAll({
      attributes: [
        [sequelize.col('product.name'), 'productName'],
        [sequelize.fn('SUM', sequelize.literal('SaleItem.quantity * SaleItem.priceAtSale')), 'revenue']
      ],
      include: [{
        model: Product,
        as: 'product',
        attributes: []
      }],
      group: ['product.name'],
      order: [['revenue', 'DESC']],
      limit: 10
    });


    res.json({
      totalSales,
      totalRevenue,
      salesByPeriod,
      productSales,
    });
  } catch (err) {
    console.error('Failed to fetch sales analytics:', err);
    res.status(500).json({ error: 'Failed to fetch sales analytics', details: err.message });
  }
};

// NEW: Get Overall Profit
const getOverallProfit = async (req, res) => {
  try {
    // Profit = (sellingPrice - purchasePrice) * quantity
    const profitResult = await SaleItem.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.literal('SaleItem.quantity * (SaleItem.priceAtSale - product.purchasePrice)')), 'totalProfit']
      ],
      include: [{
        model: Product,
        as: 'product',
        attributes: []
      }],
      raw: true, // Get raw data without instance methods
    });

    const totalProfit = profitResult[0]?.totalProfit || 0;
    res.json({ totalProfit });
  } catch (err) {
    console.error('Failed to fetch overall profit:', err);
    res.status(500).json({ error: 'Failed to fetch overall profit', details: err.message });
  }
};

// NEW: Get Profit by Product
const getProfitByProduct = async (req, res) => {
  try {
    const profitByProduct = await SaleItem.findAll({
      attributes: [
        [sequelize.col('product.name'), 'productName'],
        [sequelize.fn('SUM', sequelize.literal('SaleItem.quantity * (SaleItem.priceAtSale - product.purchasePrice)')), 'profit']
      ],
      include: [{
        model: Product,
        as: 'product',
        attributes: []
      }],
      group: ['product.name'],
      order: [['profit', 'DESC']],
      limit: 10, // Top 10 most profitable products
    });

    res.json({ profitByProduct });
  } catch (err) {
    console.error('Failed to fetch profit by product:', err);
    res.status(500).json({ error: 'Failed to fetch profit by product', details: err.message });
  }
};

// NEW: Get Sales by Customer with Quantity
const getSalesByCustomerWithQuantity = async (req, res) => {
  try {
    const salesByCustomer = await Sale.findAll({
      attributes: [
        [sequelize.col('customer.name'), 'customerName'],
        [sequelize.col('saleItems.product.name'), 'productName'],
        [sequelize.fn('SUM', sequelize.col('saleItems.quantity')), 'quantitySold'],
        [sequelize.fn('SUM', sequelize.literal('saleItems.quantity * saleItems.priceAtSale')), 'totalRevenue']
      ],
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: [],
        },
        {
          model: SaleItem,
          as: 'saleItems',
          attributes: [],
          include: [{
            model: Product,
            as: 'product',
            attributes: [],
          }],
        },
      ],
      group: ['customer.name', 'saleItems.product.name'],
      order: [['customer.name', 'ASC'], ['quantitySold', 'DESC']],
      raw: true, // Get raw data
    });

    res.json({ salesByCustomer });
  } catch (err) {
    console.error('Failed to fetch sales by customer with quantity:', err);
    res.status(500).json({ error: 'Failed to fetch sales by customer with quantity', details: err.message });
  }
};


const getInventoryValuation = async (req, res) => {
  try {
    const totalValuation = await Product.sum(sequelize.literal('stock * purchasePrice'));
    const totalRetailValue = await Product.sum(sequelize.literal('stock * sellingPrice'));

    res.json({
      totalValuation: totalValuation || 0,
      totalRetailValue: totalRetailValue || 0,
    });
  } catch (err) {
    console.error('Failed to get inventory valuation:', err);
    res.status(500).json({ error: 'Failed to get inventory valuation', details: err.message });
  }
};

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

    res.json({ monthlySales });
  } catch (err) {
    console.error('Failed to get monthly sales report:', err);
    res.status(500).json({ error: 'Failed to get monthly sales report', details: err.message });
  }
};


module.exports = {
  getSalesAnalytics,
  getOverallProfit, // Export new function
  getProfitByProduct, // Export new function
  getSalesByCustomerWithQuantity, // Export new function
  getInventoryValuation,
  getMonthlySalesReport,
};