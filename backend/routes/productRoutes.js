// backend/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth'); // CORRECTED IMPORT
const uploadMiddleware = require('../middleware/upload'); 

const {
  createProduct,
  updateProduct,
  getProducts,
  getProductById,
  deleteProduct,
  bulkUpdate,
  checkLowStock
} = require('../controllers/productController');

// Apply middleware correctly
router.post('/', protect, uploadMiddleware.single('image'), createProduct); 
router.put('/:id', protect, uploadMiddleware.single('image'), updateProduct); 
router.get('/', protect, getProducts);
router.get('/:id', protect, getProductById);
router.delete('/:id', protect, deleteProduct);
router.post('/bulk', protect, bulkUpdate);
router.get('/stock/low', protect, checkLowStock);

module.exports = router;