// backend/controllers/customerController.js
const { Customer, Sale, SaleItem, Product, Payment } = require('../models'); // Added Payment import
const { Op } = require('sequelize');

// Get all customers with pagination and search
exports.getCustomers = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const search = req.query.search || '';
  const offset = (page - 1) * limit;

  try {
    const whereClause = search ? {
      [Op.or]: [
        { name: { [Op.iLike]: `%${search}%` } },
        { contact: { [Op.iLike]: `%${search}%` } },
        { address: { [Op.iLike]: `%${search}%` } }
      ]
    } : {};

    const { count, rows } = await Customer.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      customers: rows,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
};

// Get a single customer by ID
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id, {
      include: [
        {
          model: Sale,
          as: 'sales',
          include: [
            {
              model: SaleItem,
              as: 'items',
              include: [{ model: Product, as: 'product' }]
            }
          ]
        },
        // Include Payment model here to fetch payment history
        {
          model: Payment,
          as: 'payments', // This 'as' must match the alias defined in your Customer model association
          order: [['paymentDate', 'DESC']]
        }
      ],
      order: [
        [{ model: Sale, as: 'sales' }, 'saleDate', 'DESC']
      ]
    });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Calculate total payments and update outstanding balance if needed
    const totalPayments = customer.payments ? customer.payments.reduce((acc, payment) => acc + parseFloat(payment.amount), 0) : 0;
    const totalSalesAmount = customer.sales ? customer.sales.reduce((acc, sale) => acc + parseFloat(sale.totalAmount), 0) : 0;
    
    customer.dataValues.outstandingBalance = (totalSalesAmount - totalPayments).toFixed(2);

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
    const [customer, created] = await Customer.findOrCreate({
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
    const [updatedRows] = await Customer.update(req.body, {
      where: { id: req.params.id },
      returning: true
    });

    if (updatedRows === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const updatedCustomer = await Customer.findByPk(req.params.id);
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
    const customer = await Customer.findByPk(req.params.id);
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

// Delete a customer by ID
exports.deleteCustomer = async (req, res) => {
  try {
    const deletedRows = await Customer.destroy({
      where: { id: req.params.id }
    });

    if (deletedRows === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
};