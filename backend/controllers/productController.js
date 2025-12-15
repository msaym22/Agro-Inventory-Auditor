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
  const { search, category, minPrice, maxPrice, page = 1, limit } = req.query;

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
    // If no limit is specified, get all products without pagination
    const queryOptions = {
      where,
      order: [['name', 'ASC']]
    };

    // Only add pagination if limit is specified
    if (limit) {
      const offset = (page - 1) * parseInt(limit);
      queryOptions.limit = parseInt(limit);
      queryOptions.offset = offset;
    }

    const { count = 0, rows = [] } = await db.Product.findAndCountAll(queryOptions);

    // If no limit, all products are on one page
    const totalPages = limit ? Math.ceil(count / parseInt(limit)) : 1;
    const itemsPerPage = limit ? parseInt(limit) : count;

    const responseData = {
      products: rows,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: parseInt(page),
        itemsPerPage: itemsPerPage
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
      db.Product.update(product, { where: { id: product.id } })
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
    const threshold = parseInt(req.query.threshold) || 10;
    const products = await db.Product.findAll({
      where: {
        stock: { [Op.lt]: threshold }
      },
      order: [['stock', 'ASC']] // Order by stock ascending (lowest first)
    });

    res.json({
      data: products,
      threshold: threshold,
      count: products.length
    });
  } catch (err) {
    console.error('Failed to check stock:', err);
    res.status(500).json({ error: 'Failed to check stock', details: err.message });
  }
};

const importProducts = async (req, res) => {
  try {
    console.log('Import products endpoint called');
    console.log('Request file:', req.file);
    console.log('Request body:', req.body);
    
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    console.log('File details:', {
      originalname: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
    
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null });

    console.log(`Importing ${rows.length} rows from Excel file`);
    console.log('Sample row structure:', rows[0]);

    const results = { created: 0, updated: 0, skipped: 0, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        // Enhanced column mapping to handle various Excel formats
        const name = row.name || row.Name || row.product || row.Product || 
                     row.englishname || row.EnglishName || row.english_name || row.englishName;
        
        if (!name) { 
          results.skipped++; 
          results.errors.push(`Row ${i + 1}: No name found`);
          continue; 
        }

        // Always create new products (append mode) - check for duplicates later
        const payload = {
          name,
          nameUrdu: row.nameUrdu || row.NameUrdu || row.urdu_name || row.urduName || null,
          category: row.category || row.Category || row.type || row.Type || null,
          storageLocation: row.storageLocation || row.Location || row.location || 
                          row.SKU || row.sku || row.warehouse || row.Warehouse || null,
          sellingPrice: row.sellingPrice != null ? parseFloat(row.sellingPrice) : 
                       (row['selling price'] != null ? parseFloat(row['selling price']) :
                       (row.selling_price != null ? parseFloat(row.selling_price) : 
                       (row.price != null ? parseFloat(row.price) : 
                       (row.Price != null ? parseFloat(row.Price) : undefined)))),
          purchasePrice: row.purchasePrice != null ? parseFloat(row.purchasePrice) : 
                        (row['purchase price'] != null ? parseFloat(row['purchase price']) :
                        (row.purchase_price != null ? parseFloat(row.purchase_price) : 
                        (row.cost != null ? parseFloat(row.cost) : 
                        (row.Cost != null ? parseFloat(row.Cost) : undefined)))),
          minimumPrice: row.minimumPrice != null ? parseFloat(row.minimumPrice) : 
                       (row['minimum price'] != null ? parseFloat(row['minimum price']) :
                       (row.minimum_price != null ? parseFloat(row.minimum_price) : 
                       (row.min_price != null ? parseFloat(row.min_price) : undefined))),
          stock: row.stock != null ? parseInt(row.stock) : 
                 (row.inventory != null ? parseInt(row.inventory) : 
                 (row.quantity != null ? parseInt(row.quantity) : 
                 (row.Quantity != null ? parseInt(row.Quantity) : undefined))),
          description: row.description || row.Description || row.desc || row.Desc || null,
          supplier: row.supplier || row.Supplier || row.vendor || row.Vendor || 
                   row.supplier_name || row.supplierName || null,
        };

        // Remove undefined to avoid overwriting with undefined
        Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

        // Always create new products (append mode)
        // Ensure required fields
        if (payload.sellingPrice == null) payload.sellingPrice = 0;
        if (payload.purchasePrice == null) payload.purchasePrice = 0;
        if (payload.stock == null) payload.stock = 0;
        await db.Product.create(payload);
        results.created++;
        console.log(`Created product: ${name}`);
      } catch (error) {
        results.errors.push(`Row ${i + 1}: ${error.message}`);
        console.error(`Error processing row ${i + 1}:`, error);
      }
    }

    res.json({ message: 'Import completed', results });
  } catch (err) {
    console.error('Import products failed:', err);
    res.status(500).json({ error: 'Import failed', details: err.message });
  }
};

