// // backend/utils/driveSync.js
// const fs = require('fs');
// const path = require('path');
// const crypto = require('crypto');
// const { google } = require('googleapis');

// // IMPORTANT: This must point to the exact DB file used by Sequelize
// // Our Sequelize config stores SQLite at backend/database.sqlite
// const DB_PATH = path.resolve(__dirname, '../database.sqlite');
// const CONFIG_DIR = path.resolve(__dirname, '../config');
// const TOKEN_PATH = path.join(CONFIG_DIR, 'token.json');
// const CREDENTIALS_PATH = path.join(CONFIG_DIR, 'google-credentials.json');
// const STATUS_PATH = path.join(CONFIG_DIR, 'drive-sync.json');

// const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

// function ensureConfigDir() {
//   if (!fs.existsSync(CONFIG_DIR)) {
//     fs.mkdirSync(CONFIG_DIR, { recursive: true });
//   }
// }

// function readJsonSafe(filePath) {
//   try {
//     if (!fs.existsSync(filePath)) return null;
//     return JSON.parse(fs.readFileSync(filePath, 'utf8'));
//   } catch (e) {
//     return null;
//   }
// }

// function writeJsonSafe(filePath, data) {
//   try {
//     ensureConfigDir();
//     fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
//     return true;
//   } catch (e) {
//     return false;
//   }
// }

// function extractCredentials(credentials) {
//   // Support either { installed: {...} } or { web: {...} }
//   if (!credentials) throw new Error('Missing Google credentials');
//   const c = credentials.installed || credentials.web;
//   if (!c) throw new Error('Invalid Google credentials format (expected installed or web)');
//   const { client_secret, client_id, redirect_uris } = c;
//   if (!client_id || !client_secret || !redirect_uris || !redirect_uris[0]) {
//     throw new Error('Google credentials missing client_id/client_secret/redirect_uris');
//   }
//   return { client_secret, client_id, redirect_uri: redirect_uris[0] };
// }

// function computeFileHash(filePath) {
//   if (!fs.existsSync(filePath)) return null;
//   const hash = crypto.createHash('sha256');
//   const data = fs.readFileSync(filePath);
//   hash.update(data);
//   return hash.digest('hex');
// }

// async function authorize(credentials) {
//   const cred = extractCredentials(credentials);
//   const oAuth2Client = new google.auth.OAuth2(
//     cred.client_id, cred.client_secret, cred.redirect_uri
//   );

//   const token = readJsonSafe(TOKEN_PATH);
//   if (token) {
//     oAuth2Client.setCredentials(token);
//     return oAuth2Client;
//   }
//   return null;
// }

// async function downloadDatabase(auth) {
//   const drive = google.drive({ version: 'v3', auth });

//   // Try preferred name first; fall back to any .sqlite file, newest first
//   let filesRes = await drive.files.list({
//     q: "name='almadina-agro-db.sqlite'",
//     fields: 'files(id, name, modifiedTime)',
//     orderBy: 'modifiedTime desc'
//   });

//   if (!filesRes.data.files || filesRes.data.files.length === 0) {
//     filesRes = await drive.files.list({
//       q: "name contains '.sqlite'",
//       fields: 'files(id, name, modifiedTime)',
//       orderBy: 'modifiedTime desc'
//     });
//   }

//   if (!filesRes.data.files || filesRes.data.files.length === 0) {
//     console.log('No database file found in Drive');
//     return false;
//   }

//   const fileId = filesRes.data.files[0].id;
//   const ok = await new Promise((resolve) => {
//     const dest = fs.createWriteStream(DB_PATH);
//     drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' })
//       .then(response => {
//         response.data
//           .on('end', () => resolve(true))
//           .on('error', err => {
//             console.error('Error downloading database', err);
//             resolve(false);
//           })
//           .pipe(dest);
//       })
//       .catch(err => {
//         console.error('Error downloading file', err);
//         resolve(false);
//       });
//   });
//   return ok;
// }

// async function uploadDatabase(auth) {
//   const drive = google.drive({ version: 'v3', auth });

//   // Prefer updating existing preferred-name file; otherwise create one
//   let res = await drive.files.list({
//     q: "name='almadina-agro-db.sqlite'",
//     fields: 'files(id, name)'
//   });

//   const fileMetadata = { name: 'almadina-agro-db.sqlite' };
//   if (!fs.existsSync(DB_PATH)) {
//     throw new Error(`Local database file not found at ${DB_PATH}`);
//   }
//   const media = { mimeType: 'application/x-sqlite3', body: fs.createReadStream(DB_PATH) };

//   if (res.data.files && res.data.files.length > 0) {
//     await drive.files.update({ fileId: res.data.files[0].id, media });
//     console.log('Database updated on Drive');
//   } else {
//     await drive.files.create({ resource: fileMetadata, media, fields: 'id' });
//     console.log('Database uploaded to Drive');
//   }
//   return true;
// }

