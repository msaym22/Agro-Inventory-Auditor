const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload'); // Assuming you'll use this for customer image upload
const {
  createCustomer, // Ensure createCustomer is imported
  updateCustomer,
  getCustomers,
  getCustomerById,
  deleteCustomer,
  updateCustomerBalance
} = require('../controllers/customerController');

// Routes for customers
router.post('/', auth, upload, createCustomer); // Ensure createCustomer is used here
router.get('/', auth, getCustomers);
router.get('/:id', auth, getCustomerById);
router.put('/:id', auth, upload, updateCustomer); // Assuming update might also involve file upload
router.delete('/:id', auth, deleteCustomer);
router.put('/:id/balance', auth, updateCustomerBalance);

module.exports = router;
