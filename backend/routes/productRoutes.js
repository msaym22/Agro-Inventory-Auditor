// backend/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const uploadMiddleware = require('../middleware/upload'); // Import the upload middleware

const {
  createProduct,
  updateProduct,
  getProducts,
  getProductById,
  deleteProduct,
  bulkUpdate,
  checkLowStock
} = require('../controllers/productController');

// Apply upload middleware directly in the route for file uploads
router.post('/', auth, uploadMiddleware.single('image'), createProduct); // Added uploadMiddleware
router.put('/:id', auth, uploadMiddleware.single('image'), updateProduct); // Added uploadMiddleware
router.get('/', auth, getProducts);
router.get('/:id', auth, getProductById);
router.delete('/:id', auth, deleteProduct);
router.post('/bulk', auth, bulkUpdate); // Assuming bulk update doesn't involve file uploads directly in its body
router.get('/stock/low', auth, checkLowStock);

module.exports = router;