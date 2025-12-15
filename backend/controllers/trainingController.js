const { Product, TrainingImage, AIModel } = require('../models');
const { extractImageFeatures } = require('../utils/imageProcessor');
const path = require('path');
const fs = require('fs').promises;

/**
 * Get all products for training selection
 */
exports.getProductsForTraining = async (req, res) => {
  try {
    const products = await Product.findAll({
      order: [['name', 'ASC']],
      include: [{
        model: AIModel,
        as: 'aiModel',
        required: false
      }, {
        model: TrainingImage,
        as: 'trainingImages',
        required: false,
        attributes: ['id'] // Only get ID for counting
      }]
    });

    const productsWithStats = products.map(product => ({
      id: product.id,
      name: product.name,
      nameUrdu: product.nameUrdu,
      sku: product.sku,
      image: product.image,
      trainingImagesCount: product.trainingImages ? product.trainingImages.length : 0,
      aiModel: product.aiModel ? {
        id: product.aiModel.id,
        trainingStatus: product.aiModel.trainingStatus,
        trainingProgress: product.aiModel.trainingProgress,
        accuracy: product.aiModel.accuracy,
        lastTrainedAt: product.aiModel.lastTrainedAt,
        trainingImagesCount: product.aiModel.trainingImagesCount
      } : null
    }));

    res.json({ success: true, products: productsWithStats });
  } catch (error) {
    console.error('Error fetching products for training:', error);
    res.status(500).json({ error: 'Failed to fetch products', message: error.message });
  }
};

/**
 * Upload training images for a product
 */
exports.uploadTrainingImages = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (!req.files || !req.files.images) {
      return res.status(400).json({ error: 'No images provided' });
    }

    const images = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
    const uploadDir = path.join(__dirname, '../uploads/training', productId.toString());
    await fs.mkdir(uploadDir, { recursive: true });

    const uploadedImages = [];

    for (const image of images) {
      const fileName = `${Date.now()}_${image.name}`;
      const filePath = path.join(uploadDir, fileName);

      // Save image
      await image.mv(filePath);

      try {
        // Extract features
        const features = await extractImageFeatures(filePath);

        // Save to database
        const trainingImage = await TrainingImage.create({
          productId,
          imagePath: `/uploads/training/${productId}/${fileName}`,
          features,
          metadata: {
            originalName: image.name,
            size: image.size,
            mimetype: image.mimetype
          }
        });

        uploadedImages.push({
          id: trainingImage.id,
          imagePath: trainingImage.imagePath,
          uploadedAt: trainingImage.uploadedAt
        });
      } catch (error) {
        console.error(`Error processing image ${image.name}:`, error);
        // Delete file if feature extraction failed
        await fs.unlink(filePath).catch(() => {});
      }
    }

    // Update or create AI model record
    let aiModel = await AIModel.findOne({ where: { productId } });
    const totalImagesCount = await TrainingImage.count({ where: { productId } });
    
    if (!aiModel) {
      aiModel = await AIModel.create({
        productId,
        trainingStatus: 'pending',
        trainingImagesCount: totalImagesCount
      });
    } else {
      aiModel.trainingImagesCount = totalImagesCount;
      // Reset training status if new images added to a completed/failed model
      if (aiModel.trainingStatus === 'completed' || aiModel.trainingStatus === 'failed') {
        aiModel.trainingStatus = 'pending';
        aiModel.accuracy = null;
      }
      await aiModel.save();
    }

    res.json({
      success: true,
      uploadedCount: uploadedImages.length,
      images: uploadedImages,
      aiModel: {
        id: aiModel.id,
        trainingStatus: aiModel.trainingStatus,
        trainingProgress: aiModel.trainingProgress,
        trainingImagesCount: aiModel.trainingImagesCount
      }
    });
  } catch (error) {
    console.error('Error uploading training images:', error);
    res.status(500).json({ error: 'Failed to upload training images', message: error.message });
  }
};

/**
 * Get training images for a product
 */
