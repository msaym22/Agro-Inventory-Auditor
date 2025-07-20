// backend/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload'); // Make sure upload is imported

const {
  createProduct,
  updateProduct, // Controller for updating
  getProducts,
  getProductById,
  deleteProduct,
  bulkUpdate,
  checkLowStock
} = require('../controllers/productController');

// Route for creating a product (already uses upload.single)
router.post('/', auth, upload.single('image'), createProduct);

// CORRECTED: Route for updating a product - apply upload.single middleware here
router.put('/:id', auth, upload.single('image'), updateProduct); // Add upload.single('image')

router.get('/', auth, getProducts);
router.get('/:id', auth, getProductById);
router.delete('/:id', auth, deleteProduct);
router.post('/bulk', auth, bulkUpdate);
router.get('/stock/low', auth, checkLowStock);

module.exports = router;