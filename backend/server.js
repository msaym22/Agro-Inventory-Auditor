// backend/server.js
const path = require('path');

let driveSync = null;
try {
  driveSync = require('./utils/driveSync');
} catch (e) {
  console.warn('Drive sync disabled:', e.message);
}

try {
  require('dotenv').config({ path: path.resolve(__dirname, '.env') });
} catch (e) {
  console.warn('dotenv not installed; skipping .env loading');
}

console.log('DEBUG: ENCRYPTION_KEY loaded from .env:', process.env.ENCRYPTION_KEY);

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const app = express();

// =====================
// Middleware Setup
// =====================
const defaultOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001'
];
const configuredOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);
const allowedOrigins = configuredOrigins.length > 0 ? configuredOrigins : defaultOrigins;

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // mobile apps, curl, same-origin
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  preflightContinue: false,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(cookieParser());
const { uploadsDir } = require('./middleware/upload');
app.use('/uploads', express.static(uploadsDir));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
const driveRoutes = require('./routes/driveRoutes');
app.use('/api/drive', driveRoutes);


// =====================
// Database Setup
// =====================
const { sequelize } = require('./models');

sequelize.authenticate()
  .then(() => {
    console.log('Database connected successfully');
    // Auto-migrate models to match schema in development
    // const shouldAlter = process.env.NODE_ENV !== 'production';
    // return sequelize.sync(shouldAlter ? { alter: true } : undefined);
    
    // Temporarily disable auto-sync to prevent constraint errors
    console.log('Database models synchronized (auto-sync disabled)');
    return Promise.resolve();
    
    // ALTERNATIVE: Force sync (WARNING: This will delete all data!)
    // return sequelize.sync({ force: true });
  })
  .then(() => {
    console.log('Database models synchronized');
  })
  .catch(err => {
    console.error('Database connection error:', err);
  });

// =====================
// Route Setup
// =====================
// Import Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const customerRoutes = require('./routes/customerRoutes');
const saleRoutes = require('./routes/saleRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const backupRoutes = require('./routes/backupRoutes');

// ✅ CORRECTLY IMPORT THE 'protect' FUNCTION
const { protect } = require('./middleware/auth');
const paymentRoutes = require('./routes/paymentRoutes');

// Public route - does not need protection
app.use('/api/auth', authRoutes);

// ✅ CORRECTLY APPLY THE 'protect' MIDDLEWARE FUNCTION TO ALL PROTECTED ROUTES
app.use('/api/products', protect, productRoutes);
app.use('/api/sales', protect, saleRoutes);
app.use('/api/customers', protect, customerRoutes);
app.use('/api/analytics', protect, analyticsRoutes);
app.use('/api/backup', protect, backupRoutes);
app.use('/api/payments', protect, paymentRoutes);


// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// =====================
// Error Handling & 404
// =====================
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'Something went wrong',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// =====================
// Backup Scheduling
// =====================
try {
  const { scheduleBackups } = require('./utils/backup');
  scheduleBackups();
} catch (error) {
  console.log('Backup scheduling not available:', error.message);
}

// =====================
// Server Startup
// =====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS allowed origins: ${allowedOrigins.join(', ')}`);
  console.log(`Health check available at: http://localhost:${PORT}/api/health`);
});

(async () => {
  try {
    // DISABLED: Auto drive sync on startup - only manual sync via buttons now
    // if (driveSync && typeof driveSync.syncDatabase === 'function') {
    //   await driveSync.syncDatabase();
    // }
    // DISABLED: Auto drive sync - only manual sync via buttons now
    // if (driveSync && typeof driveSync.scheduleDailySync === 'function') {
    //   driveSync.scheduleDailySync();
    //   console.log('Drive daily sync scheduler initialized');
    // }
  } catch (error) {
    console.error('Startup sync error:', error);
  }
})();

process.on('SIGINT', async () => {
  try {
    // DISABLED: Auto drive sync on shutdown - only manual sync via buttons now
    // if (driveSync && typeof driveSync.syncDatabase === 'function') {
    //   await driveSync.syncDatabase();
    // }
    process.exit(0);
  } catch (error) {
    console.error('Shutdown sync error:', error);
    process.exit(1);
  }
});



module.exports = app;