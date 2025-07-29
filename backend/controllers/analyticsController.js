// backend/controllers/analyticsController.js
const { Sale, Product, Customer, SaleItem } = require('../models');
const { sequelize } = require('../models'); // Import the sequelize instance
const { Op } = require('sequelize');
const moment = require('moment');

// Helper function to get date range based on period OR explicit start/end dates
const getDateRange = (period, customStartDate, customEndDate) => {
  let startDate = null;
  let endDate = null;

  if (customStartDate && customEndDate) {
    startDate = moment(customStartDate).startOf('day').toDate();
    endDate = moment(customEndDate).endOf('day').toDate();
  } else {
    switch (period) {
      case 'daily':
        startDate = moment().subtract(30, 'days').startOf('day').toDate();
        endDate = moment().endOf('day').toDate(); // End of current day
        break;
      case 'weekly':
        startDate = moment().subtract(12, 'weeks').startOf('week').toDate();
        endDate = moment().endOf('week').toDate(); // End of current week
        break;
      case 'monthly':
        startDate = moment().subtract(12, 'months').startOf('month').toDate();
        endDate = moment().endOf('month').toDate(); // End of current month
        break;
      case 'yearly':
        startDate = moment().subtract(5, 'years').startOf('year').toDate();
        endDate = moment().endOf('year').toDate(); // End of current year
        break;
      case 'all':
      default:
        // No specific date filter for 'all time' or invalid period
        break;
    }
  }
  return startDate && endDate ? { saleDate: { [Op.between]: [startDate, endDate] } } : {};
};


// @desc    Get overall sales analytics (total sales, total revenue, sales by period, product sales)
// @route   GET /api/analytics/sales?period={period}&startDate={date}&endDate={date}
// @access  Private
const getSalesAnalytics = async (req, res) => {
  const { period = 'all', startDate: reqStartDate, endDate: reqEndDate } = req.query;

  const dateWhereClause = getDateRange(period, reqStartDate, reqEndDate);

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
    case 'all':
    default:
      groupByFormat = '%Y-%m'; // Default to monthly grouping for 'all' or no period
      break;
  }

  try {
    const totalSales = await Sale.count({ where: dateWhereClause });
    const totalRevenueResult = await Sale.sum('totalAmount', { where: dateWhereClause });
    const totalRevenue = totalRevenueResult || 0;

    const salesByPeriod = await Sale.findAll({
      attributes: [
        [sequelize.fn('strftime', groupByFormat, sequelize.col('saleDate')), 'period'],
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'total']
      ],
      where: dateWhereClause,
      group: ['period'],
      order: [['period', 'ASC']]
    });

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
        where: dateWhereClause,
        required: true
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
      .sort((a, b) => b.revenue - a.revenue);

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
    console.error('Failed to fetch sales analytics:', err.stack);
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
  const { period, startDate: reqStartDate, endDate: reqEndDate } = req.query;
  const dateWhereClause = getDateRange(period, reqStartDate, reqEndDate);

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
        where: dateWhereClause,
        required: true
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
    console.error('Failed to fetch overall profit:', err.stack);
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
  const { period, startDate: reqStartDate, endDate: reqEndDate } = req.query;
  const dateWhereClause = getDateRange(period, reqStartDate, reqEndDate);

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
        where: dateWhereClause,
        required: true
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
      .sort((a, b) => b.profit - a.profit);

    res.json({
      profitByProduct: profitByProduct.map(p => ({
        productName: p.productName,
        profit: parseFloat(p.profit || 0).toFixed(2)
      }))
    });
  } catch (err) {
    console.error('Failed to fetch profit by product:', err.stack);
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
  const { period, startDate: reqStartDate, endDate: reqEndDate } = req.query;
  const dateWhereClause = getDateRange(period, reqStartDate, reqEndDate);

  try {
    const salesByCustomerRaw = await Sale.findAll({
      attributes: [
        'id', // Sale ID
        'saleDate', // Needed for filtering if customer name is not unique enough
        [sequelize.col('customer.name'), 'customerName'], // Customer name
      ],
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'contact', 'address'], // Include contact/address for customer detail
          required: false // Use LEFT OUTER JOIN for walk-in customers
        },
        {
          model: SaleItem,
          as: 'items',
          attributes: ['quantity', 'priceAtSale', 'productId'],
          required: true,
          include: [{
            model: Product,
            as: 'product',
            attributes: ['name'],
            required: true
          }],
        },
      ],
      where: dateWhereClause, // Apply date filter to Sales
      raw: true,
    });

    const aggregatedSales = salesByCustomerRaw.reduce((acc, row) => {
      const customerId = row['customer.id'] || 'walk-in'; // Use customerId for unique key
      const customerName = row.customerName || 'Walk-in Customer';
      const customerContact = row['customer.contact'] || 'N/A';
      const customerAddress = row['customer.address'] || 'N/A';
      const productName = row['items.product.name'];
      const saleItemId = row['items.id']; // Include sale item ID for history lookup

      const quantitySold = parseFloat(row['items.quantity'] || 0);
      const priceAtSale = parseFloat(row['items.priceAtSale'] || 0);
      const totalRevenue = quantitySold * priceAtSale;

      // Key by customerId and productName for aggregation
      const key = `${customerId}-${productName}`;

      if (!acc[key]) {
        acc[key] = {
          customerId: customerId,
          customerName: customerName,
          customerContact: customerContact,
          customerAddress: customerAddress,
          productName: productName,
          quantitySold: 0,
          totalRevenue: 0,
          saleItemIds: [] // To store relevant saleItem IDs for history
        };
      }
      acc[key].quantitySold += quantitySold;
      acc[key].totalRevenue += totalRevenue;
      acc[key].saleItemIds.push(saleItemId); // Collect sale item IDs
      return acc;
    }, {});

    const formattedSalesByCustomer = Object.values(aggregatedSales).map(s => ({
      customerId: s.customerId,
      customerName: s.customerName,
      customerContact: s.customerContact,
      customerAddress: s.customerAddress,
      productName: s.productName,
      quantitySold: s.quantitySold,
      totalRevenue: parseFloat(s.totalRevenue).toFixed(2),
      saleItemIds: s.saleItemIds // Include for drill-down
    })).sort((a,b) => b.totalRevenue - a.totalRevenue || a.customerName.localeCompare(b.customerName));

    res.json({ salesByCustomer: formattedSalesByCustomer });
  } catch (err) {
    console.error('Failed to fetch sales by customer with quantity:', err.stack);
    res.status(500).json({ 
      message: 'Error fetching sales by customer with quantity', 
      error: process.env.NODE_ENV === 'development' ? err.stack : err.message 
    });
  }
};

