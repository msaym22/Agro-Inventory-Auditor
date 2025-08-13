const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { imageUpload, backupUpload } = require('../middleware/upload');
const multer = require('multer');

const {
  createProduct,
  updateProduct,
  getProducts,
  getProductById,
  deleteProduct,
  bulkUpdate,
  checkLowStock,
  importProducts
} = require('../controllers/productController');

// Helper function to handle Multer errors
const handleMulterError = (req, res, next) => {
    imageUpload.single('image')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            console.error('Multer error:', err);
            return res.status(400).json({ error: 'File upload error', details: err.message });
        } else if (err) {
            console.error('Unknown upload error:', err);
            return res.status(500).json({ error: 'File upload failed', details: err.message });
        }
        next();
    });
};

// Prefer static routes before dynamic param routes
router.get('/stock/low', protect, checkLowStock);
router.post('/bulk', protect, bulkUpdate);
router.post('/import', protect, (req, res, next) => {
  backupUpload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: 'Upload failed', details: err.message });
    }
    next();
  });
}, importProducts);

router.get('/', protect, getProducts);
router.get('/:id', protect, getProductById);

router.post('/', protect, handleMulterError, createProduct);
router.put('/:id', protect, handleMulterError, updateProduct);
router.delete('/:id', protect, deleteProduct);

module.exports = router;