// // Explicit operations
// async function pullDatabase() {
//   try {
//     if (!fs.existsSync(CREDENTIALS_PATH)) {
//       return { success: false, reason: 'no-credentials' };
//     }
//     const credentials = readJsonSafe(CREDENTIALS_PATH);
//     const auth = await authorize(credentials);
//     if (!auth) return { success: false, reason: 'not-authenticated' };
//     const ok = await downloadDatabase(auth);
//     if (!ok) return { success: false };
//     const finalHash = computeFileHash(DB_PATH);
//     const nowIso = new Date().toISOString();
//     saveStatus({ lastSync: nowIso, lastHash: finalHash });
//     return { success: true };
//   } catch (e) {
//     return { success: false, error: e.message };
//   }
// }

// async function pushDatabase() {
//   try {
//     if (!fs.existsSync(CREDENTIALS_PATH)) {
//       return { success: false, reason: 'no-credentials' };
//     }
//     const credentials = readJsonSafe(CREDENTIALS_PATH);
//     const auth = await authorize(credentials);
//     if (!auth) return { success: false, reason: 'not-authenticated' };
//     await uploadDatabase(auth);
//     const finalHash = computeFileHash(DB_PATH);
//     const nowIso = new Date().toISOString();
//     saveStatus({ lastSync: nowIso, lastHash: finalHash });
//     return { success: true };
//   } catch (e) {
//     return { success: false, error: e.message };
//   }
// }

// async function mergeDatabase() {
//   try {
//     if (!fs.existsSync(CREDENTIALS_PATH)) {
//       return { success: false, reason: 'no-credentials' };
//     }
//     const credentials = readJsonSafe(CREDENTIALS_PATH);
//     const auth = await authorize(credentials);
//     if (!auth) return { success: false, reason: 'not-authenticated' };
    
//     // Download the Drive database to a temporary location
//     const tempDbPath = path.resolve(__dirname, '../temp_drive_database.sqlite');
//     const drive = google.drive({ version: 'v3', auth });
    
//     // Find the database file on Drive
//     let filesRes = await drive.files.list({
//       q: "name='almadina-agro-db.sqlite'",
//       fields: 'files(id, name, modifiedTime)',
//       orderBy: 'modifiedTime desc'
//     });

//     if (!filesRes.data.files || filesRes.data.files.length === 0) {
//       filesRes = await drive.files.list({
//         q: "name contains '.sqlite'",
//         fields: 'files(id, name, modifiedTime)',
//         orderBy: 'modifiedTime desc'
//       });
//     }

//     if (!filesRes.data.files || filesRes.data.files.length === 0) {
//       return { success: false, reason: 'no-database-on-drive' };
//     }

//     // Download the Drive database
//     const fileId = filesRes.data.files[0].id;
//     const downloadSuccess = await new Promise((resolve) => {
//       const dest = fs.createWriteStream(tempDbPath);
//       drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' })
//         .then(response => {
//           response.data
//             .on('end', () => resolve(true))
//             .on('error', err => {
//               console.error('Error downloading database for merge', err);
//               resolve(false);
//             })
//             .pipe(dest);
//         })
//         .catch(err => {
//           console.error('Error downloading file for merge', err);
//           resolve(false);
//         });
//     });

//     if (!downloadSuccess) {
//       return { success: false, reason: 'download-failed' };
//     }

//     // Merge the databases
//     const mergeResult = await mergeDatabases(DB_PATH, tempDbPath);
    
//     // Clean up temporary file
//     try {
//       fs.unlinkSync(tempDbPath);
//     } catch (e) {
//       console.log('Could not delete temp file:', e.message);
//     }

//     if (!mergeResult.success) {
//       return { success: false, error: mergeResult.error };
//     }

//     const finalHash = computeFileHash(DB_PATH);
//     const nowIso = new Date().toISOString();
//     saveStatus({ lastSync: nowIso, lastHash: finalHash });
    
//     return { success: true, mergedRecords: mergeResult.mergedRecords };
//   } catch (e) {
//     return { success: false, error: e.message };
//   }
// }

// async function mergeDatabases(localDbPath, remoteDbPath) {
//   try {
//     const { Sequelize } = require('sequelize');
    
//     // Create connections to both databases
//     const localDb = new Sequelize({
//       dialect: 'sqlite',
//       storage: localDbPath,
//       logging: false
//     });
    
//     const remoteDb = new Sequelize({
//       dialect: 'sqlite',
//       storage: remoteDbPath,
//       logging: false
//     });

//     // Define models for both databases
//     const defineModels = (sequelize) => {
//       const Product = sequelize.define('Product', {
//         id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
//         name: Sequelize.STRING,
//         description: Sequelize.TEXT,
//         price: Sequelize.DECIMAL(10, 2),
//         purchasePrice: Sequelize.DECIMAL(10, 2),
//         stock: Sequelize.INTEGER,
//         minStock: Sequelize.INTEGER,
//         category: Sequelize.STRING,
//         unit: Sequelize.STRING,
//         barcode: Sequelize.STRING,
//         image: Sequelize.STRING,
//         createdAt: Sequelize.DATE,
//         updatedAt: Sequelize.DATE
//       });

