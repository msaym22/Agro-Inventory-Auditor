const { Sale, Product, Customer, SaleItem } = require('../models'); // Ensure all necessary models are imported
const { Op } = require('sequelize');
// REMOVE THIS LINE: const upload = require('../middleware/upload'); // No longer needed here
const moment = require('moment'); // Assuming moment is used for date handling

const recordSale = async (req, res) => {
  try {
    // Multer middleware (uploadMiddleware.single('receiptImage')) from saleRoutes.js
    // has already run by the time this function is executed.
    // Therefore, req.body and req.file (if a file was uploaded) are already available.

    const saleData = req.body; // req.body now contains fields like 'saleData' (JSON string) and others.

    // If a file was uploaded by multer, its info is in req.file
    if (req.file) {
      saleData.receiptImage = req.file.path; // Set the path from the uploaded file
    } else {
      saleData.receiptImage = null; // Ensure it's null if no file was uploaded
    }

    // Parse saleData if it comes as a JSON string (common with FormData)
    // The 'saleData' key holds the JSON string of the sale details.
    let parsedSaleData;
    if (typeof saleData.saleData === 'string') {
      try {
        parsedSaleData = JSON.parse(saleData.saleData);
      } catch (parseError) {
        console.error('Failed to parse sale data JSON:', parseError);
        return res.status(400).json({ error: 'Invalid sale data format' });
      }
    } else {
      // If saleData is not a string, assume it's already parsed (e.g., if application/json was used for testing)
      parsedSaleData = saleData;
    }


    const { customerId, items, discount = 0, paymentMethod, paymentStatus, notes, totalAmount } = parsedSaleData; // Use parsedSaleData

    // Validate customer existence
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Validate products and prepare sale items
    const productIds = items.map(item => item.productId);
    const products = await Product.findAll({ where: { id: productIds } });

    if (products.length !== items.length) {
      return res.status(400).json({ error: 'One or more product IDs are invalid or not found' });
    }

    const saleItemsToCreate = [];
    let calculatedTotalAmount = 0; // Recalculate total on backend for security/integrity

    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        return res.status(400).json({ error: `Product with ID ${item.productId} not found` });
      }

      if (item.quantity > product.stock) {
        return res.status(400).json({
          error: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`
        });
      }

      const itemPrice = product.sellingPrice; // Use selling price from product
      calculatedTotalAmount += itemPrice * item.quantity;
      saleItemsToCreate.push({
        productId: item.productId,
        quantity: item.quantity,
        priceAtSale: itemPrice, // Record the price at the time of sale
      });
    }

    calculatedTotalAmount -= discount; // Apply discount

    // Create the sale record
    const sale = await Sale.create({
      customerId,
      saleDate: new Date(), // Use current date for saleDate
      totalAmount: calculatedTotalAmount, // Use backend calculated total
      discount,
      paymentMethod,
      paymentStatus,
      notes: notes || '', // Ensure notes is not undefined
      receiptImage: saleData.receiptImage // Store receipt image path
    });

    // Link sale items to the newly created sale
    const finalSaleItems = saleItemsToCreate.map(item => ({
      ...item,
      saleId: sale.id
    }));
    await SaleItem.bulkCreate(finalSaleItems);

    // Update product stock
    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      product.stock -= item.quantity;
      await product.save();
    }

    // Update customer outstanding balance if payment is credit and not paid
    if (paymentMethod === 'credit' && paymentStatus !== 'paid') {
      customer.outstandingBalance = (customer.outstandingBalance || 0) + calculatedTotalAmount;
      await customer.save();
    }

    // Fetch the created sale with its associations for the response
    const createdSale = await Sale.findByPk(sale.id, {
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'contact', 'address', 'outstandingBalance'] }, // Changed 'phone' to 'contact'
        { model: SaleItem, as: 'items', include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'sellingPrice'] }] }
      ]
    });

    res.status(201).json(createdSale);

  } catch (err) {
    console.error('Sale recording failed:', err);
    res.status(500).json({ error: 'Sale recording failed', details: err.message });
  }
};

const getSales = async (req, res) => {
  const { search, customerId, startDate, endDate, page = 1, limit = 20 } = req.query;

  const where = {};
  const customerWhere = {};

  if (search) {
    // Search by sale ID (if numeric) or customer name
    if (!isNaN(search) && parseInt(search).toString() === search) { // Check if search is a valid integer ID
      where.id = parseInt(search);
    } else {
      customerWhere.name = { [Op.iLike]: `%${search}%` };
    }
  }

  if (customerId) {
    where.customerId = customerId;
  }

  if (startDate && endDate) {
    where.saleDate = {
      [Op.between]: [
        moment(startDate).startOf('day').toDate(),
        moment(endDate).startOf('day').toDate() // Should be endOf('day') if you want to include the end date
      ]
    };
  } else if (startDate) {
    where.saleDate = { [Op.gte]: moment(startDate).startOf('day').toDate() };
  } else if (endDate) {
    where.saleDate = { [Op.lte]: moment(endDate).endOf('day').toDate() };
  }

  try {
    const offset = (page - 1) * limit;

    const { count, rows } = await Sale.findAndCountAll({
      where,
      order: [['saleDate', 'DESC']],
      limit: parseInt(limit),
      offset: offset,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name'],
          // Apply customer search filter only if customerWhere is not empty
          where: Object.keys(customerWhere).length > 0 ? customerWhere : undefined,
          required: Object.keys(customerWhere).length > 0 // Make customer include required if filtering by customer name
        },
        {
          model: SaleItem,
          as: 'items',
          attributes: ['quantity', 'priceAtSale'],
          include: [{ model: Product, as: 'product', attributes: ['id', 'name'] }]
        }
      ]
    });

    const totalPages = Math.ceil(count / limit);

    // CORRECTED: Ensure the response structure matches frontend expectation
    res.json({
      sales: rows, // Array of sale objects
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (err) {
    console.error('Failed to fetch sales:', err);
    res.status(500).json({ error: 'Failed to fetch sales', details: err.message });
  }
};

const getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findByPk(req.params.id, {
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'phone', 'address', 'outstandingBalance'] },
        {
          model: SaleItem,
          as: 'items',
          attributes: ['quantity', 'priceAtSale'],
          include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'sellingPrice'] }]
        }
      ]
    });

    if (sale) {
      res.json(sale);
    } else {
      res.status(404).json({ error: 'Sale not found' });
    }
  } catch (err) {
    console.error('Server error fetching sale by ID:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

const updateSale = async (req, res) => {
  try {
    const { items, ...saleData } = req.body;

    const [updated] = await Sale.update(saleData, {
      where: { id: req.params.id }
    });

    if (updated) {
      const updatedSale = await Sale.findByPk(req.params.id, {
        include: [
          { model: Customer, as: 'customer', attributes: ['id', 'name'] },
          { model: SaleItem, as: 'items', include: [{ model: Product, as: 'product', attributes: ['id', 'name'] }] }
        ]
      });
      res.json(updatedSale);
    } else {
      res.status(404).json({ error: 'Sale not found' });
    }
  } catch (err) {
    console.error('Sale update failed:', err);
    res.status(500).json({ error: 'Update failed', details: err.message });
  }
};

const deleteSale = async (req, res) => {
  try {
    const deleted = await Sale.destroy({
      where: { id: req.params.id }
    });

    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Sale not found' });
    }
  } catch (err) {
    console.error('Sale deletion failed:', err);
    res.status(500).json({ error: 'Deletion failed', details: err.message });
  }
};

const generateInvoice = async (req, res) => {
  try {
    const sale = await Sale.findByPk(req.params.id, {
      include: [
        { model: Customer, as: 'customer' },
        {
          model: SaleItem,
          as: 'items',
          include: [{ model: Product, as: 'product' }]
        }
      ]
    });

    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    const invoiceData = {
      invoiceId: `INV-${sale.id}`,
      date: sale.saleDate,
      customerName: sale.customer ? sale.customer.name : 'Walk-in Customer',
      customerPhone: sale.customer ? sale.customer.phone : 'N/A',
      customerAddress: sale.customer ? sale.customer.address : 'N/A',
      items: sale.items.map(item => ({
        productName: item.product ? item.product.name : 'Unknown Product',
        quantity: item.quantity,
        unitPrice: item.priceAtSale,
        total: item.quantity * item.priceAtSale
      })),
      subTotal: sale.totalAmount,
      discount: sale.discount || 0,
      grandTotal: sale.totalAmount,
      paymentStatus: sale.paymentStatus,
      paymentMethod: sale.paymentMethod,
      notes: sale.notes || 'Thank you for your business!',
      companyName: 'Almadina Agro Vehari',
      companyAddress: 'Vehari, Pakistan',
      companyPhone: '+92 3XX XXXXXXX',
    };

    res.json(invoiceData);

  } catch (err) {
    console.error('Invoice generation failed:', err);
    res.status(500).json({ error: 'Invoice generation failed', details: err.message });
  }
};


module.exports = {
  recordSale,
  getSales,
  getSaleById,
  updateSale,
  deleteSale,
  generateInvoice,
};