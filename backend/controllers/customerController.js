const { Customer, Sale } = require('../models');
const { Op } = require('sequelize');
const upload = require('../middleware/upload'); // Assuming upload middleware is used for customer image
const { logAudit } = require('./auditController'); // Assuming audit logging is used

const createCustomer = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message || 'File upload failed' });
      }

      const customerData = req.body;

      if (req.file) {
        customerData.customerImage = req.file.path; // Store image path
      }

      const customer = await Customer.create(customerData);

      // Log audit trail if auditController is available
      // await logAudit('Customer', customer.id, 'create', customerData, req.user.id);

      res.status(201).json(customer);
    });
  } catch (err) {
    console.error('Customer creation failed:', err);
    res.status(500).json({ error: 'Customer creation failed', details: err.message });
  }
};

const updateCustomer = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message || 'File upload failed' });
      }

      const customerData = req.body;
      const oldCustomer = await Customer.findByPk(req.params.id);

      if (req.file) {
        customerData.customerImage = req.file.path;
      }

      const [updated] = await Customer.update(customerData, {
        where: { id: req.params.id }
      });

      if (updated) {
        const newCustomer = await Customer.findByPk(req.params.id);
        // Log audit trail if auditController is available
        // const changes = { old: oldCustomer.toJSON(), new: newCustomer.toJSON() };
        // await logAudit('Customer', req.params.id, 'update', changes, req.user.id);
        res.json(newCustomer);
      } else {
        res.status(404).json({ error: 'Customer not found' });
      }
    });
  } catch (err) {
    console.error('Customer update failed:', err);
    res.status(500).json({ error: 'Update failed', details: err.message });
  }
};

const getCustomers = async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;

  const where = {};

  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { contact: { [Op.iLike]: `%${search}%` } }
    ];
  }

  try {
    const offset = (page - 1) * limit;

    const { count, rows } = await Customer.findAndCountAll({
      where,
      order: [['name', 'ASC']],
      limit: parseInt(limit),
      offset: offset
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      customers: rows, // Array of customer objects
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (err) {
    console.error('Failed to fetch customers:', err);
    res.status(500).json({ error: 'Failed to fetch customers', details: err.message });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id, {
      include: [{ model: Sale, as: 'purchases' }] // Include purchases if needed
    });

    if (customer) {
      res.json(customer);
    } else {
      res.status(404).json({ error: 'Customer not found' });
    }
  } catch (err) {
    console.error('Server error fetching customer by ID:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const deleted = await Customer.destroy({
      where: { id: req.params.id }
    });

    if (deleted) {
      // Log audit trail if auditController is available
      // await logAudit('Customer', req.params.id, 'delete', customer.toJSON(), req.user.id);
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Customer not found' });
    }
  } catch (err) {
    console.error('Customer deletion failed:', err);
    res.status(500).json({ error: 'Deletion failed', details: err.message });
  }
};

const updateCustomerBalance = async (req, res) => {
  const { amount, type } = req.body; // type can be 'add' or 'subtract'
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    if (type === 'add') {
      customer.outstandingBalance += parseFloat(amount);
    } else if (type === 'subtract') {
      customer.outstandingBalance -= parseFloat(amount);
    } else {
      return res.status(400).json({ error: 'Invalid balance update type' });
    }

    await customer.save();
    res.json(customer);
  } catch (err) {
    console.error('Failed to update customer balance:', err);
    res.status(500).json({ error: 'Failed to update customer balance', details: err.message });
  }
};


module.exports = {
  createCustomer, // Ensure this is exported
  updateCustomer,
  getCustomers,
  getCustomerById,
  deleteCustomer,
  updateCustomerBalance
};
