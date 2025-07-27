// backend/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
// Corrected: Ensure all required functions are imported by their exact exported names
const { createPayment, getCustomerPayments, deletePayment } = require('../controllers/paymentController'); // Added deletePayment

router.post('/', protect, createPayment);
router.get('/customer/:customerId', protect, getCustomerPayments);
router.delete('/:id', protect, deletePayment); // Ensure this line exists and uses the imported deletePayment

module.exports = router;