//       const Customer = sequelize.define('Customer', {
//         id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
//         name: Sequelize.STRING,
//         contact: Sequelize.STRING,
//         address: Sequelize.TEXT,
//         creditLimit: Sequelize.DECIMAL(10, 2),
//         outstandingBalance: Sequelize.DECIMAL(10, 2),
//         lastPurchase: Sequelize.DATE,
//         digikhataId: Sequelize.STRING,
//         customerImage: Sequelize.STRING,
//         createdAt: Sequelize.DATE,
//         updatedAt: Sequelize.DATE
//       });

//       const Sale = sequelize.define('Sale', {
//         id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
//         customerId: Sequelize.INTEGER,
//         totalAmount: Sequelize.DECIMAL(10, 2),
//         discount: Sequelize.DECIMAL(10, 2),
//         paymentMethod: Sequelize.STRING,
//         saleDate: Sequelize.DATE,
//         notes: Sequelize.TEXT,
//         receiptImage: Sequelize.STRING,
//         createdAt: Sequelize.DATE,
//         updatedAt: Sequelize.DATE
//       });

//       const SaleItem = sequelize.define('SaleItem', {
//         id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
//         saleId: Sequelize.INTEGER,
//         productId: Sequelize.INTEGER,
//         quantity: Sequelize.INTEGER,
//         priceAtSale: Sequelize.DECIMAL(10, 2),
//         createdAt: Sequelize.DATE,
//         updatedAt: Sequelize.DATE
//       });

//       return { Product, Customer, Sale, SaleItem };
//     };

//     const localModels = defineModels(localDb);
//     const remoteModels = defineModels(remoteDb);

//     let mergedRecords = 0;

//     // Merge Products
//     const remoteProducts = await remoteModels.Product.findAll();
//     for (const product of remoteProducts) {
//       const existing = await localModels.Product.findByPk(product.id);
//       if (!existing) {
//         await localModels.Product.create(product.toJSON());
//         mergedRecords++;
//       }
//     }

//     // Merge Customers
//     const remoteCustomers = await remoteModels.Customer.findAll();
//     for (const customer of remoteCustomers) {
//       const existing = await localModels.Customer.findByPk(customer.id);
//       if (!existing) {
//         await localModels.Customer.create(customer.toJSON());
//         mergedRecords++;
//       }
//     }

//     // Merge Sales
//     const remoteSales = await remoteModels.Sale.findAll();
//     for (const sale of remoteSales) {
//       const existing = await localModels.Sale.findByPk(sale.id);
//       if (!existing) {
//         await localModels.Sale.create(sale.toJSON());
//         mergedRecords++;
//       }
//     }

//     // Merge SaleItems
//     const remoteSaleItems = await remoteModels.SaleItem.findAll();
//     for (const saleItem of remoteSaleItems) {
//       const existing = await localModels.SaleItem.findByPk(saleItem.id);
//       if (!existing) {
//         await localModels.SaleItem.create(saleItem.toJSON());
//         mergedRecords++;
//       }
//     }

//     await localDb.close();
//     await remoteDb.close();

//     return { success: true, mergedRecords };
//   } catch (error) {
//     console.error('Error merging databases:', error);
//     return { success: false, error: error.message };
//   }
// }

// function getStatus() {
//   const status = readJsonSafe(STATUS_PATH) || { lastSync: null, lastHash: null, isAuthenticated: false };
//   const tokenExists = !!readJsonSafe(TOKEN_PATH);
//   status.isAuthenticated = tokenExists;
//   return status;
// }

// function saveStatus(partial) {
//   const existing = getStatus();
//   const updated = { ...existing, ...partial };
//   writeJsonSafe(STATUS_PATH, updated);
//   return updated;
// }

// async function syncDatabase({ force = false } = {}) {
//   try {
//     if (!fs.existsSync(CREDENTIALS_PATH)) {
//       console.log('Google Drive credentials not found');
//       return { success: false, reason: 'no-credentials' };
//     }
//     const credentials = readJsonSafe(CREDENTIALS_PATH);
//     const auth = await authorize(credentials);
//     if (!auth) {
//       console.log('Google Drive not authenticated');
//       return { success: false, reason: 'not-authenticated' };
//     }

//     const currentHash = computeFileHash(DB_PATH);
//     const { lastHash } = getStatus();
//     if (!force && currentHash && lastHash && currentHash === lastHash) {
//       console.log('No database changes detected; skipping upload');
//       return { success: true, skipped: true };
//     }

//     // Optional: download first to pull remote changes
//     await downloadDatabase(auth);

//     // Upload latest local DB
//     await uploadDatabase(auth);

//     const finalHash = computeFileHash(DB_PATH);
//     const nowIso = new Date().toISOString();
//     saveStatus({ lastSync: nowIso, lastHash: finalHash });

//     return { success: true };
//   } catch (error) {
//     console.error('Google Drive sync error:', error);
//     return { success: false, error: error.message };
//   }
// }

// function scheduleDailySync() {
//   // Schedule first run at next 00:00 local time, then every 24h
//   function msUntilNextMidnight() {
//     const now = new Date();
//     const midnight = new Date(now);
//     midnight.setHours(24, 0, 0, 0);
//     return midnight - now;
//   }
//   const scheduleOnce = () => {
//     setTimeout(async () => {
//       try { await syncDatabase({ force: false }); } catch (e) {}
//       scheduleOnce();
//     }, msUntilNextMidnight());
//   };
//   scheduleOnce();
// }

