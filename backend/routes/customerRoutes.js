const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const authMiddleware = require('../middleware/auth'); // Assuming you want auth for delete
const upload = require('../middleware/upload'); // If customer images are ever needed, although not current

// Apply authentication middleware to all customer routes that require it
router.use(authMiddleware);

// Get all customers with pagination and search
router.get('/', customerController.getCustomers);

// Get a single customer by ID
router.get('/:id', customerController.getCustomerById);

// Create a new customer
router.post('/', customerController.createCustomer);

// Update a customer by ID
router.put('/:id', customerController.updateCustomer);

// Update customer balance by ID (PATCH for partial update)
router.patch('/:id/balance', customerController.updateCustomerBalance);

// Delete a customer by ID (NEW)
router.delete('/:id', customerController.deleteCustomer);

module.exports = router;