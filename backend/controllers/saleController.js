const { Sale, SaleItem, Product, Customer } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment'); // Make sure moment is installed (npm install moment)

// Create a new sale
exports.createSale = async (req, res) => {
  console.log("Sale creation request received. req.body:", req.body); // Log incoming request body
  let transaction;
  try {
    // Assuming saleData is sent as a JSON string in a 'saleData' field of FormData
    // And receiptImage (if any) is in req.file
    const { saleData } = req.body; 
    const parsedSaleData = JSON.parse(saleData);
    console.log("Parsed Sale Data:", parsedSaleData); // Log parsed data

    const receiptImage = req.file ? req.file.path : null; // Get image path if uploaded

    transaction = await Sale.sequelize.transaction();

    // Validate customer and products existence before creating sale
    const customer = await Customer.findByPk(parsedSaleData.customerId, { transaction });
    if (!customer) {
      throw new Error('Customer not found'); // Throw error to trigger rollback
    }

    const productIds = parsedSaleData.items.map(item => item.productId);
    const products = await Product.findAll({ where: { id: productIds }, transaction });

    if (products.length !== parsedSaleData.items.length) {
      throw new Error('One or more product IDs are invalid or not found');
    }

    // Calculate total amount and prepare sale items
    let calculatedSubTotal = 0;
    const saleItemsToCreate = [];

    for (const item of parsedSaleData.items) {
      const product = products.find(p => p.id === item.productId);
      
      if (item.quantity > product.stock) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
      }

      const itemPrice = product.sellingPrice; // Use product's current selling price
      calculatedSubTotal += itemPrice * item.quantity;
      saleItemsToCreate.push({
        productId: item.productId,
        quantity: item.quantity,
        priceAtSale: itemPrice, // Record price at the time of sale
      });
    }

    const finalTotalAmount = calculatedSubTotal - (parsedSaleData.discount || 0);

    // Create the sale record
    const sale = await Sale.create({
      customerId: parsedSaleData.customerId,
      saleDate: parsedSaleData.saleDate || new Date(), // Use provided date or current date
      totalAmount: finalTotalAmount,
      subTotal: calculatedSubTotal, // Store subTotal
      discount: parsedSaleData.discount || 0,
      paymentMethod: parsedSaleData.paymentMethod,
      paymentStatus: parsedSaleData.paymentStatus,
      notes: parsedSaleData.notes || '',
      receiptImage: receiptImage,
    }, { transaction });

    // Create sale items and update product stock within the same transaction
    for (const itemData of saleItemsToCreate) {
      await SaleItem.create({
        saleId: sale.id,
        productId: itemData.productId,
        quantity: itemData.quantity,
        priceAtSale: itemData.priceAtSale
      }, { transaction });

      // Update product stock
      const productToUpdate = products.find(p => p.id === itemData.productId);
      if (productToUpdate) {
        productToUpdate.stock -= itemData.quantity;
        await productToUpdate.save({ transaction });
      }
    }

    // Update customer's outstanding balance if payment method is credit and not fully paid
    if (parsedSaleData.paymentMethod === 'credit' && parsedSaleData.paymentStatus !== 'paid') {
      customer.outstandingBalance = (customer.outstandingBalance || 0) + finalTotalAmount;
      await customer.save({ transaction });
    }

    await transaction.commit();

    // Fetch the created sale with all necessary associations for the frontend
    const createdSale = await Sale.findByPk(sale.id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'contact', 'address', 'outstandingBalance']
        },
        {
          model: SaleItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'sellingPrice', 'nameUrdu']
            }
          ]
        }
      ]
    });

    console.log("Sale created and fetched successfully:", createdSale); // Log final response
    res.status(201).json(createdSale);

  } catch (error) {
    if (transaction) await transaction.rollback(); // Rollback transaction on error
    console.error('Error creating sale:', error); // Log full error object
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: 'Validation failed', details: error.errors.map(e => e.message) });
    }
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ error: 'Invalid customer or product ID due to foreign key constraint', details: error.message });
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Duplicate entry', details: error.message });
    }
    res.status(500).json({ error: 'Failed to create sale', details: error.message });
  }
};

