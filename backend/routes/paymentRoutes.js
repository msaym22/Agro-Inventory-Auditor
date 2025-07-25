// backend/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createPayment, getCustomerPayments } = require('../controllers/paymentController');

router.post('/', protect, createPayment);
router.get('/customer/:customerId', protect, getCustomerPayments);

module.exports = router;
