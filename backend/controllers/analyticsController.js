// msaym22/almadina-agro/Almadina-Agro-abd29d75b3664b7b4eb5cb4c7bcae0d6f2c03885/backend/controllers/analyticsController.js
const { Sale, Product, Customer, SaleItem } = require('../models');
const { sequelize } = require('../models'); // Import the sequelize instance
const { Op } = require('sequelize');
const moment = require('moment');

// Helper to construct date conditions
const getDateRangeConditions = (period, startDate, endDate) => {
  let whereCondition = {};
  if (startDate && endDate) {
    whereCondition = {
      saleDate: {
        [Op.between]: [
          moment(startDate).startOf('day').toDate(),
          moment(endDate).endOf('day').toDate()
        ]
      }
    };
  } else if (period && period !== 'all') {
    let dateFilter;
    switch (period) {
      case 'daily':
        dateFilter = moment().subtract(30, 'days').toDate();
        break;
      case 'weekly':
        dateFilter = moment().subtract(12, 'weeks').toDate();
        break;
      case 'monthly':
        dateFilter = moment().subtract(12, 'months').toDate();
        break;
      case 'yearly':
        dateFilter = moment().subtract(5, 'years').toDate();
        break;
      default:
        dateFilter = moment().subtract(12, 'months').toDate(); // Default for fallthrough
    }
    whereCondition = {
      saleDate: {
        [Op.gte]: dateFilter
      }
    };
  }
  return whereCondition;
};