// async function getAuthUrl() {
//   const credentials = readJsonSafe(CREDENTIALS_PATH);
//   const cred = extractCredentials(credentials);
//   const oAuth2Client = new google.auth.OAuth2(
//     cred.client_id, cred.client_secret, cred.redirect_uri
//   );
//   return oAuth2Client.generateAuthUrl({ access_type: 'offline', scope: SCOPES });
// }

// async function storeToken(code) {
//   const credentials = readJsonSafe(CREDENTIALS_PATH);
//   const cred = extractCredentials(credentials);
//   const oAuth2Client = new google.auth.OAuth2(
//     cred.client_id, cred.client_secret, cred.redirect_uri
//   );
//   const { tokens } = await oAuth2Client.getToken(code);
//   oAuth2Client.setCredentials(tokens);
//   writeJsonSafe(TOKEN_PATH, tokens);
//   saveStatus({ isAuthenticated: true });
//   return tokens;
// }

// module.exports = {
//   authorize,
//   syncDatabase,
//   getAuthUrl,
//   storeToken,
//   getStatus,
//   scheduleDailySync,
//   pullDatabase,
//   pushDatabase,
//   mergeDatabase,
// };



// backend/utils/driveSync.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { google } = require('googleapis');

// IMPORTANT: This must point to the exact DB file used by Sequelize
// Our Sequelize config stores SQLite at backend/database.sqlite
const DB_PATH = path.resolve(__dirname, '../database.sqlite');
const CONFIG_DIR = path.resolve(__dirname, '../config');
const TOKEN_PATH = path.join(CONFIG_DIR, 'token.json');
const CREDENTIALS_PATH = path.join(CONFIG_DIR, 'google-credentials.json');
const STATUS_PATH = path.join(CONFIG_DIR, 'drive-sync.json');

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

function readJsonSafe(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    console.log(`Error reading JSON file ${filePath}:`, e.message);
    return null;
  }
}

function writeJsonSafe(filePath, data) {
  try {
    ensureConfigDir();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (e) {
    console.log(`Error writing JSON file ${filePath}:`, e.message);
    return false;
  }
}

function extractCredentials(credentials) {
  // Support either { installed: {...} } or { web: {...} }
  if (!credentials) throw new Error('Missing Google credentials');
  const c = credentials.installed || credentials.web;
  if (!c) throw new Error('Invalid Google credentials format (expected installed or web)');
  const { client_secret, client_id, redirect_uris } = c;
  if (!client_id || !client_secret || !redirect_uris || !redirect_uris[0]) {
    throw new Error('Google credentials missing client_id/client_secret/redirect_uris');
  }
  return { client_secret, client_id, redirect_uri: redirect_uris[0] };
}

function computeFileHash(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    const hash = crypto.createHash('sha256');
    const data = fs.readFileSync(filePath);
    hash.update(data);
    return hash.digest('hex');
  } catch (e) {
    console.log(`Error computing hash for ${filePath}:`, e.message);
    return null;
  }
}

async function authorize(credentials) {
  const cred = extractCredentials(credentials);
  const oAuth2Client = new google.auth.OAuth2(
    cred.client_id, cred.client_secret, cred.redirect_uri
  );

  const token = readJsonSafe(TOKEN_PATH);
  if (token) {
    oAuth2Client.setCredentials(token);
    return oAuth2Client;
  }
  return null;
}

// Helper function to ensure database and tables exist
async function ensureDatabaseExists() {
  try {
    console.log('Ensuring database exists at:', DB_PATH);
    
    // Ensure the directory exists
    const dbDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dbDir)) {
      console.log('Creating database directory:', dbDir);
      fs.mkdirSync(dbDir, { recursive: true });
    }

    const { Sequelize } = require('sequelize');
    
    // Create database connection - this will create the file if it doesn't exist
    const sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: DB_PATH,
      logging: false
    });

    // Test the connection
    await sequelize.authenticate();
    console.log('Database connection established successfully');

    // Define all models to ensure tables are created
    const Product = sequelize.define('Product', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: Sequelize.STRING,
      description: Sequelize.TEXT,
      price: Sequelize.DECIMAL(10, 2),
      purchasePrice: Sequelize.DECIMAL(10, 2),
      stock: Sequelize.INTEGER,
      minStock: Sequelize.INTEGER,
      category: Sequelize.STRING,
      unit: Sequelize.STRING,
      barcode: Sequelize.STRING,
      image: Sequelize.STRING,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE
    }, {
      tableName: 'Products'
    });

    const Customer = sequelize.define('Customer', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: Sequelize.STRING,
      contact: Sequelize.STRING,
      address: Sequelize.TEXT,
      creditLimit: Sequelize.DECIMAL(10, 2),
      outstandingBalance: Sequelize.DECIMAL(10, 2),
      lastPurchase: Sequelize.DATE,
      digikhataId: Sequelize.STRING,
      customerImage: Sequelize.STRING,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE
    }, {
      tableName: 'Customers'
    });

    const Sale = sequelize.define('Sale', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      customerId: Sequelize.INTEGER,
      totalAmount: Sequelize.DECIMAL(10, 2),
      discount: Sequelize.DECIMAL(10, 2),
      paymentMethod: Sequelize.STRING,
      saleDate: Sequelize.DATE,
      notes: Sequelize.TEXT,
      receiptImage: Sequelize.STRING,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE
    }, {
      tableName: 'Sales'
    });

    const SaleItem = sequelize.define('SaleItem', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      saleId: Sequelize.INTEGER,
      productId: Sequelize.INTEGER,
      quantity: Sequelize.INTEGER,
      priceAtSale: Sequelize.DECIMAL(10, 2),
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE
    }, {
      tableName: 'SaleItems'
    });

    // Create all tables
    await sequelize.sync();
    console.log('Database tables synchronized successfully');
    
    await sequelize.close();
    console.log('Database setup completed');

    return { Product, Customer, Sale, SaleItem };
  } catch (error) {
    console.error('Error ensuring database exists:', error);
    throw error;
  }
}

