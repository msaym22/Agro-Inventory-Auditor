// backend/controllers/productController.js
const { Product } = require('../models');
const { Op } = require('sequelize');
// REMOVE THIS LINE: const upload = require('../middleware/upload'); // No longer needed here
const { logAudit } = require('./auditController'); // If you're using audit logs

const createProduct = async (req, res) => {
  try {
    // Multer middleware (upload.single('image')) from productRoutes.js
    // has already run by the time this function is executed.
    // req.body and req.file (if a file was uploaded) are already available.

    const productData = req.body;

    if (req.file) {
      productData.image = req.file.path; // Set the path from the uploaded file
    } else {
      // If no new image is uploaded, ensure existing image path is preserved if it's an update,
      // or set to null/default for a new product if no image is selected.
      // For create, it's typically null if no file is sent.
      productData.image = null; 
    }

    const product = await Product.create(productData);

    // Log audit trail if auditController is available
    // await logAudit('Product', product.id, 'create', productData, req.user.id);

    res.status(201).json(product);
  } catch (err) {
    console.error('Product creation failed:', err);
    res.status(500).json({ error: 'Product creation failed', details: err.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    // Multer middleware (upload.single('image')) from productRoutes.js
    // has already run by the time this function is executed.
    // req.body and req.file (if a file was uploaded) are already available.

    const productData = req.body;
    const oldProduct = await Product.findByPk(req.params.id);

    if (!oldProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (req.file) {
      // A new image was uploaded, update the image path
      productData.image = req.file.path;
    } else {
      // No new image uploaded. Preserve the old image path
      // if productData.image is not explicitly set to null/empty from frontend
      // or if you want to ensure it remains the old image.
      // If frontend sends no image when no change, oldProduct.image is retained.
      // If frontend sends an empty string for image, it means clear image.
      if (productData.image === '') { // Assuming frontend sends empty string to clear image
          productData.image = null;
      } else if (productData.image === undefined || productData.image === null) {
          // If frontend didn't send an image field or sent null, retain the old image
          productData.image = oldProduct.image;
      }
      // If frontend sent a value for productData.image (e.g., the old URL), it will be used.
    }


    const [updatedRows] = await Product.update(productData, { // Changed 'updated' to 'updatedRows' for clarity
      where: { id: req.params.id }
    });

    if (updatedRows > 0) { // Check if any rows were actually updated
      const newProduct = await Product.findByPk(req.params.id);
      // Log audit trail if auditController is available
      // const changes = { old: oldProduct.toJSON(), new: newProduct.toJSON() };
      // await logAudit('Product', req.params.id, 'update', changes, req.user.id);
      res.json(newProduct);
    } else {
      // This case might mean ID not found, or no fields were actually changed
      // Frontend error handling might already catch 404 from previous check.
      res.status(404).json({ error: 'Product not found or no changes applied' });
    }
  } catch (err) {
    console.error('Product update failed:', err);
    res.status(500).json({ error: 'Update failed', details: err.message });
  }
};

// ... (rest of the productController functions: getProducts, getProductById, deleteProduct, bulkUpdate, checkLowStock)
// Ensure these functions are also using `req.body` and `req.file` directly without the `upload` wrapper.

const getProducts = async (req, res) => {
  const { search, category, minPrice, maxPrice, page = 1, limit = 20 } = req.query;

  const where = {};

  if (search) {
    where.name = { [Op.iLike]: `%${search}%` };
  }

  if (category) {
    where.category = category;
  }

  if (minPrice || maxPrice) {
    where.sellingPrice = {};
    if (minPrice) where.sellingPrice[Op.gte] = minPrice;
    if (maxPrice) where.sellingPrice[Op.lte] = maxPrice;
  }

  try {
    const offset = (page - 1) * limit;

    const { count = 0, rows = [] } = await Product.findAndCountAll({
      where,
      order: [['name', 'ASC']],
      limit: parseInt(limit),
      offset: offset
    });

    const totalPages = Math.ceil(count / limit);

    const responseData = {
      products: rows,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit)
      }
    };
    console.log('Backend getProducts sending:', JSON.stringify(responseData, null, 2));
    res.json(responseData);
  } catch (err) {
    console.error('Failed to fetch products:', err);
    res.status(500).json({ error: 'Failed to fetch products', details: err.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (err) {
    console.error('Server error fetching product by ID:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const deleted = await Product.destroy({
      where: { id: req.params.id }
    });

    if (deleted) {
      // Log audit trail if auditController is available
      // await logAudit('Product', req.params.id, 'delete', product.toJSON(), req.user.id);
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (err) {
    console.error('Product deletion failed:', err);
    res.status(500).json({ error: 'Deletion failed', details: err.message });
  }
};

const bulkUpdate = async (req, res) => {
  try {
    const products = req.body;

    const updatePromises = products.map(product =>
      Product.update(product, { where: { id: product.id } })
    );

    await Promise.all(updatePromises);
    res.json({ message: 'Bulk update successful' });
  } catch (err) {
    console.error('Bulk update failed:', err);
    res.status(500).json({ error: 'Bulk update failed' });
  }
};

const checkLowStock = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: {
        stock: { [Op.lt]: 10 }
      }
    });

    res.json(products);
  } catch (err) {
    console.error('Failed to check stock:', err);
    res.status(500).json({ error: 'Failed to check stock' });
  }
};

module.exports = {
  createProduct,
  updateProduct,
  getProducts,
  getProductById,
  deleteProduct,
  bulkUpdate,
  checkLowStock
};