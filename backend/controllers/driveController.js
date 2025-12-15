// // backend/controllers/driveController.js
// const driveSync = require('../utils/driveSync');

// exports.getAuthUrl = async (req, res) => {
//   try {
//     const authUrl = await driveSync.getAuthUrl();
//     res.json({ authUrl });
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to get auth URL' });
//   }
// };

// exports.authenticate = async (req, res) => {
//   try {
//     const { code } = req.body;
//     const tokens = await driveSync.storeToken(code);
//     res.json({ success: true, tokens });
//   } catch (error) {
//     res.status(500).json({ error: 'Authentication failed' });
//   }
// };

// exports.syncDatabase = async (req, res) => {
//   try {
//     const force = req.query.force === 'true';
//     const result = await driveSync.syncDatabase({ force });
//     res.json(result);
//   } catch (error) {
//     res.status(500).json({ error: 'Sync failed' });
//   }
// };

// exports.getStatus = async (req, res) => {
//   try {
//     const status = driveSync.getStatus();
//     res.json(status);
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to get status' });
//   }
// };

// // Quick diagnostic: return counts from current DB to verify data presence
// exports.getCounts = async (req, res) => {
//   try {
//     const db = require('../models');
//     const counts = {
//       products: await db.Product.count().catch(() => null),
//       customers: await db.Customer.count().catch(() => null),
//       sales: await db.Sale.count().catch(() => null)
//     };
//     res.json({ success: true, counts });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// };

// // New endpoints for explicit pull/push
// exports.updateDatabaseFromDrive = async (req, res) => {
//   try {
//     // Default to mergeMode=true to avoid overwriting local DB unless explicitly requested
//     const { mergeMode = true } = req.body;
//     console.log('Starting pull from Google Drive...', { mergeMode });
//     const db = require('../models');
    
//     if (mergeMode) {
//       // For merge mode, we don't close the connection
//       // Instead, we'll merge the data from Drive into the existing database
//       console.log('Merge mode enabled - will merge data instead of replacing');
//       const result = await require('../utils/driveSync').mergeDatabase();
//       console.log('Merge result:', result);
      
//       if (!result.success) {
//         return res.status(500).json({ error: 'Merge failed', details: result.error || result.reason });
//       }
      
//       console.log('Merge completed successfully');
//       // Reload sequelize models to ensure all merged data is visible immediately
//       const db = require('../models');
//       try { await db.reloadSequelize?.(); } catch (_) {}
//       // Return counts to verify data presence
//       const productCount = await db.Product.count().catch(() => null);
//       const customerCount = await db.Customer.count().catch(() => null);
//       const saleCount = await db.Sale.count().catch(() => null);
//       res.json({ success: true, mode: 'merge', counts: { products: productCount, customers: customerCount, sales: saleCount } });
//     } else {
//       // Original behavior - replace entire database
//       // Close current DB connection, then pull, then reload models/connection
//       try { 
//         if (db.sequelize) {
//           await db.sequelize.close();
//           console.log('Database connection closed for pull');
//         }
//       } catch (closeError) {
//         console.log('Error closing database connection:', closeError.message);
//       }

//       const result = await require('../utils/driveSync').pullDatabase();
//       console.log('Pull result:', result);
      
//       if (!result.success) {
//         // Try to reopen previous connection to keep app alive
//         const reloaded = await db.reloadSequelize?.();
//         console.log('Database connection reloaded after failed pull:', reloaded);
//         return res.status(500).json({ error: 'Pull failed', details: result.error || result.reason });
//       }

//       const reloaded = await (db.reloadSequelize?.() || Promise.resolve(false));
//       console.log('Database connection reloaded after successful pull:', reloaded);
      
//       if (!reloaded) {
//         return res.status(500).json({ error: 'Pulled, but failed to reload database connection' });
//       }

//       console.log('Pull completed successfully');
//       // Return counts to verify data presence
//       const productCount = await db.Product.count().catch(() => null);
//       const customerCount = await db.Customer.count().catch(() => null);
//       const saleCount = await db.Sale.count().catch(() => null);
//       res.json({ success: true, mode: 'replace', counts: { products: productCount, customers: customerCount, sales: saleCount } });
//     }
//   } catch (error) {
//     console.error('Pull operation error:', error);
//     res.status(500).json({ error: 'Pull failed', details: error.message });
//   }
// };

// exports.updateDriveFromDatabase = async (req, res) => {
//   try {
//     console.log('Starting push to Google Drive...');
//     const db = require('../models');
    
//     // Don't close the connection - just sync the current state
//     // The database file is already on disk and can be read directly
//     const result = await require('../utils/driveSync').pushDatabase();
//     console.log('Push result:', result);
    
//     if (!result.success) {
//       console.error('Push failed:', result.error || result.reason);
//       return res.status(500).json({ error: 'Push failed', details: result.error || result.reason });
//     }
    
//     console.log('Push completed successfully');
//     res.json(result);
//   } catch (error) {
//     console.error('Push operation error:', error);
//     res.status(500).json({ error: 'Push failed', details: error.message });
//   }
// };