// Get all sales with pagination and search
exports.getSales = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const search = req.query.search || '';
  const offset = (page - 1) * limit;

  try {
    const whereClause = search ? {
      [Op.or]: [
        { '$customer.name$': { [Op.iLike]: `%${search}%` } }, // Search by customer name
        // Allow searching by sale ID (integer) or totalAmount (float)
        { id: parseInt(search) || 0 }, 
        { totalAmount: parseFloat(search) || 0 }
      ]
    } : {};

    const { count, rows } = await Sale.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['saleDate', 'DESC']],
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'contact', 'address'] // Include more customer attributes if needed by frontend
        },
        {
          model: SaleItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'nameUrdu', 'sellingPrice'] // Ensure nameUrdu is included here
            }
          ]
        }
      ]
    });

    res.json({
      sales: rows, // Ensure this is 'sales' for the frontend's fetchSales.fulfilled
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ error: 'Failed to fetch sales', details: error.message });
  }
};

// Get a single sale by ID
exports.getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findByPk(req.params.id, {
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'contact', 'address', 'outstandingBalance'] },
        {
          model: SaleItem,
          as: 'items',
          attributes: ['quantity', 'priceAtSale'],
          include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'sellingPrice', 'nameUrdu'] }] // Added 'nameUrdu'
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

// Update a sale by ID
exports.updateSale = async (req, res) => {
  console.log("Sale update request received. req.body:", req.body);
  const { id } = req.params;
  const { items, ...saleData } = req.body; // Destructure items if present

  let transaction;
  try {
    transaction = await Sale.sequelize.transaction();

    const [updatedRows] = await Sale.update(saleData, {
      where: { id },
      transaction,
      returning: true // Return the updated row
    });

    if (updatedRows === 0) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Sale not found' });
    }

    // If items are provided, update them. This assumes a full replacement or specific updates.
    // For simplicity, we might delete existing items and recreate, or compare and update.
    // A more robust solution would handle diffing.
    if (items && items.length > 0) {
      await SaleItem.destroy({ where: { saleId: id }, transaction }); // Delete old items
      for (const item of items) {
        await SaleItem.create({
          saleId: id,
          productId: item.productId,
          quantity: item.quantity,
          priceAtSale: item.priceAtSale // Use priceAtSale from frontend
        }, { transaction });

        // Update product stock (consider previous stock vs new stock)
        const product = await Product.findByPk(item.productId, { transaction });
        if (product) {
          // This is a simplified stock update. For a real system, you'd need to calculate
          // the difference between old and new quantities for the product.
          // For now, it assumes a fresh stock deduction.
          product.stock -= item.quantity; 
          await product.save({ transaction });
        }
      }
    }

    await transaction.commit();

    const updatedSale = await Sale.findByPk(id, {
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name'] },
        { model: SaleItem, as: 'items', include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'nameUrdu'] }] }
      ]
    });
    console.log("Sale updated successfully:", updatedSale);
    res.json(updatedSale);

  } catch (err) {
    if (transaction) await transaction.rollback();
    console.error('Sale update failed:', err);
    if (err.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: 'Validation failed', details: err.errors.map(e => e.message) });
    }
    res.status(500).json({ error: 'Update failed', details: err.message });
  }
};

// Delete a sale
exports.deleteSale = async (req, res) => {
  console.log("Sale deletion request received. id:", req.params.id);
  let transaction;
  try {
    transaction = await Sale.sequelize.transaction();

    // Revert stock for products in this sale before deleting
    const saleItems = await SaleItem.findAll({ where: { saleId: req.params.id }, transaction });
    for (const item of saleItems) {
      const product = await Product.findByPk(item.productId, { transaction });
      if (product) {
        product.stock += item.quantity; // Add back stock
        await product.save({ transaction });
      }
    }

    const deleted = await Sale.destroy({
      where: { id: req.params.id },
      transaction
    });

    if (deleted) {
      await transaction.commit();
      console.log("Sale deleted successfully. ID:", req.params.id);
      res.status(204).send();
    } else {
      await transaction.rollback();
      res.status(404).json({ error: 'Sale not found' });
    }
  } catch (err) {
    if (transaction) await transaction.rollback();
    console.error('Sale deletion failed:', err);
    res.status(500).json({ error: 'Deletion failed', details: err.message });
  }
};


// Export all functions
module.exports = {
  createSale: exports.createSale, // Explicitly export createSale
  getSales: exports.getSales,
  getSaleById: exports.getSaleById,
  updateSale: exports.updateSale,
  deleteSale: exports.deleteSale,
  generateInvoice: exports.generateInvoice, // Assuming generateInvoice is defined elsewhere in this file
};
