const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { protect } = require('../middleware/auth'); // Correctly import the 'protect' function
const { backupUpload } = require('../middleware/upload');

// Get all customers with pagination and search
router.get('/', protect, customerController.getCustomers);

// Import customers via Excel
router.post('/import', protect, (req, res, next) => {
  backupUpload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: 'Upload failed', details: err.message });
    }
    next();
  });
}, customerController.importCustomers);

// Get a single customer by ID
router.get('/:id', protect, customerController.getCustomerById);

// Create a new customer
router.post('/', protect, customerController.createCustomer);

// Update a customer by ID
router.put('/:id', protect, customerController.updateCustomer);

// Update customer balance by ID (PATCH for partial update)
router.patch('/:id/balance', protect, customerController.updateCustomerBalance);

// Delete a customer by ID
router.delete('/:id', protect, customerController.deleteCustomer);

module.exports = router;