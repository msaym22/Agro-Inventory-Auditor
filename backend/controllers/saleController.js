const db = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

exports.createSale = async (req, res) => {
  console.log("Sale creation request received. req.body:", req.body);
  let transaction;
  try {
    const { saleData } = req.body;
    const parsedSaleData = JSON.parse(saleData);
    console.log("Parsed Sale Data:", parsedSaleData);

    const receiptImage = req.file ? req.file.filename : null;

    transaction = await db.Sale.sequelize.transaction();

    const customer = await db.Customer.findByPk(parsedSaleData.customerId, { transaction });
    if (parsedSaleData.customerId && !customer) {
      throw new Error('Customer not found');
    }

    const productIds = parsedSaleData.items.map(item => item.productId);
    const products = await db.Product.findAll({ where: { id: productIds }, transaction });

    if (products.length !== parsedSaleData.items.length) {
      throw new Error('One or more product IDs in sale items are invalid or not found');
    }

    let calculatedSubTotal = 0;
    const saleItemsToCreate = [];

    for (const item of parsedSaleData.items) {
      const product = products.find(p => p.id === item.productId);

      if (item.quantity > product.stock) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
      }

      const itemPrice = product.sellingPrice;
      calculatedSubTotal += itemPrice * item.quantity;
      saleItemsToCreate.push({
        productId: item.productId,
        quantity: item.quantity,
        priceAtSale: itemPrice,
      });
    }

    const finalTotalAmount = calculatedSubTotal - (parsedSaleData.discount || 0);

    const sale = await db.Sale.create({
      customerId: parsedSaleData.customerId,
      saleDate: parsedSaleData.saleDate || new Date(),
      totalAmount: finalTotalAmount,
      subTotal: calculatedSubTotal,
      discount: parsedSaleData.discount || 0,
      paymentMethod: parsedSaleData.paymentMethod,
      paymentStatus: parsedSaleData.paymentStatus,
      notes: parsedSaleData.notes || '',
      receiptImage: receiptImage,
    }, { transaction });

    for (const itemData of saleItemsToCreate) {
      await db.SaleItem.create({
        saleId: sale.id,
        productId: itemData.productId,
        quantity: itemData.quantity,
        priceAtSale: itemData.priceAtSale
      }, { transaction });

      const productToUpdate = products.find(p => p.id === itemData.productId);
      if (productToUpdate) {
        productToUpdate.stock -= itemData.quantity;
        await productToUpdate.save({ transaction });
      }
    }

    // Handle credit logic based on payment method
    if (customer && (parsedSaleData.paymentMethod === 'credit' || parsedSaleData.paymentMethod === 'partial')) {
      let creditAmount = 0;
      
      if (parsedSaleData.paymentMethod === 'credit') {
        // Full amount goes to credit
        creditAmount = finalTotalAmount;
      } else if (parsedSaleData.paymentMethod === 'partial') {
        // Calculate remaining amount after down payment
        const downPayment = parseFloat(parsedSaleData.downPayment) || 0;
        creditAmount = finalTotalAmount - downPayment;
      }
      
      if (creditAmount > 0) {
        customer.outstandingBalance = (customer.outstandingBalance || 0) + creditAmount;
        await customer.save({ transaction });
        console.log(`Updated customer ${customer.name} credit balance to: ${customer.outstandingBalance}`);
      }
    }

    await transaction.commit();

    const createdSale = await db.Sale.findByPk(sale.id, {
      include: [
        { model: db.Customer, as: 'customer', attributes: ['id', 'name', 'contact', 'address', 'outstandingBalance'] },
        { model: db.SaleItem, as: 'items', include: [{ model: db.Product, as: 'product', attributes: ['id', 'name', 'sellingPrice', 'nameUrdu'] }] }
      ]
    });

    console.log("Sale created and fetched successfully:", createdSale);
    res.status(201).json(createdSale);

  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('Error creating sale:', error);
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

exports.getSales = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const search = req.query.search || '';
  const offset = (page - 1) * limit;

  try {
    let salesWhere = {};
    let includeOptions = [
      { model: db.Customer, as: 'customer', attributes: ['id', 'name', 'contact', 'address'], required: false },
      {
        model: db.SaleItem, as: 'items', attributes: ['quantity', 'priceAtSale'], required: false,
        include: [{ model: db.Product, as: 'product', attributes: ['id', 'name', 'nameUrdu', 'sellingPrice'], required: false }]
      }
    ];

    if (search) {
      const searchConditions = [];
      const numericSearch = parseFloat(search);

      if (!isNaN(numericSearch) && numericSearch.toString() === search) {
        searchConditions.push(
          { id: parseInt(search) },
          { totalAmount: numericSearch }
        );
      }

      // Find sales by customer name
      const customerSales = await db.Sale.findAll({
        attributes: ['id'],
        include: [{
          model: db.Customer,
          as: 'customer',
          where: { name: { [Op.like]: `%${search}%` } },
          attributes: [],
          required: true // Ensures an INNER JOIN for filtering
        }],
        raw: true // Get plain data without Sequelize instances
      });
      const customerSaleIds = customerSales.map(sale => sale.id);

      // Find sales by product name (through SaleItem)
      const productSales = await db.Sale.findAll({
        attributes: ['id'],
        include: [{
          model: db.SaleItem,
          as: 'items',
          attributes: [],
          required: true, // INNER JOIN for SaleItem
          include: [{
            model: db.Product,
            as: 'product',
            attributes: [],
            where: { name: { [Op.like]: `%${search}%` } },
            required: true // INNER JOIN for Product
          }]
        }],
        raw: true
      });
      const productSaleIds = productSales.map(sale => sale.id);

      // Combine all sale IDs from different search criteria
      const combinedSaleIds = [...new Set([...customerSaleIds, ...productSaleIds, ...searchConditions.map(c => c.id)].filter(Boolean))];

      if (combinedSaleIds.length > 0) {
        salesWhere.id = { [Op.in]: combinedSaleIds };
      } else {
        // If no IDs found by search, return empty to avoid fetching all sales
        salesWhere.id = { [Op.in]: [] };
      }

      // When searching, we only need the basic associations for display,
      // as the filtering is done by ID at the top level.
      // So, revert required to false for main query for flexibility.
      includeOptions[0].required = false;
      includeOptions[1].required = false;
      includeOptions[1].include[0].required = false;
    }

    if (req.query.customerId) {
      salesWhere.customerId = req.query.customerId;
    }

    if (req.query.startDate && req.query.endDate) {
      salesWhere.saleDate = {
        [Op.between]: [moment(req.query.startDate).startOf('day').toDate(), moment(req.query.endDate).endOf('day').toDate()]
      };
    } else if (req.query.startDate) {
      salesWhere.saleDate = { [Op.gte]: moment(req.query.startDate).startOf('day').toDate() };
    } else if (req.query.endDate) {
      salesWhere.saleDate = { [Op.lte]: moment(req.query.endDate).endOf('day').toDate() };
    }

    const { count, rows } = await db.Sale.findAndCountAll({
      where: salesWhere,
      order: [['saleDate', 'DESC']],
      limit: parseInt(limit),
      offset: offset,
      include: includeOptions,
      distinct: true,
      col: 'id',
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      sales: rows,
      pagination: { totalItems: count, totalPages, currentPage: parseInt(page), itemsPerPage: parseInt(limit) }
    });
  } catch (err) {
    console.error('Failed to fetch sales:', err);
    res.status(500).json({ error: 'Failed to fetch sales', details: err.message });
  }
};

