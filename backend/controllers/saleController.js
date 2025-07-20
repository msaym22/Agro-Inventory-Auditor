// backend/controllers/saleController.js
const { Sale, Product, Customer, SaleItem } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

const recordSale = async (req, res) => {
  try {
    console.log('Attempting to create sale...'); // Added log
    const saleData = req.body;

    if (req.file) {
      saleData.receiptImage = req.file.path;
    } else {
      saleData.receiptImage = null;
    }

    let parsedSaleData;
    if (typeof saleData.saleData === 'string') {
      try {
        parsedSaleData = JSON.parse(saleData.saleData);
      } catch (parseError) {
        console.error('Failed to parse sale data JSON:', parseError);
        return res.status(400).json({ error: 'Invalid sale data format' });
      }
    } else {
      parsedSaleData = saleData;
    }

    const { customerId, items, discount, paymentMethod, paymentStatus, notes } = parsedSaleData; // Get raw discount

    // Validate customer existence
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Validate products and prepare sale items
    const productIds = items.map(item => item.productId);
    const products = await Product.findAll({ where: { id: productIds } });

    if (products.length !== items.length) {
      const foundProductIds = new Set(products.map(p => p.id));
      const missingProductIds = productIds.filter(id => !foundProductIds.has(id));
      return res.status(400).json({ error: `One or more product IDs are invalid or not found: ${missingProductIds.join(', ')}` });
    }

    const saleItemsToCreate = [];
    let calculatedTotalAmount = 0; // Recalculate total on backend for security/integrity

    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      
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
        priceAtSale: itemPrice,
      });
    }

    // CRITICAL FIX: Ensure discount is a valid number (default to 0 if NaN/null/undefined)
    const actualDiscount = isNaN(parseFloat(discount)) ? 0 : parseFloat(discount);
    calculatedTotalAmount -= actualDiscount; // Apply discount

    // Create the sale record
    const sale = await Sale.create({
      customerId,
      saleDate: new Date(),
      totalAmount: calculatedTotalAmount,
      discount: actualDiscount, // Store the correctly parsed discount
      paymentMethod,
      paymentStatus,
      notes: notes || '',
      receiptImage: saleData.receiptImage
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
      const customer = await Customer.findByPk(customerId); // Re-fetch customer to ensure latest state
      if (customer) {
        customer.outstandingBalance = (customer.outstandingBalance || 0) + calculatedTotalAmount;
        await customer.save();
      }
    }

    // Fetch the created sale with its associations for the response
    const createdSale = await Sale.findByPk(sale.id, {
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'contact', 'address', 'outstandingBalance'] },
        { model: SaleItem, as: 'items', include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'sellingPrice'] }] }
      ]
    });

    console.log('Sale recorded successfully:', createdSale.id); // Added log
    res.status(201).json(createdSale);

  } catch (err) {
    console.error('Error recording sale:', err); // This log should now contain the detailed error
    res.status(500).json({ error: 'Failed to record sale', details: err.message });
  }
};

