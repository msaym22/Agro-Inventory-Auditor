const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');
const { protect } = require('../middleware/auth'); // Assuming you have auth middleware
const upload = require('../middleware/upload'); // Assuming multer upload middleware

// Route to create a new sale with optional image upload
router.post('/', protect, upload.single('receiptImage'), saleController.createSale);

// Route to get all sales with pagination and search
router.get('/', protect, saleController.getSales);

// Route to get a single sale by ID
router.get('/:id', protect, saleController.getSaleById);

// Route to update a sale by ID
router.put('/:id', protect, saleController.updateSale);

// Route to delete a sale by ID
router.delete('/:id', protect, saleController.deleteSale);

// Route to generate invoice data for a sale
router.get('/invoice/:id', protect, saleController.generateInvoice);


module.exports = router;
