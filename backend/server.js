// backend/server.js
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '.env') });

console.log('DEBUG: ENCRYPTION_KEY loaded from .env:', process.env.ENCRYPTION_KEY);

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const app = express();

// =====================
// Middleware Setup
// =====================
const corsOptions = {
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  preflightContinue: false,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// =====================
// Database Setup
// =====================
const { sequelize } = require('./models');

sequelize.authenticate()
  .then(() => {
    console.log('Database connected successfully');
    return sequelize.sync(); // Using { force: true } will drop tables, be careful in prod.
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
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
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
  console.log(`CORS configured for: http://localhost:3000`);
  console.log(`Health check available at: http://localhost:${PORT}/api/health`);
});

module.exports = app;