const getSales = async (req, res) => {
  const { search, customerId, startDate, endDate, paymentStatus, page = 1, limit = 20 } = req.query; // Added paymentStatus
  const where = {};
  const customerWhere = {};

  if (search) {
    if (!isNaN(search) && parseInt(search).toString() === search) {
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
      [Op.between]: [moment(startDate).startOf('day').toDate(), moment(endDate).endOf('day').toDate()]
    };
  } else if (startDate) {
    where.saleDate = { [Op.gte]: moment(startDate).startOf('day').toDate() };
  } else if (endDate) {
    where.saleDate = { [Op.lte]: moment(endDate).endOf('day').toDate() };
  }

  if (paymentStatus) { // Apply paymentStatus filter
    where.paymentStatus = paymentStatus;
  }

  const offset = (page - 1) * limit;

  try {
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
          where: Object.keys(customerWhere).length > 0 ? customerWhere : undefined,
          required: Object.keys(customerWhere).length > 0
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

    res.json({
      sales: rows,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (err) {
    console.error('Error fetching sales:', err);
    res.status(500).json({ error: 'Failed to fetch sales', details: err.message });
  }
};


const getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findByPk(req.params.id, {
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'contact', 'address', 'outstandingBalance'] },
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
  const { customerId, totalAmount, discount, paymentMethod, paymentStatus, notes, receiptImage, items } = req.body;
  const { id } = req.params;

  try {
    const sale = await Sale.findByPk(id);
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    // Update sale details
    await sale.update({
      customerId: customerId || null,
      totalAmount,
      discount,
      paymentMethod,
      paymentStatus,
      notes,
      receiptImage,
    });

    // Handle sale items: This is a complex part. For simplicity, we'll
    // delete existing items and recreate. A more robust solution would
    // compare and update/delete/create selectively.

    // First, fetch old sale items to revert stock changes
    const oldSaleItems = await SaleItem.findAll({ where: { saleId: id } });
    for (const oldItem of oldSaleItems) {
        const product = await Product.findByPk(oldItem.productId);
        if (product) {
            await product.update({ stock: product.stock + oldItem.quantity }); // Add back old stock
        }
        await oldItem.destroy(); // Delete old sale item
    }


    // Recreate sale items with new data and update stock
    if (items && items.length > 0) {
      for (const item of items) {
        const product = await Product.findByPk(item.productId);
        if (!product) {
          throw new Error(`Product with ID ${item.productId} not found for item update.`);
        }
        await SaleItem.create({
          saleId: sale.id,
          productId: item.productId,
          quantity: item.quantity,
          priceAtSale: item.priceAtSale,
        });
        await product.update({ stock: product.stock - item.quantity }); // Subtract new stock
      }
    }

    // Update customer's outstanding balance if relevant
    // This is also complex as it depends on changes in totalAmount, discount, and paymentStatus.
    // For now, let's assume simple recalculation based on new sale state.
    if (customerId) {
        const customer = await Customer.findByPk(customerId);
        if (customer) {
            // Need to get the old sale's financial impact on customer before updating.
            // For a robust system, you'd track balance changes precisely.
            // A dedicated transaction ledger for customer balance is usually better.
            // This part might need custom business logic based on how you track customer outstanding balances.
        }
    }

    const updatedSale = await Sale.findByPk(id, {
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'contact', 'address', 'outstandingBalance'] },
        { model: SaleItem, as: 'items', include: [{ model: Product, as: 'product' }] }
      ]
    });

    res.json(updatedSale);
  } catch (err) {
    console.error('Error updating sale:', err);
    res.status(500).json({ error: 'Failed to update sale', details: err.message });
  }
};


const deleteSale = async (req, res) => {
  const { id } = req.params;
  try {
    const sale = await Sale.findByPk(id, {
      include: [{ model: SaleItem, as: 'items' }]
    });

    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    // Revert product stock for all items in the sale
    if (sale.items && sale.items.length > 0) {
      for (const item of sale.items) {
        const product = await Product.findByPk(item.productId);
        if (product) {
          await product.update({ stock: product.stock + item.quantity });
        }
      }
    }

    // Adjust customer's outstanding balance if applicable
    if (sale.customerId && sale.paymentStatus !== 'Paid') {
        const customer = await Customer.findByPk(sale.customerId);
        if (customer) {
            const amountDue = sale.totalAmount - (sale.totalAmount * (sale.discount / 100) || 0);
            await customer.update({ outstandingBalance: customer.outstandingBalance - amountDue });
        }
    }

    await sale.destroy();
    res.status(204).send(); // No content for successful deletion
  } catch (err) {
    console.error('Error deleting sale:', err);
    res.status(500).json({ error: 'Failed to delete sale', details: err.message });
  }
};

const generateInvoice = async (req, res) => {
  try {
    const sale = await Sale.findByPk(req.params.id, {
      include: [
        { model: Customer, as: 'customer', attributes: ['name', 'contact', 'address'] },
        {
          model: SaleItem,
          as: 'items',
          include: [{ model: Product, as: 'product', attributes: ['name', 'sellingPrice'] }]
        }
      ]
    });

    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    const invoiceData = {
      saleId: sale.id,
      saleDate: sale.saleDate,
      customerName: sale.customer ? sale.customer.name : 'Walk-in Customer',
      customerContact: sale.customer ? sale.customer.contact : 'N/A', // Changed phone to contact
      customerAddress: sale.customer ? sale.customer.address : 'N/A',
      totalAmount: sale.totalAmount,
      discount: sale.discount,
      paymentMethod: sale.paymentMethod,
      paymentStatus: sale.paymentStatus,
      notes: sale.notes,
      items: sale.items.map(item => ({
        productName: item.product.name,
        quantity: item.quantity,
        priceAtSale: item.priceAtSale,
        lineTotal: item.quantity * item.priceAtSale
      })),
      subTotal: sale.items.reduce((sum, item) => sum + (item.quantity * item.priceAtSale), 0),
      grandTotal: sale.totalAmount,
    };

    res.json(invoiceData);

  } catch (err) {
    console.error('Error generating invoice:', err);
    res.status(500).json({ error: 'Failed to generate invoice', details: err.message });
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