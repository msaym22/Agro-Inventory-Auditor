const express = require('express');
const router = express.Router();
const trainingController = require('../controllers/trainingController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Get products for training
router.get('/products', trainingController.getProductsForTraining);

// Get training images for a product
router.get('/products/:productId/images', trainingController.getTrainingImages);

// Upload training images
router.post('/upload', trainingController.uploadTrainingImages);

// Delete training image
router.delete('/images/:id', trainingController.deleteTrainingImage);

// Train AI model for a product
router.post('/train/:productId', trainingController.trainModel);

// Get training statistics
router.get('/stats', trainingController.getTrainingStats);

module.exports = router;

