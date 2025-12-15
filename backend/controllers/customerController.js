// backend/controllers/customerController.js
const db = require('../models'); // dynamic models to survive reloads
const { Op } = require('sequelize');
const XLSX = require('xlsx');

// Get all customers with optional pagination and search
exports.getCustomers = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit); // No default limit
  const search = req.query.search || '';

  try {
    const whereClause = search ? {
      [Op.or]: [
        { name: { [Op.iLike]: `%${search}%` } },
        { contact: { [Op.iLike]: `%${search}%` } },
        { address: { [Op.iLike]: `%${search}%` } }
      ]
    } : {};

    // If no limit is specified, get all customers without pagination
    const queryOptions = {
      where: whereClause,
      order: [['createdAt', 'DESC']]
    };

    // Only add pagination if limit is specified
    if (limit) {
      const offset = (page - 1) * limit;
      queryOptions.limit = limit;
      queryOptions.offset = offset;
    }

    const { count, rows } = await db.Customer.findAndCountAll(queryOptions);

    // If no limit, all customers are on one page
    const totalPages = limit ? Math.ceil(count / limit) : 1;
    const itemsPerPage = limit ? limit : count;

    res.json({
      customers: rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: count,
        itemsPerPage
      }
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    // If the database connection was closed (e.g., during Drive pull), reload and retry once
    const msg = error && (error.message || '').toString();
    if (msg.includes('ConnectionManager.getConnection') && msg.includes('closed')) {
      try {
        const db = require('../models');
        const reloaded = await (db.reloadSequelize?.() || Promise.resolve(false));
        if (reloaded) {
          const whereClause = search ? {
            [Op.or]: [
              { name: { [Op.iLike]: `%${search}%` } },
              { contact: { [Op.iLike]: `%${search}%` } },
              { address: { [Op.iLike]: `%${search}%` } }
            ]
          } : {};

          // If no limit is specified, get all customers without pagination
          const queryOptions = {
            where: whereClause,
            order: [['createdAt', 'DESC']]
          };

          // Only add pagination if limit is specified
          if (limit) {
            const offset = (page - 1) * limit;
            queryOptions.limit = limit;
            queryOptions.offset = offset;
          }

          const { count, rows } = await db.Customer.findAndCountAll(queryOptions);

          // If no limit, all customers are on one page
          const totalPages = limit ? Math.ceil(count / limit) : 1;
          const itemsPerPage = limit ? limit : count;

          return res.json({
            customers: rows,
            pagination: {
              currentPage: page,
              totalPages,
              totalItems: count,
              itemsPerPage
            }
          });
        }
      } catch (e) {
        console.error('Retry after DB reload failed:', e);
      }
    }
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
};

// Get a single customer by ID
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await db.Customer.findByPk(req.params.id, {
      include: [
        {
          model: db.Sale,
          as: 'sales',
          include: [
            {
              model: db.SaleItem,
              as: 'items',
              include: [{ model: db.Product, as: 'product' }]
            }
          ]
        },
        // Include Payment model here to fetch payment history
        {
          model: db.Payment,
          as: 'payments', // This 'as' must match the alias defined in your Customer model association
          order: [['paymentDate', 'DESC']]
        }
      ],
      order: [
        [{ model: db.Sale, as: 'sales' }, 'saleDate', 'DESC']
      ]
    });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    // Do NOT recompute outstandingBalance here; trust the persisted value
    res.json(customer);
  } catch (error) {
    console.error('Error fetching customer by ID:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
};

// Create a new customer or return existing if name/contact matches
exports.createCustomer = async (req, res) => {
  console.log("Customer creation request received. req.body:", req.body);
  const { name, contact, address, creditLimit } = req.body;

  try {
    // Attempt to find an existing customer by name and contact
    const [customer, created] = await db.Customer.findOrCreate({
      where: {
        name: name,
        // Only include contact in the unique check if it's provided and not empty
        ...(contact && { contact: contact })
      },
      defaults: {
        name,
        contact,
        address,
        creditLimit: parseFloat(creditLimit) || 0,
        outstandingBalance: 0 // New customers start with 0 outstanding balance
      }
    });

    if (!created) {
      // If customer was found (not created), log and return existing
      console.log("Customer already exists with this name/contact:", customer.name);
      // Optionally, you might want to return a different status code like 200 OK
      // if it's considered a successful "find". For this flow, 200 is appropriate
      // and frontend can check 'isNewRecord' or 'created' flag if needed.
      return res.status(200).json(customer); // Return the existing customer
    }

    console.log("Customer created successfully:", customer);
    return res.status(201).json(customer); // Return the newly created customer

  } catch (error) {
    console.error("Error creating customer in backend:", error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: 'Validation failed', details: error.errors.map(e => e.message) });
    }
    // This case should ideally be handled by findOrCreate now, but keeping as a fallback
    if (error.name === 'SequelizeUniqueConstraintError') {
      // This error might still occur if a unique index exists on 'contact' where NULLs are not unique,
      // and multiple customers are created with empty contact fields.
      return res.status(409).json({ error: 'A customer with this name/contact already exists.', details: error.message });
    }
    return res.status(500).json({ error: 'Internal server error during customer creation', details: error.message });
  }
};