async function downloadDatabase(auth) {
  const drive = google.drive({ version: 'v3', auth });

  try {
    // Try preferred name first; fall back to any .sqlite file, newest first
    let filesRes = await drive.files.list({
      q: "name='almadina-agro-db.sqlite'",
      fields: 'files(id, name, modifiedTime)',
      orderBy: 'modifiedTime desc'
    });

    if (!filesRes.data.files || filesRes.data.files.length === 0) {
      console.log('Primary database file not found, searching for any .sqlite file...');
      filesRes = await drive.files.list({
        q: "name contains '.sqlite'",
        fields: 'files(id, name, modifiedTime)',
        orderBy: 'modifiedTime desc'
      });
    }

    if (!filesRes.data.files || filesRes.data.files.length === 0) {
      console.log('No database file found in Drive');
      return false;
    }

    const file = filesRes.data.files[0];
    console.log(`Found database file: ${file.name} (${file.id})`);

    const fileId = file.id;
    const ok = await new Promise((resolve) => {
      const dest = fs.createWriteStream(DB_PATH);
      drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' })
        .then(response => {
          response.data
            .on('end', () => {
              console.log('Database download completed successfully');
              resolve(true);
            })
            .on('error', err => {
              console.error('Error downloading database stream:', err);
              resolve(false);
            })
            .pipe(dest);
        })
        .catch(err => {
          console.error('Error downloading database file:', err);
          resolve(false);
        });
    });
    return ok;
  } catch (error) {
    console.error('Error in downloadDatabase:', error);
    return false;
  }
}

async function uploadDatabase(auth) {
  const drive = google.drive({ version: 'v3', auth });

  try {
    // Prefer updating existing preferred-name file; otherwise create one
    let res = await drive.files.list({
      q: "name='almadina-agro-db.sqlite'",
      fields: 'files(id, name)'
    });

    const fileMetadata = { name: 'almadina-agro-db.sqlite' };
    if (!fs.existsSync(DB_PATH)) {
      throw new Error(`Local database file not found at ${DB_PATH}`);
    }
    const media = { mimeType: 'application/x-sqlite3', body: fs.createReadStream(DB_PATH) };

    if (res.data.files && res.data.files.length > 0) {
      await drive.files.update({ fileId: res.data.files[0].id, media });
      console.log('Database updated on Drive');
    } else {
      await drive.files.create({ resource: fileMetadata, media, fields: 'id' });
      console.log('Database uploaded to Drive');
    }
    return true;
  } catch (error) {
    console.error('Error uploading database:', error);
    throw error;
  }
}

// Explicit operations
async function pullDatabase() {
  try {
    console.log('Starting pullDatabase operation...');
    
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      console.log('Google credentials file not found at:', CREDENTIALS_PATH);
      return { success: false, reason: 'no-credentials' };
    }
    
    const credentials = readJsonSafe(CREDENTIALS_PATH);
    if (!credentials) {
      console.log('Failed to read Google credentials');
      return { success: false, reason: 'invalid-credentials' };
    }
    
    const auth = await authorize(credentials);
    if (!auth) {
      console.log('Google Drive authentication failed');
      return { success: false, reason: 'not-authenticated' };
    }
    
    console.log('Google Drive authenticated successfully');
    const ok = await downloadDatabase(auth);
    if (!ok) {
      console.log('Failed to download database from Drive');
      return { success: false, reason: 'download-failed' };
    }
    
    const finalHash = computeFileHash(DB_PATH);
    const nowIso = new Date().toISOString();
    saveStatus({ lastSync: nowIso, lastHash: finalHash });
    
    console.log('pullDatabase completed successfully');
    return { success: true };
  } catch (e) {
    console.error('Error in pullDatabase:', e);
    return { success: false, error: e.message };
  }
}