// backend/controllers/driveController.js
const driveSync = require('../utils/driveSync');

exports.getAuthUrl = async (req, res) => {
  try {
    const authUrl = await driveSync.getAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get auth URL' });
  }
};

exports.authenticate = async (req, res) => {
  try {
    const { code } = req.body;
    const tokens = await driveSync.storeToken(code);
    res.json({ success: true, tokens });
  } catch (error) {
    res.status(500).json({ error: 'Authentication failed' });
  }
};

exports.syncDatabase = async (req, res) => {
  try {
    const force = req.query.force === 'true';
    const result = await driveSync.syncDatabase({ force });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Sync failed' });
  }
};

exports.getStatus = async (req, res) => {
  try {
    const status = driveSync.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get status' });
  }
};

// Quick diagnostic: return counts from current DB to verify data presence
exports.getCounts = async (req, res) => {
  try {
    const db = require('../models');
    const counts = {
      products: await db.Product.count().catch(() => null),
      customers: await db.Customer.count().catch(() => null),
      sales: await db.Sale.count().catch(() => null)
    };
    res.json({ success: true, counts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// New endpoints for explicit pull/push
exports.updateDatabaseFromDrive = async (req, res) => {
  try {
    // Default to mergeMode=true to avoid overwriting local DB unless explicitly requested
    const { mergeMode = true } = req.body;
    console.log('Starting pull from Google Drive...', { mergeMode });
    const db = require('../models');
    
    if (mergeMode) {
      // For merge mode, we don't close the connection
      // Instead, we'll merge the data from Drive into the existing database
      console.log('Merge mode enabled - will merge data instead of replacing');
      const result = await require('../utils/driveSync').mergeDatabase();
      console.log('Merge result:', result);
      
      if (!result.success) {
        return res.status(500).json({ error: 'Merge failed', details: result.error || result.reason });
      }
      
      console.log('Merge completed successfully');
      // Reload sequelize models to ensure all merged data is visible immediately
      try { 
        await db.reloadSequelize?.();
        // Give a moment for the reload to complete
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (_) {}
      
      // Return counts to verify data presence
      const productCount = await db.Product.count().catch(() => null);
      const customerCount = await db.Customer.count().catch(() => null);
      const saleCount = await db.Sale.count().catch(() => null);
      res.json({ 
        success: true, 
        mode: 'merge', 
        counts: { products: productCount, customers: customerCount, sales: saleCount },
        mergedRecords: result.mergedRecords
      });
    } else {
      // Original behavior - replace entire database
      // Close current DB connection, then pull, then reload models/connection
      try { 
        if (db.sequelize) {
          await db.sequelize.close();
          console.log('Database connection closed for pull');
        }
      } catch (closeError) {
        console.log('Error closing database connection:', closeError.message);
      }

      const result = await require('../utils/driveSync').pullDatabase();
      console.log('Pull result:', result);
      
      if (!result.success) {
        // Try to reopen previous connection to keep app alive
        try {
          const reloaded = await db.reloadSequelize?.();
          console.log('Database connection reloaded after failed pull:', reloaded);
        } catch (reloadError) {
          console.log('Failed to reload connection after failed pull:', reloadError.message);
        }
        return res.status(500).json({ error: 'Pull failed', details: result.error || result.reason });
      }

      try {
        const reloaded = await (db.reloadSequelize?.() || Promise.resolve(false));
        console.log('Database connection reloaded after successful pull:', reloaded);
        
        if (!reloaded) {
          console.log('Warning: Failed to reload database connection, but pull was successful');
        }
        
        // Give a moment for the reload to complete
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (reloadError) {
        console.log('Error reloading database connection:', reloadError.message);
        return res.status(500).json({ error: 'Pulled, but failed to reload database connection' });
      }

      console.log('Pull completed successfully');
      // Return counts to verify data presence
      const productCount = await db.Product.count().catch(() => null);
      const customerCount = await db.Customer.count().catch(() => null);
      const saleCount = await db.Sale.count().catch(() => null);
      res.json({ success: true, mode: 'replace', counts: { products: productCount, customers: customerCount, sales: saleCount } });
    }
  } catch (error) {
    console.error('Pull operation error:', error);
    // Try to ensure database connection is available
    try {
      const db = require('../models');
      await db.reloadSequelize?.();
    } catch (_) {}
    res.status(500).json({ error: 'Pull failed', details: error.message });
  }
};

exports.updateDriveFromDatabase = async (req, res) => {
  try {
    console.log('Starting push to Google Drive...');
    const db = require('../models');
    
    // Don't close the connection - just sync the current state
    // The database file is already on disk and can be read directly
    const result = await require('../utils/driveSync').pushDatabase();
    console.log('Push result:', result);
    
    if (!result.success) {
      console.error('Push failed:', result.error || result.reason);
      return res.status(500).json({ error: 'Push failed', details: result.error || result.reason });
    }
    
    console.log('Push completed successfully');
    res.json(result);
  } catch (error) {
    console.error('Push operation error:', error);
    res.status(500).json({ error: 'Push failed', details: error.message });
  }
};