// Update a customer by ID
exports.updateCustomer = async (req, res) => {
  try {
    const [updatedRows] = await db.Customer.update(req.body, {
      where: { id: req.params.id },
      returning: true
    });

    if (updatedRows === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const updatedCustomer = await db.Customer.findByPk(req.params.id);
    res.json(updatedCustomer);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
};

// Update customer balance by ID (PATCH method for partial updates)
exports.updateCustomerBalance = async (req, res) => {
  const { outstandingBalance } = req.body;
  try {
    const customer = await db.Customer.findByPk(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    customer.outstandingBalance = outstandingBalance;
    await customer.save();
    res.json(customer);
  } catch (error) {
    console.error('Error updating customer balance:', error);
    res.status(500).json({ error: 'Failed to update customer balance' });
  }
};

// Delete a customer by ID (cascade delete linked sales, sale items, and payments)
exports.deleteCustomer = async (req, res) => {
  let transaction;
  try {
    transaction = await db.Customer.sequelize.transaction();

    const customer = await db.Customer.findByPk(req.params.id, {
      include: [
        { model: db.Sale, as: 'sales', include: [{ model: db.SaleItem, as: 'items' }] },
        { model: db.Payment, as: 'payments' }
      ],
      transaction
    });

    if (!customer) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Restore stock for all products for each sale, delete sale items and sales
    for (const sale of customer.sales || []) {
      const saleItems = sale.items || [];
      for (const item of saleItems) {
        const product = await db.Product.findByPk(item.productId, { transaction });
        if (product) {
          product.stock = (product.stock || 0) + item.quantity;
          await product.save({ transaction });
        }
      }
      // Delete sale items then the sale itself
      await db.SaleItem.destroy({ where: { saleId: sale.id }, transaction });
      await db.Sale.destroy({ where: { id: sale.id }, transaction });
    }

    // Delete all payments linked to this customer (whether tied to sales or not)
    await db.Payment.destroy({ where: { customerId: customer.id }, transaction });

    // Finally delete the customer
    await db.Customer.destroy({ where: { id: customer.id }, transaction });

    await transaction.commit();
    return res.status(204).send();
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('Error deleting customer (cascade):', error);
    return res.status(500).json({ error: 'Failed to delete customer', details: error.message });
  }
};

// Import customers from Excel
exports.importCustomers = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null });

    const results = { created: 0, updated: 0, skipped: 0 };

    for (const row of rows) {
      const name = row.name || row.Name || row.customer || row.Customer;
      if (!name) { results.skipped++; continue; }

      const contact = row.contact || row.Contact || null;
      const address = row.address || row.Address || null;
      const creditLimit = row.creditLimit != null ? parseFloat(row.creditLimit) : null;

      const where = contact ? { name, contact } : { name };
      const existing = await Customer.findOne({ where });
      const payload = {
        name,
        contact,
        address,
        creditLimit: creditLimit != null ? creditLimit : undefined
      };
      Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

      if (existing) {
        await existing.update(payload);
        results.updated++;
      } else {
        await Customer.create({
          name,
          contact,
          address,
          creditLimit: payload.creditLimit || 0,
          outstandingBalance: 0
        });
        results.created++;
      }
    }

    res.json({ message: 'Import completed', results });
  } catch (err) {
    console.error('Import customers failed:', err);
    res.status(500).json({ error: 'Import failed', details: err.message });
  }
};