// @desc    Get Products by Quantity Sold
// @route   GET /api/analytics/products/by-quantity-sold?period={period}&startDate={date}&endDate={date}
// @access  Private
const getProductsByQuantitySold = async (req, res) => {
  const { period, startDate: reqStartDate, endDate: reqEndDate } = req.query;
  const dateWhereClause = getDateRange(period, reqStartDate, reqEndDate);

  try {
    const productsSoldRaw = await SaleItem.findAll({
      attributes: [
        'productId',
        [sequelize.fn('SUM', sequelize.col('SaleItem.quantity')), 'totalQuantitySold'],
      ],
      include: [{
        model: Product,
        as: 'product',
        attributes: ['name'],
        required: true
      }, {
        model: Sale, // Include Sale to filter by date
        as: 'sale',
        attributes: [],
        where: dateWhereClause,
        required: true
      }],
      group: ['productId', 'product.name'],
      order: [[sequelize.literal('totalQuantitySold'), 'DESC']],
      raw: true,
    });

    res.json({
      productsByQuantitySold: productsSoldRaw.map(p => ({
        productId: p.productId, // Include productId for drill-down
        productName: p.productName,
        totalQuantitySold: parseInt(p.totalQuantitySold, 10)
      }))
    });
  } catch (err) {
    console.error('Failed to fetch products by quantity sold:', err.stack);
    res.status(500).json({ 
      message: 'Error fetching products by quantity sold', 
      error: process.env.NODE_ENV === 'development' ? err.stack : err.message 
    });
  }
};