async function pushDatabase() {
  try {
    console.log('Starting pushDatabase operation...');
    
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      console.log('Google credentials file not found at:', CREDENTIALS_PATH);
      return { success: false, reason: 'no-credentials' };
    }
    
    const credentials = readJsonSafe(CREDENTIALS_PATH);
    if (!credentials) {
      console.log('Failed to read Google credentials');
      return { success: false, reason: 'invalid-credentials' };
    }
    
    const auth = await authorize(credentials);
    if (!auth) {
      console.log('Google Drive authentication failed');
      return { success: false, reason: 'not-authenticated' };
    }
    
    console.log('Google Drive authenticated successfully');
    await uploadDatabase(auth);
    
    const finalHash = computeFileHash(DB_PATH);
    const nowIso = new Date().toISOString();
    saveStatus({ lastSync: nowIso, lastHash: finalHash });
    
    console.log('pushDatabase completed successfully');
    return { success: true };
  } catch (e) {
    console.error('Error in pushDatabase:', e);
    return { success: false, error: e.message };
  }
}

async function mergeDatabase() {
  try {
    console.log('Starting mergeDatabase operation...');
    
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      console.log('Google credentials file not found at:', CREDENTIALS_PATH);
      return { success: false, reason: 'no-credentials' };
    }
    
    const credentials = readJsonSafe(CREDENTIALS_PATH);
    if (!credentials) {
      console.log('Failed to read Google credentials');
      return { success: false, reason: 'invalid-credentials' };
    }
    
    const auth = await authorize(credentials);
    if (!auth) {
      console.log('Google Drive authentication failed');
      return { success: false, reason: 'not-authenticated' };
    }
    
    // Ensure local database exists with proper tables before merging
    console.log('Ensuring local database structure exists...');
    await ensureDatabaseExists();
    
    // Download the Drive database to a temporary location
    const tempDbPath = path.resolve(__dirname, '../temp_drive_database.sqlite');
    const drive = google.drive({ version: 'v3', auth });
    
    console.log('Searching for database file on Drive...');
    
    // Find the database file on Drive
    let filesRes = await drive.files.list({
      q: "name='almadina-agro-db.sqlite'",
      fields: 'files(id, name, modifiedTime)',
      orderBy: 'modifiedTime desc'
    });

    if (!filesRes.data.files || filesRes.data.files.length === 0) {
      console.log('Primary database file not found, searching for any .sqlite file...');
      filesRes = await drive.files.list({
        q: "name contains '.sqlite'",
        fields: 'files(id, name, modifiedTime)',
        orderBy: 'modifiedTime desc'
      });
    }

    if (!filesRes.data.files || filesRes.data.files.length === 0) {
      console.log('No database file found on Drive');
      return { success: false, reason: 'no-database-on-drive' };
    }

    const file = filesRes.data.files[0];
    console.log(`Found database file on Drive: ${file.name} (${file.id})`);

    // Download the Drive database
    const fileId = file.id;
    console.log('Downloading database from Drive for merge...');
    
    const downloadSuccess = await new Promise((resolve) => {
      const dest = fs.createWriteStream(tempDbPath);
      drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' })
        .then(response => {
          response.data
            .on('end', () => {
              console.log('Drive database download completed');
              resolve(true);
            })
            .on('error', err => {
              console.error('Error downloading database for merge:', err);
              resolve(false);
            })
            .pipe(dest);
        })
        .catch(err => {
          console.error('Error downloading file for merge:', err);
          resolve(false);
        });
    });

    if (!downloadSuccess) {
      console.log('Failed to download database from Drive');
      return { success: false, reason: 'download-failed' };
    }

    console.log('Starting database merge process...');
    
    // Merge the databases
    const mergeResult = await mergeDatabases(DB_PATH, tempDbPath);
    
    // Clean up temporary file
    try {
      if (fs.existsSync(tempDbPath)) {
        fs.unlinkSync(tempDbPath);
        console.log('Temporary database file cleaned up');
      }
    } catch (e) {
      console.log('Could not delete temp file:', e.message);
    }

    if (!mergeResult.success) {
      console.error('Database merge failed:', mergeResult.error);
      return { success: false, error: mergeResult.error };
    }

    const finalHash = computeFileHash(DB_PATH);
    const nowIso = new Date().toISOString();
    saveStatus({ lastSync: nowIso, lastHash: finalHash });
    
    console.log(`mergeDatabase completed successfully. Merged ${mergeResult.mergedRecords} records`);
    return { success: true, mergedRecords: mergeResult.mergedRecords };
  } catch (e) {
    console.error('Error in mergeDatabase:', e);
    return { success: false, error: e.message };
  }
}