const findDuplicateProducts = async (req, res) => {
  try {
    // Find products with the same name
    const duplicates = await db.Product.findAll({
      attributes: [
        'name',
        [db.Product.sequelize.fn('COUNT', db.Product.sequelize.col('id')), 'count'],
        [db.Product.sequelize.fn('GROUP_CONCAT', db.Product.sequelize.col('id')), 'productIds']
      ],
      group: ['name'],
      having: db.Product.sequelize.literal('COUNT(id) > 1'),
      raw: true
    });

    // Get full product details for each duplicate group
    const duplicateGroups = [];
    for (const duplicate of duplicates) {
      const productIds = duplicate.productIds.split(',');
      const products = await db.Product.findAll({
        where: { id: productIds },
        order: [['createdAt', 'ASC']] // Oldest first
      });
      duplicateGroups.push({
        name: duplicate.name,
        count: parseInt(duplicate.count),
        products: products
      });
    }

    res.json({
      duplicates: duplicateGroups,
      totalDuplicateGroups: duplicateGroups.length
    });
  } catch (error) {
    console.error('Error finding duplicate products:', error);
    res.status(500).json({ error: 'Failed to find duplicate products', details: error.message });
  }
};

const mergeDuplicateProducts = async (req, res) => {
  try {
    const { productIds, keepProductId } = req.body;
    
    if (!productIds || !Array.isArray(productIds) || productIds.length < 2) {
      return res.status(400).json({ error: 'Invalid product IDs provided' });
    }
    
    if (!keepProductId || !productIds.includes(keepProductId.toString())) {
      return res.status(400).json({ error: 'Invalid keep product ID provided' });
    }

    const transaction = await db.Product.sequelize.transaction();
    
    try {
      // Get the product to keep
      const keepProduct = await db.Product.findByPk(keepProductId, { transaction });
      if (!keepProduct) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Product to keep not found' });
      }

      // Get all products to merge
      const productsToMerge = await db.Product.findAll({
        where: { 
          id: productIds.filter(id => id.toString() !== keepProductId.toString())
        },
        transaction
      });

      // Sum up stock from all products
      let totalStock = keepProduct.stock || 0;
      for (const product of productsToMerge) {
        totalStock += product.stock || 0;
      }

      // Update the keep product with combined stock
      await keepProduct.update({ stock: totalStock }, { transaction });

      // Update all sale items to point to the keep product
      for (const product of productsToMerge) {
        await db.SaleItem.update(
          { productId: keepProductId },
          { where: { productId: product.id }, transaction }
        );
      }

      // Delete the duplicate products
      await db.Product.destroy({
        where: { 
          id: productIds.filter(id => id.toString() !== keepProductId.toString())
        },
        transaction
      });

      await transaction.commit();
      
      res.json({ 
        message: 'Products merged successfully',
        keptProduct: keepProduct,
        mergedCount: productsToMerge.length,
        totalStock: totalStock
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error merging duplicate products:', error);
    res.status(500).json({ error: 'Failed to merge duplicate products', details: error.message });
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
  importProducts,
  findDuplicateProducts,
  mergeDuplicateProducts
};