// @desc    Get overall sales analytics (total sales, total revenue, sales by period, product sales)
// @route   GET /api/analytics/sales?period={period}&startDate={date}&endDate={date}
// @access  Private
const getSalesAnalytics = async (req, res) => {
  const { period = 'monthly', startDate, endDate } = req.query; // 'daily', 'weekly', 'monthly', 'yearly', 'all'

  let groupByFormat;
  switch (period) {
    case 'daily':
      groupByFormat = '%Y-%m-%d';
      break;
    case 'weekly':
      groupByFormat = '%Y-%W';
      break;
    case 'monthly':
      groupByFormat = '%Y-%m';
      break;
    case 'yearly':
      groupByFormat = '%Y';
      break;
    default:
      groupByFormat = '%Y-%m';
  }

  const dateConditions = getDateRangeConditions(period, startDate, endDate);

  try {
    const totalSales = await Sale.count({ where: dateConditions });
    const totalRevenueResult = await Sale.sum('totalAmount', { where: dateConditions });
    const totalRevenue = totalRevenueResult || 0;

    const salesByPeriod = await Sale.findAll({
      attributes: [
        [sequelize.fn('strftime', groupByFormat, sequelize.col('saleDate')), 'period'],
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'total']
      ],
      where: dateConditions,
      group: ['period'],
      order: [['period', 'ASC']]
    });

    // Fetch product sales performance (top products by revenue)
    const productSalesRaw = await SaleItem.findAll({
      attributes: [
        'quantity',
        'priceAtSale',
      ],
      include: [{
        model: Product,
        as: 'product',
        attributes: ['name'],
        required: true
      }, {
        model: Sale,
        as: 'sale',
        attributes: [],
        required: true,
        where: dateConditions // Apply date filter to associated Sale
      }],
      raw: true,
    });

    const productSalesMap = productSalesRaw.reduce((acc, item) => {
      const productName = item['product.name'];
      const revenue = (item.quantity || 0) * (item.priceAtSale || 0);
      acc[productName] = (acc[productName] || 0) + revenue;
      return acc;
    }, {});

    const productSales = Object.entries(productSalesMap)
      .map(([productName, revenue]) => ({ productName, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

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
    res.status(500).json({
      message: 'Error fetching sales analytics',
      error: process.env.NODE_ENV === 'development' ? err.stack : err.message
    });
  }
};

// @desc    Get Overall Profit
// @route   GET /api/analytics/profit/overall?period={period}&startDate={date}&endDate={date}
// @access  Private
const getOverallProfit = async (req, res) => {
  const { period, startDate, endDate } = req.query;
  const dateConditions = getDateRangeConditions(period, startDate, endDate);

  try {
    const profitItems = await SaleItem.findAll({
      attributes: [
        'quantity',
        'priceAtSale',
      ],
      include: [{
        model: Product,
        as: 'product',
        attributes: ['purchasePrice'],
        required: true
      }, {
        model: Sale,
        as: 'sale',
        attributes: [],
        required: true,
        where: dateConditions // Apply date filter to associated Sale
      }],
      raw: true,
    });

    const totalProfit = profitItems.reduce((sum, item) => {
      const quantity = item.quantity || 0;
      const priceAtSale = item.priceAtSale || 0;
      const purchasePrice = item['product.purchasePrice'] || 0;
      return sum + (quantity * (priceAtSale - purchasePrice));
    }, 0);

    res.json({ totalProfit: parseFloat(totalProfit || 0).toFixed(2) });
  } catch (err) {
    console.error('Failed to fetch overall profit:', err);
    res.status(500).json({
      message: 'Error fetching overall profit',
      error: process.env.NODE_ENV === 'development' ? err.stack : err.message
    });
  }
};

// @desc    Get Profit by Product
// @route   GET /api/analytics/profit/by-product?period={period}&startDate={date}&endDate={date}
// @access  Private
const getProfitByProduct = async (req, res) => {
  const { period, startDate, endDate } = req.query;
  const dateConditions = getDateRangeConditions(period, startDate, endDate);

  try {
    const profitByProductRaw = await SaleItem.findAll({
      attributes: [
        'quantity',
        'priceAtSale',
      ],
      include: [{
        model: Product,
        as: 'product',
        attributes: ['name', 'purchasePrice'],
        required: true
      }, {
        model: Sale,
        as: 'sale',
        attributes: [],
        required: true,
        where: dateConditions // Apply date filter to associated Sale
      }],
      raw: true,
    });

    const profitMap = profitByProductRaw.reduce((acc, item) => {
      const productName = item['product.name'];
      const quantity = item.quantity || 0;
      const priceAtSale = item.priceAtSale || 0;
      const purchasePrice = item['product.purchasePrice'] || 0;
      const profit = quantity * (priceAtSale - purchasePrice);
      acc[productName] = (acc[productName] || 0) + profit;
      return acc;
    }, {});

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
    res.status(500).json({
      message: 'Error fetching profit by product',
      error: process.env.NODE_ENV === 'development' ? err.stack : err.message
    });
  }
};

// @desc    Get Sales by Customer with Quantity
// @route   GET /api/analytics/sales/by-customer-quantity?period={period}&startDate={date}&endDate={date}
// @access  Private
const getSalesByCustomerWithQuantity = async (req, res) => {
  const { period, startDate, endDate } = req.query;
  const dateConditions = getDateRangeConditions(period, startDate, endDate);

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
          as: 'items', // Already lowercase 'items', which is correct
          attributes: ['quantity', 'priceAtSale'], // Ensure these are loaded for JS calculation
          required: true,
          include: [{
            model: Product,
            as: 'product', // Already lowercase 'product', which is correct
            attributes: ['name'], // Fetch product name
            required: true
          }],
        },
      ],
      where: dateConditions, // Apply date filter to Sale
      raw: true, // Get raw data
    });

    // Manually aggregate and map the results to correctly calculate totalRevenue and quantitySold
    const aggregatedSales = salesByCustomerRaw.reduce((acc, row) => {
        const customerName = row.customerName || 'Walk-in Customer';
        const productName = row['items.product.name']; // Correctly accessing aliased product name from nested SaleItem
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
    res.status(500).json({
      message: 'Error fetching sales by customer with quantity',
      error: process.env.NODE_ENV === 'development' ? err.stack : err.message
    });
  }
};

