const { Product, TrainingImage, AIModel } = require('../models');
const { extractImageFeatures, compareFeatures } = require('../utils/imageProcessor');
const path = require('path');
const fs = require('fs').promises;

/**
 * Detect product from uploaded image
 */
exports.detectProduct = async (req, res) => {
  try {
    if (!req.files || !req.files.image) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const imageFile = req.files.image;
    const uploadPath = path.join(__dirname, '../uploads/temp', `${Date.now()}_${imageFile.name}`);
    
    // Ensure temp directory exists
    const tempDir = path.join(__dirname, '../uploads/temp');
    await fs.mkdir(tempDir, { recursive: true });

    // Save uploaded image temporarily
    await imageFile.mv(uploadPath);

    try {
      // Extract features from uploaded image
      const queryFeatures = await extractImageFeatures(uploadPath);

      // Get all products with completed training models
      const products = await Product.findAll({
        include: [{
          model: AIModel,
          as: 'aiModel',
          where: {
            trainingStatus: 'completed'
          },
          required: true // Only get products with completed models
        }]
      });

      const matches = [];

      // Compare with training images for each product
      // Also use model data if available for better matching
      for (const product of products) {
        const trainingImages = await TrainingImage.findAll({
          where: { productId: product.id }
        });

        if (trainingImages.length === 0) continue;

        let bestMatch = 0;
        let totalSimilarity = 0;
        let validComparisons = 0;

        // Compare with individual training images
        for (const trainingImage of trainingImages) {
          if (!trainingImage.features) continue;

          try {
            const similarity = compareFeatures(queryFeatures, trainingImage.features);
            totalSimilarity += similarity;
            bestMatch = Math.max(bestMatch, similarity);
            validComparisons++;
          } catch (error) {
            console.error(`Error comparing features for product ${product.id}:`, error);
          }
        }

        // Also compare with aggregated model data if available
        let modelSimilarity = 0;
        if (product.aiModel && product.aiModel.modelData && product.aiModel.modelData.averageFeatures) {
          try {
            modelSimilarity = compareFeatures(queryFeatures, product.aiModel.modelData.averageFeatures);
            bestMatch = Math.max(bestMatch, modelSimilarity);
          } catch (error) {
            console.error(`Error comparing with model data for product ${product.id}:`, error);
          }
        }

        if (validComparisons === 0) continue;

        const avgSimilarity = totalSimilarity / validComparisons;
        const finalConfidence = Math.max(bestMatch, avgSimilarity, modelSimilarity);

        // Threshold for matching (can be adjusted)
        if (finalConfidence > 0.3) {
          matches.push({
            product: {
              id: product.id,
              name: product.name,
              nameUrdu: product.nameUrdu,
              image: product.image,
              sku: product.sku,
              stock: product.stock,
              sellingPrice: product.sellingPrice
            },
            confidence: finalConfidence,
            bestMatch,
            avgSimilarity,
            modelSimilarity: modelSimilarity > 0 ? modelSimilarity : undefined
          });
        }
      }

      // Sort by confidence (descending)
      matches.sort((a, b) => b.confidence - a.confidence);

      // Clean up temp file
      await fs.unlink(uploadPath).catch(() => {});

      res.json({
        success: true,
        matches: matches.slice(0, 10), // Return top 10 matches
        queryFeatures: {
          dimensions: queryFeatures.dimensions,
          shapeFeatures: queryFeatures.shapeFeatures
        }
      });
    } catch (error) {
      // Clean up temp file on error
      await fs.unlink(uploadPath).catch(() => {});
      throw error;
    }
  } catch (error) {
    console.error('Error detecting product:', error);
    res.status(500).json({ error: 'Failed to detect product', message: error.message });
  }
};

