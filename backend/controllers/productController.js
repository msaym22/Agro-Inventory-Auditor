const db = require('../models');
const { Op } = require('sequelize');
const XLSX = require('xlsx');

const createProduct = async (req, res) => {
  try {
    const productData = req.body || {};

    if (req.file) {
      const normalized = req.file.path.replace(/\\/g, '/');
      const idx = normalized.lastIndexOf('/uploads/');
      productData.image = idx !== -1 ? normalized.substring(idx + 1) : normalized;
    }

    // Normalize numeric fields
    if (productData.sellingPrice !== undefined) productData.sellingPrice = parseFloat(productData.sellingPrice);
    if (productData.purchasePrice !== undefined) {
      productData.purchasePrice = productData.purchasePrice === '' || productData.purchasePrice === null
        ? 0
        : parseFloat(productData.purchasePrice);
    }
    if (productData.minimumPrice !== undefined) {
      productData.minimumPrice = productData.minimumPrice === '' || productData.minimumPrice === null
        ? 0
        : parseFloat(productData.minimumPrice);
    }
    if (productData.stock !== undefined) productData.stock = productData.stock === '' ? 0 : parseInt(productData.stock);

    const product = await db.Product.create(productData);

    res.status(201).json(product);
  } catch (err) {
    console.error('Product creation failed:', err);
    res.status(500).json({ error: 'Product creation failed', details: err.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const updates = req.body || {};
    
    if (req.file) {
      console.log('Received file for update:', req.file);
      const normalized = req.file.path.replace(/\\/g, '/');
      const idx = normalized.lastIndexOf('/uploads/');
      updates.image = idx !== -1 ? normalized.substring(idx + 1) : normalized;
    } else {
      console.log('No file received for update.');
    }
    
    // Normalize numeric fields similar to create
    if (updates.sellingPrice !== undefined) {
      updates.sellingPrice = updates.sellingPrice === '' || updates.sellingPrice === null
        ? 0
        : parseFloat(updates.sellingPrice);
    }
    if (updates.purchasePrice !== undefined) {
      updates.purchasePrice = updates.purchasePrice === '' || updates.purchasePrice === null
        ? 0
        : parseFloat(updates.purchasePrice);
    }
    if (updates.minimumPrice !== undefined) {
      updates.minimumPrice = updates.minimumPrice === '' || updates.minimumPrice === null
        ? 0
        : parseFloat(updates.minimumPrice);
    }
    if (updates.stock !== undefined) {
      updates.stock = updates.stock === '' || updates.stock === null
        ? 0
        : parseInt(updates.stock);
    }
    
    // Remove id if present
    if (updates.id) delete updates.id;
    
    const [updated] = await db.Product.update(updates, { where: { id: productId } });

    if (updated) {
      const updatedProduct = await db.Product.findByPk(productId);
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
       { name: { [Op.like]: `%${search}%` } },
       { nameUrdu: { [Op.like]: `%${search}%` } }
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

    const { count = 0, rows = [] } = await db.Product.findAndCountAll({
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
    const product = await db.Product.findByPk(req.params.id);

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
  let transaction;
  try {
    const models = db;

    transaction = await db.Product.sequelize.transaction();

    const product = await db.Product.findByPk(req.params.id, {
      include: [{ model: models.SaleItem, as: 'saleItems' }],
      transaction
    });

    if (!product) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Product not found' });
    }

    // If the product is part of any sale items, we will delete those sale items,
    // and delete their parent sales if they become empty. Also restore stock.
    const saleItemList = product.saleItems || [];
    if (saleItemList.length > 0) {
      // Group sale items by saleId
      const saleIdToItems = new Map();
      for (const item of saleItemList) {
        if (!saleIdToItems.has(item.saleId)) saleIdToItems.set(item.saleId, []);
        saleIdToItems.get(item.saleId).push(item);
      }

      // Restore stock for each sale item of this product and delete those items
      for (const items of saleIdToItems.values()) {
        for (const item of items) {
          // Restore stock of this product
          product.stock = (product.stock || 0) + item.quantity;
        }
      }
      await product.save({ transaction });

      // Delete all sale items for this product
      await models.SaleItem.destroy({ where: { productId: product.id }, transaction });

      // For each affected sale, if it has no remaining items, delete the sale as well
      for (const [saleId] of saleIdToItems) {
        const remainingCount = await models.SaleItem.count({ where: { saleId }, transaction });
        if (remainingCount === 0) {
          // Also remove payments associated to that sale
          await models.Payment.destroy({ where: { saleId }, transaction });
          await models.Sale.destroy({ where: { id: saleId }, transaction });
        }
      }
    }

    // Finally delete the product
    await db.Product.destroy({ where: { id: product.id }, transaction });

    await transaction.commit();
    return res.status(204).send();
  } catch (err) {
    if (transaction) await transaction.rollback();
    console.error('Product deletion failed (cascade):', err);
    return res.status(500).json({ error: 'Deletion failed', details: err.message });
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

const importProducts = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null });

    const results = { created: 0, updated: 0, skipped: 0 };

    for (const row of rows) {
      const name = row.name || row.Name || row.product || row.Product;
      if (!name) { results.skipped++; continue; }

      const existing = await Product.findOne({ where: { name } });
      const payload = {
        name,
        nameUrdu: row.nameUrdu || row.NameUrdu || null,
        category: row.category || row.Category || null,
        storageLocation: row.storageLocation || row.Location || row.SKU || null,
        sellingPrice: row.sellingPrice != null ? parseFloat(row.sellingPrice) : undefined,
        purchasePrice: row.purchasePrice != null ? parseFloat(row.purchasePrice) : undefined,
        minimumPrice: row.minimumPrice != null ? parseFloat(row.minimumPrice) : undefined,
        stock: row.stock != null ? parseInt(row.stock) : undefined,
        description: row.description || null,
        supplier: row.supplier || null,
      };

      // Remove undefined to avoid overwriting with undefined
      Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

      if (existing) {
        await existing.update(payload);
        results.updated++;
      } else {
        // Ensure required fields
        if (payload.sellingPrice == null) payload.sellingPrice = 0;
        if (payload.purchasePrice == null) payload.purchasePrice = 0;
        if (payload.stock == null) payload.stock = 0;
        await Product.create(payload);
        results.created++;
      }
    }

    res.json({ message: 'Import completed', results });
  } catch (err) {
    console.error('Import products failed:', err);
    res.status(500).json({ error: 'Import failed', details: err.message });
  }
};

module.exports = {
  createProduct,
  updateProduct,
  getProducts,
  getProductById,
  deleteProduct,
  bulkUpdate,
  checkLowStock,
  importProducts
};