async function mergeDatabases(localDbPath, remoteDbPath) {
  let localDb = null;
  let remoteDb = null;
  
  try {
    console.log('Starting database merge...');
    console.log('Local DB path:', localDbPath);
    console.log('Remote DB path:', remoteDbPath);
    
    const { Sequelize } = require('sequelize');
    
    // Ensure local database exists first
    if (!fs.existsSync(localDbPath)) {
      console.log('Local database does not exist, creating it...');
      await ensureDatabaseExists();
    }
    
    // Verify both files exist
    if (!fs.existsSync(remoteDbPath)) {
      console.error('Remote database file not found at:', remoteDbPath);
      return { success: false, error: 'Remote database file not found' };
    }
    
    console.log('Creating database connections...');
    
    // Create connections to both databases
    localDb = new Sequelize({
      dialect: 'sqlite',
      storage: localDbPath,
      logging: false
    });
    
    remoteDb = new Sequelize({
      dialect: 'sqlite',
      storage: remoteDbPath,
      logging: false
    });

    // Test connections
    await localDb.authenticate();
    await remoteDb.authenticate();
    console.log('Database connections established');

    // Define models for both databases
    const defineModels = (sequelize) => {
      const Product = sequelize.define('Product', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        name: Sequelize.STRING,
        description: Sequelize.TEXT,
        price: Sequelize.DECIMAL(10, 2),
        purchasePrice: Sequelize.DECIMAL(10, 2),
        stock: Sequelize.INTEGER,
        minStock: Sequelize.INTEGER,
        category: Sequelize.STRING,
        unit: Sequelize.STRING,
        barcode: Sequelize.STRING,
        image: Sequelize.STRING,
        createdAt: Sequelize.DATE,
        updatedAt: Sequelize.DATE
      }, {
        tableName: 'Products'
      });

      const Customer = sequelize.define('Customer', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        name: Sequelize.STRING,
        contact: Sequelize.STRING,
        address: Sequelize.TEXT,
        creditLimit: Sequelize.DECIMAL(10, 2),
        outstandingBalance: Sequelize.DECIMAL(10, 2),
        lastPurchase: Sequelize.DATE,
        digikhataId: Sequelize.STRING,
        customerImage: Sequelize.STRING,
        createdAt: Sequelize.DATE,
        updatedAt: Sequelize.DATE
      }, {
        tableName: 'Customers'
      });

      const Sale = sequelize.define('Sale', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        customerId: Sequelize.INTEGER,
        totalAmount: Sequelize.DECIMAL(10, 2),
        discount: Sequelize.DECIMAL(10, 2),
        paymentMethod: Sequelize.STRING,
        saleDate: Sequelize.DATE,
        notes: Sequelize.TEXT,
        receiptImage: Sequelize.STRING,
        createdAt: Sequelize.DATE,
        updatedAt: Sequelize.DATE
      }, {
        tableName: 'Sales'
      });

      const SaleItem = sequelize.define('SaleItem', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        saleId: Sequelize.INTEGER,
        productId: Sequelize.INTEGER,
        quantity: Sequelize.INTEGER,
        priceAtSale: Sequelize.DECIMAL(10, 2),
        createdAt: Sequelize.DATE,
        updatedAt: Sequelize.DATE
      }, {
        tableName: 'SaleItems'
      });

      return { Product, Customer, Sale, SaleItem };
    };

    const localModels = defineModels(localDb);
    const remoteModels = defineModels(remoteDb);

    // Ensure tables exist in local database
    await localDb.sync();
    console.log('Local database tables synchronized');

    let mergedRecords = 0;

    // Merge Products
    try {
      console.log('Merging products...');
      const remoteProducts = await remoteModels.Product.findAll();
      console.log(`Found ${remoteProducts.length} products in remote database`);
      
      for (const product of remoteProducts) {
        try {
          const existing = await localModels.Product.findByPk(product.id);
          if (!existing) {
            await localModels.Product.create(product.toJSON());
            mergedRecords++;
          } else {
            // Optionally update existing record with newer data
            const productData = product.toJSON();
            if (new Date(productData.updatedAt) > new Date(existing.updatedAt)) {
              await existing.update(productData);
              console.log(`Updated product ${existing.id} with newer data from drive`);
            }
          }
        } catch (itemError) {
          console.log(`Error processing product ${product.id}:`, itemError.message);
        }
      }
      console.log(`Products merge completed`);
    } catch (error) {
      console.log('Error merging products:', error.message);
    }

    // Merge Customers
    try {
      console.log('Merging customers...');
      const remoteCustomers = await remoteModels.Customer.findAll();
      console.log(`Found ${remoteCustomers.length} customers in remote database`);
      
      for (const customer of remoteCustomers) {
        try {
          const existing = await localModels.Customer.findByPk(customer.id);
          if (!existing) {
            await localModels.Customer.create(customer.toJSON());
            mergedRecords++;
          } else {
            // Optionally update existing record with newer data
            const customerData = customer.toJSON();
            if (new Date(customerData.updatedAt) > new Date(existing.updatedAt)) {
              await existing.update(customerData);
              console.log(`Updated customer ${existing.id} with newer data from drive`);
            }
          }
        } catch (itemError) {
          console.log(`Error processing customer ${customer.id}:`, itemError.message);
        }
      }
      console.log(`Customers merge completed`);
    } catch (error) {
      console.log('Error merging customers:', error.message);
    }

    // Merge Sales
    try {
      console.log('Merging sales...');
      const remoteSales = await remoteModels.Sale.findAll();
      console.log(`Found ${remoteSales.length} sales in remote database`);
      
      for (const sale of remoteSales) {
        try {
          const existing = await localModels.Sale.findByPk(sale.id);
          if (!existing) {
            await localModels.Sale.create(sale.toJSON());
            mergedRecords++;
          } else {
            // Optionally update existing record with newer data
            const saleData = sale.toJSON();
            if (new Date(saleData.updatedAt) > new Date(existing.updatedAt)) {
              await existing.update(saleData);
              console.log(`Updated sale ${existing.id} with newer data from drive`);
            }
          }
        } catch (itemError) {
          console.log(`Error processing sale ${sale.id}:`, itemError.message);
        }
      }
      console.log(`Sales merge completed`);
    } catch (error) {
      console.log('Error merging sales:', error.message);
    }

    // Merge SaleItems
    try {
      console.log('Merging sale items...');
      const remoteSaleItems = await remoteModels.SaleItem.findAll();
      console.log(`Found ${remoteSaleItems.length} sale items in remote database`);
      
      for (const saleItem of remoteSaleItems) {
        try {
          const existing = await localModels.SaleItem.findByPk(saleItem.id);
          if (!existing) {
            await localModels.SaleItem.create(saleItem.toJSON());
            mergedRecords++;
          } else {
            // Optionally update existing record with newer data
            const saleItemData = saleItem.toJSON();
            if (new Date(saleItemData.updatedAt) > new Date(existing.updatedAt)) {
              await existing.update(saleItemData);
              console.log(`Updated sale item ${existing.id} with newer data from drive`);
            }
          }
        } catch (itemError) {
          console.log(`Error processing sale item ${saleItem.id}:`, itemError.message);
        }
      }
      console.log(`Sale items merge completed`);
    } catch (error) {
      console.log('Error merging sale items:', error.message);
    }

    console.log(`Database merge completed successfully. Total merged records: ${mergedRecords}`);
    return { success: true, mergedRecords };
    
  } catch (error) {
    console.error('Error merging databases:', error);
    return { success: false, error: error.message };
  } finally {
    // Clean up database connections
    try {
      if (localDb) await localDb.close();
      if (remoteDb) await remoteDb.close();
      console.log('Database connections closed');
    } catch (closeError) {
      console.log('Error closing database connections:', closeError.message);
    }
  }
}

