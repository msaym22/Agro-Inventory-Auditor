const { Product } = require('../models');
const { Op } = require('sequelize');
const upload = require('../middleware/upload'); // Assuming upload middleware is needed for receiptImage
const { logAudit } = require('./auditController');

const createProduct = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message || 'File upload failed' });
      }

      const productData = req.body;

      if (req.file) {
        productData.image = req.file.path;
      }

      // Sequelize will automatically pick up 'nameUrdu' if it's in productData
      const product = await Product.create(productData);

      // Log audit trail if auditController is available
      // await logAudit('Product', product.id, 'create', productData, req.user.id);

      res.status(201).json(product);
    });
  } catch (err) {
    console.error('Product creation failed:', err);
    res.status(500).json({ error: 'Product creation failed', details: err.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message || 'File upload failed' });
      }

      const productData = req.body;
      const oldProduct = await Product.findByPk(req.params.id);

      if (req.file) {
        productData.image = req.file.path;
      }

      // Sequelize will automatically update 'nameUrdu' if it's in productData
      const [updated] = await Product.update(productData, {
        where: { id: req.params.id }
      });

      if (updated) {
        const newProduct = await Product.findByPk(req.params.id);
        // Log audit trail if auditController is available
        // const changes = { old: oldProduct.toJSON(), new: newProduct.toJSON() };
        // await logAudit('Product', req.params.id, 'update', changes, req.user.id);
        res.json(newProduct);
      } else {
        res.status(404).json({ error: 'Product not found' });
      }
    });
  } catch (err) {
    console.error('Product update failed:', err);
    res.status(500).json({ error: 'Update failed', details: err.message });
  }
};

const getProducts = async (req, res) => {
  const { search, category, minPrice, maxPrice, page = 1, limit = 20 } = req.query;

  const where = {};

  if (search) {
    where.name = { [Op.iLike]: `%${search}%` };
    // Optionally search by nameUrdu as well
    // where[Op.or] = [
    //   { name: { [Op.iLike]: `%${search}%` } },
    //   { nameUrdu: { [Op.iLike]: `%${search}%` } }
    // ];
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