// NEW: @desc Get detailed sales history for a specific customer
// @route   GET /api/analytics/customers/:id/detail?startDate={date}&endDate={date}
// @access  Private
const getCustomerDetailAnalytics = async (req, res) => {
  const customerId = req.params.id;
  const { startDate: reqStartDate, endDate: reqEndDate } = req.query;
  const dateWhereClause = getDateRange('all', reqStartDate, reqEndDate); // Use 'all' if no period specified, and rely on custom dates

  try {
    const customer = await Customer.findByPk(customerId, {
      attributes: ['id', 'name', 'contact', 'address', 'creditLimit', 'outstandingBalance']
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found.' });
    }

    const salesHistory = await Sale.findAll({
      where: {
        customerId: customerId,
        ...dateWhereClause // Apply date filter to sales
      },
      attributes: ['id', 'saleDate', 'totalAmount', 'discount', 'paymentMethod', 'paymentStatus'],
      include: [
        {
          model: SaleItem,
          as: 'items',
          attributes: ['quantity', 'priceAtSale'],
          include: [{
            model: Product,
            as: 'product',
            attributes: ['name', 'purchasePrice'] // Include purchasePrice for profit calculation
          }],
          required: true
        }
      ],
      order: [['saleDate', 'DESC']],
      raw: true,
    });

    let totalCustomerProfit = 0;
    let totalCustomerSales = 0; // Renamed from totalCustomerRevenue to avoid confusion if revenue is gross

    const formattedSalesHistory = salesHistory.map(sale => {
        let saleProfit = 0;
        let saleRevenue = parseFloat(sale.totalAmount || 0);

        totalCustomerSales += saleRevenue;

        // Calculate profit for each item in the sale and sum up for total sale profit
        // Note: With raw:true, nested items data is flattened
        if (sale['items.quantity']) { // Check if there's at least one item
            const quantity = parseFloat(sale['items.quantity'] || 0);
            const priceAtSale = parseFloat(sale['items.priceAtSale'] || 0);
            const purchasePrice = parseFloat(sale['items.product.purchasePrice'] || 0);
            saleProfit += (quantity * (priceAtSale - purchasePrice));
        }

        totalCustomerProfit += saleProfit;

        return {
            saleId: sale.id,
            saleDate: sale.saleDate,
            totalAmount: parseFloat(sale.totalAmount).toFixed(2),
            profit: parseFloat(saleProfit).toFixed(2), // Profit for this specific sale
            itemsSummary: sale.items ? sale.items.map(item => ({ // Reconstruct item summary
                productName: item.product.name,
                quantity: item.quantity,
                unitPrice: item.priceAtSale
            })) : [],
            paymentMethod: sale.paymentMethod,
            paymentStatus: sale.paymentStatus
        };
    });


    res.json({
      customer: customer,
      totalCustomerSales: parseFloat(totalCustomerSales).toFixed(2),
      totalCustomerProfit: parseFloat(totalCustomerProfit).toFixed(2),
      salesHistory: formattedSalesHistory,
    });

  } catch (err) {
    console.error('Failed to fetch customer detail analytics:', err.stack);
    res.status(500).json({ 
      message: 'Error fetching customer detail analytics', 
      error: process.env.NODE_ENV === 'development' ? err.stack : err.message 
    });
  }
};

// NEW: @desc Get detailed sales history for a specific product
// @route   GET /api/analytics/products/:id/detail?startDate={date}&endDate={date}
// @access  Private
const getProductDetailAnalytics = async (req, res) => {
  const productId = req.params.id;
  const { startDate: reqStartDate, endDate: reqEndDate } = req.query;
  const dateWhereClause = getDateRange('all', reqStartDate, reqEndDate); // Use 'all' if no period specified, and rely on custom dates

  try {
    const product = await Product.findByPk(productId, {
      attributes: ['id', 'name', 'sku', 'sellingPrice', 'purchasePrice', 'stock']
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const salesHistoryRaw = await SaleItem.findAll({
      where: {
        productId: productId,
        // Apply date filter through Sale association
        '$sale.saleDate$': dateWhereClause.saleDate ? dateWhereClause.saleDate[Op.between] : undefined
      },
      attributes: ['id', 'quantity', 'priceAtSale', 'saleId'],
      include: [
        {
          model: Sale,
          as: 'sale',
          attributes: ['id', 'saleDate', 'totalAmount', 'discount', 'paymentStatus'],
          include: [{
            model: Customer,
            as: 'customer',
            attributes: ['name', 'contact'],
            required: false // For walk-in customers
          }],
          required: true
        }
      ],
      order: [['sale', 'saleDate', 'DESC']], // Order by sale date
      raw: true,
    });

    let totalProductProfit = 0;
    let totalProductRevenue = 0;
    let totalProductQuantitySold = 0;

    const formattedSalesHistory = salesHistoryRaw.map(item => {
        const quantity = parseFloat(item.quantity || 0);
        const priceAtSale = parseFloat(item.priceAtSale || 0);
        const purchasePrice = parseFloat(product.purchasePrice || 0); // Use product's purchasePrice

        const saleProfit = quantity * (priceAtSale - purchasePrice);
        const saleRevenue = quantity * priceAtSale;

        totalProductProfit += saleProfit;
        totalProductRevenue += saleRevenue;
        totalProductQuantitySold += quantity;

        return {
            saleItemId: item.id,
            saleId: item.saleId,
            saleDate: item['sale.saleDate'],
            customerName: item['sale.customer.name'] || 'Walk-in Customer',
            customerContact: item['sale.customer.contact'] || 'N/A',
            quantity: quantity,
            unitPriceAtSale: priceAtSale.toFixed(2),
            itemRevenue: saleRevenue.toFixed(2),
            itemProfit: saleProfit.toFixed(2),
            saleTotalAmount: parseFloat(item['sale.totalAmount']).toFixed(2), // Total amount of the whole sale
            saleDiscount: parseFloat(item['sale.discount']).toFixed(2),
            salePaymentStatus: item['sale.paymentStatus']
        };
    });

    res.json({
      product: product,
      totalProductQuantitySold: totalProductQuantitySold,
      totalProductRevenue: parseFloat(totalProductRevenue).toFixed(2),
      totalProductProfit: parseFloat(totalProductProfit).toFixed(2),
      salesHistory: formattedSalesHistory,
    });

  } catch (err) {
    console.error('Failed to fetch product detail analytics:', err.stack);
    res.status(500).json({ 
      message: 'Error fetching product detail analytics', 
      error: process.env.NODE_ENV === 'development' ? err.stack : err.message 
    });
  }
};


// @desc    Get inventory valuation (already corrected in previous steps)
// @route   GET /api/analytics/inventory-valuation
// @access  Private
const getInventoryValuation = async (req, res) => {
  try {
    const totalValuation = await Product.sum(sequelize.literal('stock * purchasePrice'));
    const totalRetailValue = await Product.sum(sequelize.literal('stock * sellingPrice'));

    res.json({
      totalValuation: parseFloat(totalValuation || 0).toFixed(2),
      totalRetailValue: parseFloat(totalRetailValue || 0).toFixed(2),
    });
  } catch (err) {
    console.error('Failed to get inventory valuation:', err.stack);
    res.status(500).json({ 
      error: 'Failed to get inventory valuation', 
      details: process.env.NODE_ENV === 'development' ? err.stack : err.message 
    });
  }
};

// @desc    Get monthly sales report (largely redundant, but kept if used elsewhere)
// @route   GET /api/analytics/monthly-sales-report
// @access  Private
const getMonthlySalesReport = async (req, res) => {
  const { period = 'monthly', startDate: reqStartDate, endDate: reqEndDate } = req.query; // Accept period
  const dateWhereClause = getDateRange(period, reqStartDate, reqEndDate);

  try {
    const monthlySales = await Sale.findAll({
      attributes: [
        [sequelize.fn('strftime', '%Y-%m', sequelize.col('saleDate')), 'month'],
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalSales']
      ],
      where: dateWhereClause, // Apply date filter
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
    console.error('Failed to get monthly sales report:', err.stack);
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
  getProductsByQuantitySold, // New export
  getCustomerDetailAnalytics, // New export
  getProductDetailAnalytics,  // New export
  getInventoryValuation,
  getMonthlySalesReport,
};