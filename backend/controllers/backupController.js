// backend/controllers/backupController.js
const { backupDatabase, getBackupHistory } = require('../utils/backup');
const fs = require('fs');
const path = require('path');
const upload = require('../middleware/upload'); // Ensure upload is imported for restoreBackup

const createBackup = async (req, res) => {
  try {
    console.log('Attempting to create backup...');
    const backupPath = await backupDatabase();
    console.log('BackupDatabase function completed, path:', backupPath);
    res.status(200).json({ message: 'Backup created successfully', path: backupPath });
  } catch (err) {
    console.error('Backup creation failed in controller:', err);
    res.status(500).json({ error: 'Backup creation failed', details: err.message });
  }
};

const restoreBackup = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const backupFile = req.file;
  const backupDir = path.join(__dirname, '../../', process.env.BACKUP_DIR || 'backups');

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const filePath = path.join(backupDir, backupFile.filename);

  try {
    const encryptedDataString = fs.readFileSync(filePath, 'utf8');
    const { decrypt } = require('../utils/encryption');
    
    const decryptedJsonString = decrypt(encryptedDataString);
    const { products, customers, sales } = JSON.parse(decryptedJsonString);

    await require('../models').sequelize.sync({ force: true });
    console.log('Database tables recreated for restore.');

    await require('../models').Product.bulkCreate(products);
    await require('../models').Customer.bulkCreate(customers);
    await require('../models').Sale.bulkCreate(sales);
    
    const { SaleItem } = require('../models');
    sales.forEach(async (saleRecord) => {
      if (saleRecord.items && saleRecord.items.length > 0) {
        await SaleItem.bulkCreate(saleRecord.items.map(item => ({
          ...item,
          saleId: saleRecord.id
        })));
      }
    });

    res.json({ message: 'Restore completed successfully' });
  } catch (err) {
    console.error('Restore failed:', err);
    res.status(500).json({ error: 'Restore failed', details: err.message });
  } finally {
    if (fs.existsSync(filePath)) {
      // fs.unlinkSync(filePath);
    }
  }
};

const getHistory = async (req, res) => {
  try {
    const history = await getBackupHistory();
    res.json({ backups: history });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch backup history', details: err.message });
  }
};

const downloadBackup = async (req, res) => {
  try {
    const { filename } = req.params;
    const backupDir = path.join(__dirname, '../../', process.env.BACKUP_DIR || 'backups');
    const filePath = path.join(backupDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Backup file not found' });
    }

    res.download(filePath, (err) => {
      if (err) {
        console.error('Error downloading backup:', err);
        res.status(500).json({ error: 'Failed to download backup' });
      }
    });
  } catch (err) {
    console.error('Download backup failed:', err);
    res.status(500).json({ error: 'Download backup failed', details: err.message });
  }
};

module.exports = {
  createBackup,
  restoreBackup,
  getHistory,
  downloadBackup,
};