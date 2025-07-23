const { Sale, Product, Customer, SaleItem } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

const recordSale = async (req, res) => {
  try {
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

    const { customerId, items, discount = 0, paymentMethod, paymentStatus, notes, totalAmount } = parsedSaleData;

    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const productIds = items.map(item => item.productId);
    const products = await Product.findAll({ where: { id: productIds } });

    if (products.length !== items.length) {
      return res.status(400).json({ error: 'One or more product IDs are invalid or not found' });
    }

    const saleItemsToCreate = [];
    let calculatedTotalAmount = 0;

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

      const itemPrice = product.sellingPrice;
      calculatedTotalAmount += itemPrice * item.quantity;
      saleItemsToCreate.push({
        productId: item.productId,
        quantity: item.quantity,
        priceAtSale: itemPrice,
      });
    }

    calculatedTotalAmount -= discount;

    const sale = await Sale.create({
      customerId,
      saleDate: new Date(),
      totalAmount: calculatedTotalAmount,
      discount,
      paymentMethod,
      paymentStatus,
      notes: notes || '',
      receiptImage: saleData.receiptImage
    });

    const finalSaleItems = saleItemsToCreate.map(item => ({
      ...item,
      saleId: sale.id
    }));
    await SaleItem.bulkCreate(finalSaleItems);

    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      product.stock -= item.quantity;
      await product.save();
    }

    if (paymentMethod === 'credit' && paymentStatus !== 'paid') {
      customer.outstandingBalance = (customer.outstandingBalance || 0) + calculatedTotalAmount;
      await customer.save();
    }

    const createdSale = await Sale.findByPk(sale.id, {
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'contact', 'address', 'outstandingBalance'] },
        { model: SaleItem, as: 'items', include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'sellingPrice', 'nameUrdu'] }] } // Added 'nameUrdu'
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
      [Op.between]: [
        moment(startDate).startOf('day').toDate(),
        moment(endDate).endOf('day').toDate()
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
          where: Object.keys(customerWhere).length > 0 ? customerWhere : undefined,
          required: Object.keys(customerWhere).length > 0
        },
        {
          model: SaleItem,
          as: 'items',
          attributes: ['quantity', 'priceAtSale'],
          include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'nameUrdu'] }] // Added 'nameUrdu'
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
    console.error('Failed to fetch sales:', err);
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
          include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'nameUrdu'] }] // Added 'nameUrdu'
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
      customerPhone: sale.customer ? sale.customer.contact : 'N/A',
      customerAddress: sale.customer ? sale.customer.address : 'N/A',
      items: sale.items.map(item => ({
        productName: item.product ? item.product.name : 'Unknown Product',
        productNameUrdu: item.product ? item.product.nameUrdu : null, // Added 'productNameUrdu'
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