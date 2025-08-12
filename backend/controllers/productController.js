// backend/controllers/productController.js
const { Product } = require('../models');
const { Op } = require('sequelize');

const createProduct = async (req, res) => {
  try {
    const productData = req.body;

    if (req.file) {
      productData.image = req.file.path;
    }

    const product = await Product.create(productData);

    // TODO: Add audit log if needed
    // await logAudit('Product', product.id, 'create', productData, req.user.id);

    res.status(201).json(product);
  } catch (err) {
    console.error('Product creation failed:', err);
    res.status(500).json({ error: 'Product creation failed', details: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    let updates = req.body;
    
    if (req.file) {
      updates.image = req.file.filename;
    }
    
    // Convert numeric fields
    if (updates.sellingPrice) updates.sellingPrice = parseFloat(updates.sellingPrice);
    if (updates.purchasePrice) updates.purchasePrice = parseFloat(updates.purchasePrice);
    if (updates.minimumPrice) updates.minimumPrice = parseFloat(updates.minimumPrice);
    if (updates.stock) updates.stock = parseInt(updates.stock);
    
    // Remove id if present
    if (updates.id) delete updates.id;
    
    const [updated] = await Product.update(updates, {
      where: { id: productId }
    });

    if (updated) {
      const updatedProduct = await Product.findByPk(productId);
      res.json(updatedProduct);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};


const getProducts = async (req, res) => {
  const { search, category, minPrice, maxPrice, page = 1, limit = 20 } = req.query;

  const where = {};

  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { nameUrdu: { [Op.iLike]: `%${search}%` } }
    ];
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
      // TODO: Add audit log if needed
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