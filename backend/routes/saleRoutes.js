// backend/routes/saleRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const uploadMiddleware = require('../middleware/upload'); // Renamed for clarity

const {
  recordSale,
  getSales,
  generateInvoice
} = require('../controllers/saleController');

router.post('/', auth, uploadMiddleware.single('receiptImage'), recordSale); // This line is critical
router.get('/', auth, getSales);
router.get('/:id/invoice', auth, generateInvoice);

module.exports = router;