exports.getTrainingImages = async (req, res) => {
  try {
    const { productId } = req.params;

    const trainingImages = await TrainingImage.findAll({
      where: { productId },
      order: [['uploadedAt', 'DESC']],
      include: [{
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'nameUrdu', 'sku']
      }]
    });

    res.json({ success: true, images: trainingImages });
  } catch (error) {
    console.error('Error fetching training images:', error);
    res.status(500).json({ error: 'Failed to fetch training images', message: error.message });
  }
};

/**
 * Delete a training image
 */
exports.deleteTrainingImage = async (req, res) => {
  try {
    const { id } = req.params;

    const trainingImage = await TrainingImage.findByPk(id);
    if (!trainingImage) {
      return res.status(404).json({ error: 'Training image not found' });
    }

    // Delete file
    const filePath = path.join(__dirname, '..', trainingImage.imagePath);
    await fs.unlink(filePath).catch(() => {});

    // Delete from database
    await trainingImage.destroy();

    // Update AI model count
    const aiModel = await AIModel.findOne({ where: { productId: trainingImage.productId } });
    if (aiModel) {
      aiModel.trainingImagesCount = await TrainingImage.count({ where: { productId: trainingImage.productId } });
      await aiModel.save();
    }

    res.json({ success: true, message: 'Training image deleted' });
  } catch (error) {
    console.error('Error deleting training image:', error);
    res.status(500).json({ error: 'Failed to delete training image', message: error.message });
  }
};

/**
 * Train AI model for a product
 */
