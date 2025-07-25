const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Route to create a new sale with optional image upload
router.post('/', protect, upload.single('receiptImage'), saleController.createSale);

// Route to get all sales with pagination and search
router.get('/', protect, saleController.getSales);

// Route to get a single sale by ID
router.get('/:id', protect, saleController.getSaleById);

// ✅ CORRECTED ROUTE DEFINITION
// Changed from '/invoice/:id' to '/:id/invoice'
router.get('/:id/invoice', protect, saleController.generateInvoice);

// Route to update a sale by ID
router.put('/:id', protect, saleController.updateSale);

// Route to delete a sale by ID
router.delete('/:id', protect, saleController.deleteSale);

module.exports = router;