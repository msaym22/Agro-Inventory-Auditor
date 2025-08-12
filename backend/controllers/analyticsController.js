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
  }  catch (err) {
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
        attributes: ['id', 'name', 'purchasePrice'], // NEW: Include product ID
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

    const profitMap = new Map(); // Use Map for better key management with objects
    profitByProductRaw.forEach(item => {
      const productName = item['product.name'];
      const productId = item['product.id']; // NEW: Get product ID
      const quantity = item.quantity || 0;
      const priceAtSale = item.priceAtSale || 0;
      const purchasePrice = item['product.purchasePrice'] || 0;
      const profit = quantity * (priceAtSale - purchasePrice);

      const key = `${productId}-${productName}`; // Use ID in key for uniqueness

      if (!profitMap.has(key)) {
        profitMap.set(key, {
          productId: productId, // Store product ID
          productName: productName,
          profit: 0,
        });
      }
      profitMap.get(key).profit += profit;
    });

    const profitByProduct = Array.from(profitMap.values())
      .map(data => ({ // Map from data directly, not entries
        productId: data.productId, // Use stored product ID
        productName: data.productName,
        profit: parseFloat(data.profit || 0).toFixed(2)
      }))
      .sort((a, b) => parseFloat(b.profit) - parseFloat(a.profit))
      .slice(0, 10); // Limit to top 10 after sorting

    res.json({
      profitByProduct: profitByProduct
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
        'id', // Sale ID
        [sequelize.col('customer.id'), 'customerId'], // NEW: Include customer ID
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
          as: 'items',
          attributes: ['quantity', 'priceAtSale', 'productId'], // Include productId in SaleItem for linking
          required: true,
          include: [{
            model: Product,
            as: 'product',
            attributes: ['name'], // Fetch product name
            required: true
          }],
        },
      ],
      where: dateConditions, // Apply date filter to Sale
      raw: true,
      nest: true, // Crucial for properly nesting included data with raw: true
    });

    const aggregatedSales = new Map(); // Use Map for grouping
    salesByCustomerRaw.forEach(row => {
      const customerId = row.customerId; // Get customer ID
      const customerName = row.customerName || 'Walk-in Customer';
      const productName = row.items.product.name; // Access nested product name
      const quantitySold = parseFloat(row.items.quantity || 0); // Corrected access to nested quantity
      const priceAtSale = parseFloat(row.items.priceAtSale || 0); // Corrected access to nested priceAtSale
      const totalRevenue = quantitySold * priceAtSale;

      const key = customerId ? `${customerId}-${productName}` : `${customerName}-${productName}`; // Use customerId in key if available

      if (!aggregatedSales.has(key)) {
        aggregatedSales.set(key, {
          customerId: customerId, // Store customer ID
          customerName: customerName,
          productName: productName,
          quantitySold: 0,
          totalRevenue: 0
        });
      }
      aggregatedSales.get(key).quantitySold += quantitySold;
      aggregatedSales.get(key).totalRevenue += totalRevenue;
    });

    const formattedSalesByCustomer = Array.from(aggregatedSales.values())
      .map(s => ({
        ...s,
        totalRevenue: parseFloat(s.totalRevenue).toFixed(2),
        quantitySold: s.quantitySold // Quantity is already summed
      }))
      .sort((a, b) => parseFloat(b.totalRevenue) - parseFloat(a.totalRevenue)); // Sort by totalRevenue descending


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
        [sequelize.col('product.id'), 'productId'], // NEW: Include product ID
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
      group: ['product.id', 'product.name'], // Group by both ID and Name to ensure correct grouping
      order: [[sequelize.literal('totalQuantitySold'), 'DESC']], // Order by sum of quantity
      raw: true,
    });

    res.json({
      productsByQuantitySold: productsByQuantitySold.map(p => ({
        productId: p.productId, // Use fetched product ID
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
// @route   GET /api/analytics/customer-history/:customerId?customerName={name}&startDate={date}&endDate={date}
// @access  Private
const getCustomerHistory = async (req, res) => {
  const { customerId } = req.params; // Get customerId from URL parameter
  const { customerName: queryCustomerName, startDate, endDate } = req.query; // Get customerName from query, if provided

  const dateConditions = getDateRangeConditions(null, startDate, endDate);

  let customerWhere = {};
  let finalCustomerIdentifier = null; // To store the identifier used for fetching

  if (customerId && customerId !== 'null' && customerId !== 'undefined') { // Check for actual ID vs. 'null' string
    customerWhere.id = customerId;
    finalCustomerIdentifier = customerId;
  } else if (queryCustomerName) { // If ID not provided, try by name
    customerWhere.name = { [Op.like]: `%${queryCustomerName}%` }; // Use LIKE for name search
    finalCustomerIdentifier = queryCustomerName;
  } else { // Default to null for 'Walk-in Customer' if no specific identifier provided
    customerWhere.id = { [Op.is]: null };
    finalCustomerIdentifier = 'Walk-in Customer';
  }

  try {
    const rawSalesData = await Sale.findAll({ // Renamed to rawSalesData
      where: {
        ...dateConditions // Apply date filter to Sale
      },
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name'],
          where: customerWhere, // Apply customer filter
          required: false // Use LEFT OUTER JOIN for customer, so sales without customer are included
        },
        {
          model: SaleItem,
          as: 'items',
          attributes: ['id', 'quantity', 'priceAtSale'], // Fetch item ID, quantity, price
          required: false, // Make SaleItem optional to include sales with no items
          include: [{
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'purchasePrice', 'sellingPrice', 'nameUrdu'], // Product details
            required: false // Product also optional if SaleItem is optional
          }],
        },
      ],
      order: [['saleDate', 'DESC']],
      raw: true,
      nest: true, // Crucial for properly nesting included data
    });

    // Manually group raw data by Sale ID since raw:true + nest:true with multiple items per sale flattens them
    const salesMap = new Map();
    rawSalesData.forEach(row => {
      const saleId = row.id;
      // Initialize sale in map if not already present
      if (!salesMap.has(saleId)) {
        salesMap.set(saleId, {
          saleId: row.id,
          saleDate: row.saleDate,
          totalAmount: parseFloat(row.totalAmount || 0), // Use raw value, format at end
          paymentMethod: row.paymentMethod,
          paymentStatus: row.paymentStatus,
          customerName: row.customer?.name || 'Walk-in Customer', // Get customer name
          customerId: row.customer?.id || null, // Get customer ID
          items: [],
          profitFromSale: 0,
        });
      }

      const sale = salesMap.get(saleId);
      // Only process item if it exists (i.e., not a sale with no items if SaleItem was optional)
      if (row.items && row.items.quantity != null && row.items.priceAtSale != null) {
        const itemQuantity = parseFloat(row.items.quantity);
        const itemPriceAtSale = parseFloat(row.items.priceAtSale);
        const itemPurchasePrice = parseFloat(row.items.product?.purchasePrice || 0); // Handle missing product
        const itemProfit = itemQuantity * (itemPriceAtSale - itemPurchasePrice);

        sale.items.push({
          saleItemId: row.items.id, // ID of the sale item
          productId: row.items.product?.id, // ID of product
          productName: row.items.product?.name, // Name of product
          productNameUrdu: row.items.product?.nameUrdu,
          quantity: itemQuantity,
          unitPrice: itemPriceAtSale,
          itemProfit: itemProfit,
        });
        sale.profitFromSale += itemProfit;
      }
    });

    const formattedSalesHistory = Array.from(salesMap.values()).map(sale => ({
      ...sale,
      totalAmount: parseFloat(sale.totalAmount).toFixed(2), // Format totalAmount here
      profitFromSale: parseFloat(sale.profitFromSale).toFixed(2), // Format profit here
      items: sale.items.map(item => ({ // Format item prices and profits
        ...item,
        unitPrice: parseFloat(item.unitPrice).toFixed(2),
        itemProfit: parseFloat(item.itemProfit).toFixed(2),
      }))
    }));


    // Calculate overall totals from the grouped and formatted sales
    let totalProfitFromCustomer = formattedSalesHistory.reduce((sum, sale) => sum + parseFloat(sale.profitFromSale), 0);
    let totalSalesToCustomer = formattedSalesHistory.reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0);

    const finalCustomerDisplayName = formattedSalesHistory[0]?.customerName || finalCustomerIdentifier || 'N/A'; // Get name from first record, or fallback

    res.json({
      customerHistory: formattedSalesHistory, // This is the array of sales records
      totalProfitFromCustomer: parseFloat(totalProfitFromCustomer).toFixed(2),
      totalSalesToCustomer: parseFloat(totalSalesToCustomer).toFixed(2),
      customerName: finalCustomerDisplayName, // Corrected customer name
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
// @route   GET /api/analytics/product-history/:productId?productName={name}&startDate={date}&endDate={date}
// @access  Private
const getProductHistory = async (req, res) => {
  const { productId } = req.params; // Get productId from URL parameter
  const { productName: queryProductName, startDate, endDate } = req.query; // Get productName from query

  const dateConditions = getDateRangeConditions(null, startDate, endDate);

  let productWhere = {};
  let finalProductIdentifier = null;

  if (productId && productId !== 'null' && productId !== 'undefined') {
    productWhere.id = productId;
    finalProductIdentifier = productId;
  } else if (queryProductName) {
    productWhere.name = { [Op.like]: `%${queryProductName}%` }; // Use LIKE for name search
    finalProductIdentifier = queryProductName;
  } else {
    return res.status(400).json({ message: 'Product ID or Name is required.' });
  }

  try {
    const rawProductSalesData = await SaleItem.findAll({ // Renamed to rawProductSalesData
      attributes: ['quantity', 'priceAtSale'], // SaleItem attributes
      where: { // Filter SaleItems by product
        productId: productId || await Product.findOne({ where: productWhere, attributes: ['id'] }).then(p => p?.id), // Resolve ID if name provided
      },
      include: [
        {
          model: Sale,
          as: 'sale',
          attributes: ['id', 'saleDate', 'totalAmount', 'paymentMethod', 'paymentStatus'],
          where: dateConditions, // Apply date filter to associated Sale
          required: true,
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
          attributes: ['id', 'name', 'purchasePrice', 'sellingPrice'], // Product details
          where: productWhere, // Apply product filter for verification/name resolution
          required: true // Ensure product exists
        }
      ],
      order: [[{ model: Sale, as: 'sale' }, 'saleDate', 'DESC']],
      raw: true,
      nest: true, // Crucial for properly nesting included data
    });

    // If no sales found for the given product/name, return empty history
    if (rawProductSalesData.length === 0) {
      const actualProduct = await Product.findByPk(productId) || (queryProductName ? await Product.findOne({ where: { name: queryProductName } }) : null);
      const finalProductName = actualProduct ? actualProduct.name : (queryProductName || 'N/A');
      return res.json({
        productHistory: [],
        totalQuantitySold: 0,
        totalProfitFromProduct: '0.00',
        totalRevenueFromProduct: '0.00',
        productName: finalProductName, // Return the actual product name if found
      });
    }

    let totalQuantitySold = 0;
    let totalProfitFromProduct = 0;
    let totalRevenueFromProduct = 0;

    const formattedHistory = rawProductSalesData.map(item => { // Iterate over raw items directly
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
        customerId: item.sale.customer?.id || null, // Include customer ID
        quantitySold: quantity,
        unitPriceAtSale: parseFloat(priceAtSale).toFixed(2),
        itemRevenue: parseFloat(revenue).toFixed(2),
        itemProfit: parseFloat(profit).toFixed(2),
      };
    });

    const finalProductName = rawProductSalesData[0]?.product.name || finalProductIdentifier || 'N/A'; // Get the product name from the result

    res.json({
      productHistory: formattedHistory,
      totalQuantitySold: totalQuantitySold,
      totalProfitFromProduct: parseFloat(totalProfitFromProduct).toFixed(2),
      totalRevenueFromProduct: parseFloat(totalRevenueFromProduct).toFixed(2),
      productName: finalProductName, // Make sure product name is included
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
    const totalValuation = await Product.sum(sequelize.literal('stock * purchasePrice'));
    const totalRetailValue = await Product.sum(sequelize.literal('stock * sellingPrice'));

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
  getProductsByQuantitySold,
  getCustomerHistory,
  getProductHistory,
};