// @desc    Get Top Products by Quantity Sold
// @route   GET /api/analytics/products/quantity-sold?period={period}&startDate={date}&endDate={date}
// @access  Private
const getProductsByQuantitySold = async (req, res) => {
  const { period, startDate, endDate } = req.query; // Accept period or date range

  const dateConditions = getDateRangeConditions(period, startDate, endDate);

  try {
    const productsByQuantitySold = await SaleItem.findAll({
      attributes: [
        [sequelize.col('product.name'), 'productName'],
        [sequelize.fn('SUM', sequelize.col('SaleItem.quantity')), 'totalQuantitySold'],
      ],
      include: [
        {
          model: Product,
          as: 'product',
          attributes: [],
          required: true // INNER JOIN to ensure only products that exist are considered
        },
        {
          model: Sale,
          as: 'sale',
          attributes: [],
          required: true, // INNER JOIN to filter by saleDate
          where: dateConditions
        }
      ],
      group: ['product.name'],
      order: [[sequelize.literal('totalQuantitySold'), 'DESC']], // Order by sum of quantity
      raw: true,
    });

    res.json({
      productsByQuantitySold: productsByQuantitySold.map(p => ({
        productName: p.productName,
        totalQuantitySold: parseInt(p.totalQuantitySold || 0)
      }))
    });
  } catch (err) {
    console.error('Failed to fetch products by quantity sold:', err);
    res.status(500).json({
      message: 'Error fetching products by quantity sold',
      error: process.env.NODE_ENV === 'development' ? err.stack : err.message
    });
  }
};


// @desc    Get Detailed Sales History for a specific Customer
// @route   GET /api/analytics/customer-history/:customerId?startDate={date}&endDate={date}
// @access  Private
const getCustomerHistory = async (req, res) => {
  const { customerId } = req.params;
  const { startDate, endDate } = req.query;

  const dateConditions = getDateRangeConditions(null, startDate, endDate); // Use direct dates

  try {
    const customerSales = await Sale.findAll({
      where: {
        customerId,
        ...dateConditions // Apply date filter
      },
      include: [
        {
          model: SaleItem,
          as: 'items',
          attributes: ['quantity', 'priceAtSale'],
          include: [{
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'purchasePrice', 'sellingPrice', 'nameUrdu'],
          }],
        },
      ],
      order: [['saleDate', 'DESC']],
      raw: true,
      nest: true, // Crucial for properly nesting included data with raw: true
    });

    let totalProfitFromCustomer = 0;
    let totalSalesToCustomer = 0;
    const formattedHistory = customerSales.map(sale => {
      let saleProfit = 0;
      let saleRevenue = parseFloat(sale.totalAmount || 0);

      sale.items.forEach(item => {
        const quantity = item.quantity || 0;
        const priceAtSale = item.priceAtSale || 0;
        const purchasePrice = item.product.purchasePrice || 0;
        saleProfit += quantity * (priceAtSale - purchasePrice);
      });

      totalProfitFromCustomer += saleProfit;
      totalSalesToCustomer += saleRevenue;

      return {
        saleId: sale.id,
        saleDate: sale.saleDate,
        totalAmount: parseFloat(sale.totalAmount || 0).toFixed(2),
        paymentMethod: sale.paymentMethod,
        paymentStatus: sale.paymentStatus,
        items: sale.items.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          productNameUrdu: item.product.nameUrdu,
          quantity: item.quantity,
          unitPrice: parseFloat(item.priceAtSale || 0).toFixed(2),
          itemProfit: parseFloat((item.quantity || 0) * ((item.priceAtSale || 0) - (item.product.purchasePrice || 0))).toFixed(2),
        })),
        profitFromSale: parseFloat(saleProfit).toFixed(2),
      };
    });

    res.json({
      customerHistory: formattedHistory,
      totalProfitFromCustomer: parseFloat(totalProfitFromCustomer).toFixed(2),
      totalSalesToCustomer: parseFloat(totalSalesToCustomer).toFixed(2),
    });
  } catch (err) {
    console.error('Failed to fetch customer history:', err);
    res.status(500).json({
      message: 'Error fetching customer history',
      error: process.env.NODE_ENV === 'development' ? err.stack : err.message
    });
  }
};