exports.getSaleById = async (req, res) => {
  try {
    const sale = await db.Sale.findByPk(req.params.id, {
      include: [
        { model: db.Customer, as: 'customer', attributes: ['id', 'name', 'contact', 'address', 'outstandingBalance'] },
        { model: db.SaleItem, as: 'items', attributes: ['quantity', 'priceAtSale'], include: [{ model: db.Product, as: 'product', attributes: ['id', 'name', 'sellingPrice', 'nameUrdu'] }] }
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

exports.updateSale = async (req, res) => {
  console.log("Sale update request received. req.body:", req.body);
  const { id } = req.params;
  const { items, ...saleData } = req.body;

  let transaction;
  try {
    transaction = await db.Sale.sequelize.transaction();

    const [updatedRows] = await db.Sale.update(saleData, { where: { id }, transaction, returning: true });

    if (updatedRows === 0) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Sale not found' });
    }

    if (items && items.length > 0) {
      await db.SaleItem.destroy({ where: { saleId: id }, transaction });
      for (const item of items) {
        await db.SaleItem.create({
          saleId: id,
          productId: item.productId,
          quantity: item.quantity,
          priceAtSale: item.priceAtSale
        }, { transaction });

        const product = await db.Product.findByPk(item.productId, { transaction });
        if (product) {
          product.stock -= item.quantity;
          await product.save({ transaction });
        }
      }
    }

    await transaction.commit();

    const updatedSale = await db.Sale.findByPk(id, {
      include: [
        { model: db.Customer, as: 'customer', attributes: ['id', 'name'] },
        { model: db.SaleItem, as: 'items', include: [{ model: db.Product, as: 'product', attributes: ['id', 'name', 'nameUrdu'] }] }
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

exports.deleteSale = async (req, res) => {
  console.log("Sale deletion request received. id:", req.params.id);
  let transaction;
  try {
    transaction = await db.Sale.sequelize.transaction();

    const saleItems = await db.SaleItem.findAll({ where: { saleId: req.params.id }, transaction });
    for (const item of saleItems) {
      const product = await db.Product.findByPk(item.productId, { transaction });
      if (product) {
        product.stock += item.quantity;
        await product.save({ transaction });
      }
    }

    const deleted = await db.Sale.destroy({ where: { id: req.params.id }, transaction });

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

exports.generateInvoice = async (req, res) => {
  try {
    const sale = await db.Sale.findByPk(req.params.id, {
      include: [
        { model: db.Customer, as: 'customer', attributes: ['id', 'name', 'contact', 'address', 'outstandingBalance'] },
        { model: db.SaleItem, as: 'items', include: [{ model: db.Product, as: 'product', attributes: ['id', 'name', 'sellingPrice', 'nameUrdu'] }] }
      ]
    });

    if (sale) {
      const invoiceData = {
        invoiceId: sale.id,
        customerName: sale.customer ? sale.customer.name : 'Walk-in Customer',
        customerPhone: sale.customer ? sale.customer.contact : 'N/A',
        customerAddress: sale.customer ? sale.customer.address : 'N/A',
        date: sale.saleDate,
        paymentMethod: sale.paymentMethod,
        paymentStatus: sale.paymentStatus,
        subTotal: sale.subTotal,
        discount: sale.discount,
        grandTotal: sale.totalAmount,
        notes: sale.notes,
        items: sale.items.map(item => ({
          id: item.id,
          productName: item.product.name,
          productNameUrdu: item.product.nameUrdu,
          quantity: item.quantity,
          unitPrice: item.priceAtSale,
          total: item.quantity * item.priceAtSale,
        })),
      };
      res.json(invoiceData);
    } else {
      res.status(404).json({ error: 'Sale not found' });
    }
  } catch (err) {
    console.error('Server error fetching invoice data:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

module.exports = {
  createSale: exports.createSale,
  getSales: exports.getSales,
  getSaleById: exports.getSaleById,
  updateSale: exports.updateSale,
  deleteSale: exports.deleteSale,
  generateInvoice: exports.generateInvoice,
};