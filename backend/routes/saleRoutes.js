// backend/routes/saleRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const uploadMiddleware = require('../middleware/upload');

const {
  recordSale,
  getSales,
  getSaleById, // Make sure getSaleById is imported
  generateInvoice
} = require('../controllers/saleController');

router.post('/', auth, uploadMiddleware.single('receiptImage'), recordSale);
router.get('/', auth, getSales);
// NEW: Route to get a single sale by ID
router.get('/:id', auth, getSaleById); // Add this line
router.get('/:id/invoice', auth, generateInvoice);

module.exports = router;