// @desc    Get Detailed Sales History for a specific Product
// @route   GET /api/analytics/product-history/:productId?startDate={date}&endDate={date}
// @access  Private
const getProductHistory = async (req, res) => {
  const { productId } = req.params;
  const { startDate, endDate } = req.query;

  const dateConditions = getDateRangeConditions(null, startDate, endDate); // Use direct dates

  try {
    const productSales = await SaleItem.findAll({
      where: { productId },
      include: [
        {
          model: Sale,
          as: 'sale',
          attributes: ['id', 'saleDate', 'totalAmount', 'paymentMethod', 'paymentStatus'],
          where: dateConditions, // Apply date filter to associated Sale
          include: [{
            model: Customer,
            as: 'customer',
            attributes: ['id', 'name'],
            required: false // Customer can be null (walk-in)
          }]
        },
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'purchasePrice', 'sellingPrice'],
          required: true // Ensure product exists
        }
      ],
      order: [[{ model: Sale, as: 'sale' }, 'saleDate', 'DESC']],
      raw: true,
      nest: true, // Crucial for properly nesting included data with raw: true
    });

    let totalQuantitySold = 0;
    let totalProfitFromProduct = 0;
    let totalRevenueFromProduct = 0;

    const formattedHistory = productSales.map(item => {
      const quantity = item.quantity || 0;
      const priceAtSale = item.priceAtSale || 0;
      const purchasePrice = item.product.purchasePrice || 0;
      const revenue = quantity * priceAtSale;
      const profit = quantity * (priceAtSale - purchasePrice);

      totalQuantitySold += quantity;
      totalProfitFromProduct += profit;
      totalRevenueFromProduct += revenue;

      return {
        saleId: item.sale.id,
        saleDate: item.sale.saleDate,
        customerName: item.sale.customer ? item.sale.customer.name : 'Walk-in Customer',
        quantitySold: quantity,
        unitPriceAtSale: parseFloat(priceAtSale).toFixed(2),
        itemRevenue: parseFloat(revenue).toFixed(2),
        itemProfit: parseFloat(profit).toFixed(2),
      };
    });

    res.json({
      productHistory: formattedHistory,
      totalQuantitySold: totalQuantitySold,
      totalProfitFromProduct: parseFloat(totalProfitFromProduct).toFixed(2),
      totalRevenueFromProduct: parseFloat(totalRevenueFromProduct).toFixed(2),
    });
  } catch (err) {
    console.error('Failed to fetch product history:', err);
    res.status(500).json({
      message: 'Error fetching product history',
      error: process.env.NODE_ENV === 'development' ? err.stack : err.message
    });
  }
};


// @desc    Get inventory valuation
// @route   GET /api/analytics/inventory-valuation
// @access  Private
const getInventoryValuation = async (req, res) => {
  try {
    // Assuming 'currentStock' and 'purchasePrice' exist on the Product model
    // FIX: Changed costPrice to purchasePrice based on product.js
    const totalValuation = await Product.sum(sequelize.literal('stock * purchasePrice')); // FIX: Changed currentStock to stock, costPrice to purchasePrice
    const totalRetailValue = await Product.sum(sequelize.literal('stock * sellingPrice')); // FIX: Changed currentStock to stock

    res.json({
      totalValuation: parseFloat(totalValuation || 0).toFixed(2),
      totalRetailValue: parseFloat(totalRetailValue || 0).toFixed(2),
    });
  } catch (err) {
    console.error('Failed to get inventory valuation:', err);
    res.status(500).json({
      error: 'Failed to get inventory valuation',
      details: process.env.NODE_ENV === 'development' ? err.stack : err.message
    });
  }
};

// @desc    Get monthly sales report (similar to sales analytics but specifically for monthly)
// @route   GET /api/analytics/monthly-sales-report
// @access  Private
const getMonthlySalesReport = async (req, res) => {
  // This endpoint might become redundant if getSalesAnalytics is fully flexible with periods
  // Keeping it for now but consider deprecating if getSalesAnalytics handles all needs.
  const { startDate, endDate } = req.query;
  const dateConditions = getDateRangeConditions('monthly', startDate, endDate); // Force monthly grouping for this report

  try {
    const monthlySales = await Sale.findAll({
      attributes: [
        [sequelize.fn('strftime', '%Y-%m', sequelize.col('saleDate')), 'month'],
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalSales']
      ],
      where: dateConditions,
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
    res.status(500).json({
      error: 'Failed to get monthly sales report',
      details: process.env.NODE_ENV === 'development' ? err.stack : err.message
    });
  }
};


module.exports = {
  getSalesAnalytics,
  getOverallProfit,
  getProfitByProduct,
  getSalesByCustomerWithQuantity,
  getInventoryValuation,
  getMonthlySalesReport,
  getProductsByQuantitySold, // EXPORT THE NEW FUNCTION
  getCustomerHistory, // EXPORT THE NEW FUNCTION
  getProductHistory, // EXPORT THE NEW FUNCTION
};