function getStatus() {
  const status = readJsonSafe(STATUS_PATH) || { lastSync: null, lastHash: null, isAuthenticated: false };
  const tokenExists = !!readJsonSafe(TOKEN_PATH);
  status.isAuthenticated = tokenExists;
  return status;
}

function saveStatus(partial) {
  const existing = getStatus();
  const updated = { ...existing, ...partial };
  writeJsonSafe(STATUS_PATH, updated);
  return updated;
}

async function syncDatabase({ force = false } = {}) {
  try {
    console.log('Starting syncDatabase operation...');
    
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      console.log('Google Drive credentials not found');
      return { success: false, reason: 'no-credentials' };
    }
    const credentials = readJsonSafe(CREDENTIALS_PATH);
    const auth = await authorize(credentials);
    if (!auth) {
      console.log('Google Drive not authenticated');
      return { success: false, reason: 'not-authenticated' };
    }

    const currentHash = computeFileHash(DB_PATH);
    const { lastHash } = getStatus();
    if (!force && currentHash && lastHash && currentHash === lastHash) {
      console.log('No database changes detected; skipping upload');
      return { success: true, skipped: true };
    }

    // Optional: download first to pull remote changes
    await downloadDatabase(auth);

    // Upload latest local DB
    await uploadDatabase(auth);

    const finalHash = computeFileHash(DB_PATH);
    const nowIso = new Date().toISOString();
    saveStatus({ lastSync: nowIso, lastHash: finalHash });

    console.log('syncDatabase completed successfully');
    return { success: true };
  } catch (error) {
    console.error('Google Drive sync error:', error);
    return { success: false, error: error.message };
  }
}

function scheduleDailySync() {
  // Schedule first run at next 00:00 local time, then every 24h
  function msUntilNextMidnight() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return midnight - now;
  }
  const scheduleOnce = () => {
    setTimeout(async () => {
      try { await syncDatabase({ force: false }); } catch (e) {}
      scheduleOnce();
    }, msUntilNextMidnight());
  };
  scheduleOnce();
}

async function getAuthUrl() {
  const credentials = readJsonSafe(CREDENTIALS_PATH);
  const cred = extractCredentials(credentials);
  const oAuth2Client = new google.auth.OAuth2(
    cred.client_id, cred.client_secret, cred.redirect_uri
  );
  return oAuth2Client.generateAuthUrl({ access_type: 'offline', scope: SCOPES });
}

async function storeToken(code) {
  const credentials = readJsonSafe(CREDENTIALS_PATH);
  const cred = extractCredentials(credentials);
  const oAuth2Client = new google.auth.OAuth2(
    cred.client_id, cred.client_secret, cred.redirect_uri
  );
  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);
  writeJsonSafe(TOKEN_PATH, tokens);
  saveStatus({ isAuthenticated: true });
  return tokens;
}

module.exports = {
  authorize,
  syncDatabase,
  getAuthUrl,
  storeToken,
  getStatus,
  scheduleDailySync,
  pullDatabase,
  pushDatabase,
  mergeDatabase,
};