exports.trainModel = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const trainingImages = await TrainingImage.findAll({
      where: { productId }
    });

    if (trainingImages.length < 3) {
      return res.status(400).json({ error: 'At least 3 training images are required' });
    }

    let aiModel = await AIModel.findOne({ where: { productId } });
    if (!aiModel) {
      aiModel = await AIModel.create({
        productId,
        trainingStatus: 'training',
        trainingProgress: 0,
        trainingImagesCount: trainingImages.length
      });
    } else {
      aiModel.trainingStatus = 'training';
      aiModel.trainingProgress = 0;
      await aiModel.save();
    }

    // Simulate training process (in real implementation, this would train a ML model)
    // For now, we'll just aggregate features
    const modelData = {
      productId,
      trainingImagesCount: trainingImages.length,
      averageFeatures: {},
      featureVariances: {},
      trainedAt: new Date()
    };

    // Calculate average features and variances
    if (trainingImages.length > 0 && trainingImages[0].features) {
      const featureKeys = Object.keys(trainingImages[0].features);
      
      for (const key of featureKeys) {
        const firstValue = trainingImages[0].features[key];
        
        if (typeof firstValue === 'object' && firstValue !== null && !Array.isArray(firstValue)) {
          // Handle nested objects (e.g., colorHistogram, edgeFeatures, etc.)
          modelData.averageFeatures[key] = {};
          modelData.featureVariances[key] = {};
          
          const nestedKeys = Object.keys(firstValue);
          for (const nestedKey of nestedKeys) {
            const nestedValues = trainingImages
              .map(img => img.features[key] && img.features[key][nestedKey])
              .filter(v => v != null && typeof v === 'number');
            
            if (nestedValues.length > 0) {
              const mean = nestedValues.reduce((a, b) => a + b, 0) / nestedValues.length;
              const variance = nestedValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / nestedValues.length;
              modelData.averageFeatures[key][nestedKey] = mean;
              modelData.featureVariances[key][nestedKey] = variance;
            } else if (Array.isArray(firstValue[nestedKey])) {
              // Handle arrays (e.g., histogram bins)
              const arrayLength = firstValue[nestedKey].length;
              const averagedArray = new Array(arrayLength).fill(0);
              
              trainingImages.forEach(img => {
                if (img.features[key] && Array.isArray(img.features[key][nestedKey])) {
                  img.features[key][nestedKey].forEach((val, idx) => {
                    if (idx < arrayLength && typeof val === 'number') {
                      averagedArray[idx] += val;
                    }
                  });
                }
              });
              
              modelData.averageFeatures[key][nestedKey] = averagedArray.map(v => v / trainingImages.length);
            } else if (typeof firstValue[nestedKey] === 'object') {
              // Recursively handle deeper nested objects
              modelData.averageFeatures[key][nestedKey] = {};
              const deeperValues = trainingImages
                .map(img => img.features[key] && img.features[key][nestedKey])
                .filter(v => v != null);
              
              if (deeperValues.length > 0) {
                const deeperKeys = Object.keys(deeperValues[0]);
                for (const deeperKey of deeperKeys) {
                  const numValues = deeperValues
                    .map(v => v[deeperKey])
                    .filter(v => v != null && typeof v === 'number');
                  
                  if (numValues.length > 0) {
                    modelData.averageFeatures[key][nestedKey][deeperKey] = 
                      numValues.reduce((a, b) => a + b, 0) / numValues.length;
                  }
                }
              }
            }
          }
        } else if (Array.isArray(firstValue)) {
          // Handle arrays directly
          const arrayLength = firstValue.length;
          const averagedArray = new Array(arrayLength).fill(0);
          
          trainingImages.forEach(img => {
            if (Array.isArray(img.features[key])) {
              img.features[key].forEach((val, idx) => {
                if (idx < arrayLength && typeof val === 'number') {
                  averagedArray[idx] += val;
                }
              });
            }
          });
          
          modelData.averageFeatures[key] = averagedArray.map(v => v / trainingImages.length);
        } else if (typeof firstValue === 'number') {
          // Handle numeric values
          const values = trainingImages
            .map(img => img.features[key])
            .filter(v => v != null && typeof v === 'number');
          
          if (values.length > 0) {
            const mean = values.reduce((a, b) => a + b, 0) / values.length;
            const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
            modelData.averageFeatures[key] = mean;
            modelData.featureVariances[key] = variance;
          }
        }
      }
    }

    // Update model
    aiModel.modelData = modelData;
    aiModel.trainingStatus = 'completed';
    aiModel.trainingProgress = 100;
    aiModel.accuracy = 0.85; // Simulated accuracy
    aiModel.lastTrainedAt = new Date();
    await aiModel.save();

    res.json({
      success: true,
      aiModel: {
        id: aiModel.id,
        trainingStatus: aiModel.trainingStatus,
        trainingProgress: aiModel.trainingProgress,
        accuracy: aiModel.accuracy,
        trainingImagesCount: aiModel.trainingImagesCount,
        lastTrainedAt: aiModel.lastTrainedAt
      }
    });
  } catch (error) {
    console.error('Error training model:', error);
    
    // Update model status to failed
    try {
      const aiModel = await AIModel.findOne({ where: { productId: req.params.productId } });
      if (aiModel) {
        aiModel.trainingStatus = 'failed';
        await aiModel.save();
      }
    } catch (e) {}

    res.status(500).json({ error: 'Failed to train model', message: error.message });
  }
};

/**
 * Get training statistics
 */
exports.getTrainingStats = async (req, res) => {
  try {
    const totalProducts = await Product.count();
    const productsWithTraining = await Product.count({
      include: [{
        model: TrainingImage,
        as: 'trainingImages',
        required: true
      }]
    });

    const totalTrainingImages = await TrainingImage.count();
    
    const modelsByStatus = await AIModel.findAll({
      attributes: [
        'trainingStatus',
        [AIModel.sequelize.fn('COUNT', AIModel.sequelize.col('id')), 'count']
      ],
      group: ['trainingStatus']
    });

    const stats = {
      totalProducts,
      productsWithTraining,
      productsWithoutTraining: totalProducts - productsWithTraining,
      totalTrainingImages,
      modelsByStatus: modelsByStatus.reduce((acc, item) => {
        acc[item.trainingStatus] = parseInt(item.dataValues.count);
        return acc;
      }, {})
    };

    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching training stats:', error);
    res.status(500).json({ error: 'Failed to fetch training statistics', message: error.message });
  }
};

