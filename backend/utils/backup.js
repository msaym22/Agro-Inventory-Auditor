// backend/utils/backup.js
const fs = require('fs');
const path = require('path');
const { Product, Customer, Sale } = require('../models');
const { encrypt, decrypt } = require('./encryption');
const moment = require('moment');

// Define the backup directory from environment variables, fallback to 'backups'
const BACKUP_DIR = process.env.BACKUP_DIR || 'backups';
const backupDirPath = path.join(__dirname, '../..', BACKUP_DIR); // Correct path to project root/backups

const backupDatabase = async () => {
  try {
    console.log('Inside backupDatabase function...'); // Add this log
    console.log('Backup directory path:', backupDirPath); // Log the actual path being used

    if (!fs.existsSync(backupDirPath)) {
      console.log('Backup directory does not exist, attempting to create:', backupDirPath); // Add this log
      fs.mkdirSync(backupDirPath, { recursive: true });
      console.log('Backup directory created.'); // Add this log
    }

    const products = await Product.findAll();
    const customers = await Customer.findAll();
    const sales = await Sale.findAll();

    const backupData = {
      timestamp: new Date(),
      products: products.map(p => p.toJSON()),
      customers: customers.map(c => c.toJSON()),
      sales: sales.map(s => s.toJSON())
    };

    const jsonData = JSON.stringify(backupData);
    const encrypted = encrypt(jsonData); // This returns a string like "iv:encryptedData"

    const timestamp = moment().format('YYYYMMDD_HHmmss'); // Timestamp moved here for clarity
    const backupPath = path.join(backupDirPath, `backup_${timestamp}.enc`);
    console.log('Attempting to write backup file to:', backupPath); // Add this log
    fs.writeFileSync(backupPath, encrypted);

    console.log(`Backup created: ${backupPath}`);
    return backupPath;
  } catch (err) {
    console.error('Backup failed in utils/backup.js:', err); // Make error log more specific
    throw err;
  }
};

const getBackupHistory = async () => {
  try {
    if (!fs.existsSync(backupDirPath)) {
      return []; // Return empty array if directory doesn't exist yet
    }

    const files = fs.readdirSync(backupDirPath);
    const backupFiles = files
      .filter(file => file.startsWith('backup_') && file.endsWith('.enc')) // Filter for .enc files
      .map(file => {
        const filePath = path.join(backupDirPath, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          date: stats.birthtime, // Use creation date
          size: `${(stats.size / (1024 * 1024)).toFixed(2)} MB` // Size in MB
        };
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date descending

    return backupFiles;
  } catch (err) {
    console.error('Failed to get backup history:', err);
    throw err;
  }
};

const scheduleBackups = () => {
  // Check if scheduling is already running to prevent multiple intervals
  if (global.backupSchedulerInterval) {
    console.log('Backup scheduler already running.');
    return;
  }

  // Schedule to run every 24 hours (24 * 60 * 60 * 1000 milliseconds)
  global.backupSchedulerInterval = setInterval(async () => {
    try {
      await backupDatabase();
      console.log('Scheduled backup completed.');
    } catch (err) {
      console.error('Scheduled backup failed:', err);
    }
  }, 24 * 60 * 60 * 1000); // Daily backup

  console.log('Backup scheduling initiated.');
};


module.exports = {
  backupDatabase,
  getBackupHistory,
  scheduleBackups
};