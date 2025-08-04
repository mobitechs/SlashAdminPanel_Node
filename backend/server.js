// server.js (UPDATED VERSION with Settlements)
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import database and models
const { testConnection } = require('./config/database');
const Admin = require('./models/Admin');

console.log('🚀 Starting Slash Admin Panel Server...');

const app = express();
const PORT = process.env.PORT || 5000;

// Enhanced middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'API OK', 
    timestamp: new Date().toISOString(),
    database: 'Connected' // You can enhance this to check actual DB status
  });
});

// Test route to check if models are working
app.get('/api/test-models', async (req, res) => {
  try {
    // Test importing models
    const { User, Transaction, Store } = require('./models');
    
    res.json({
      success: true,
      message: 'Models imported successfully',
      models: {
        User: typeof User,
        Transaction: typeof Transaction,
        Store: typeof Store
      }
    });
  } catch (error) {
    console.error('❌ Models import error:', error);
    res.status(500).json({
      success: false,
      message: 'Models import failed',
      error: error.message,
      stack: error.stack
    });
  }
});

// Safely import and mount routes
const mountRoute = (path, routeFile, routeName) => {
  try {
    const route = require(routeFile);
    if (typeof route === 'function') {
      app.use(path, route);
      console.log(`✅ ${routeName} routes loaded`);
      return true;
    } else {
      console.error(`❌ ${routeName} routes error: Invalid export (not a function)`);
      return false;
    }
  } catch (error) {
    console.error(`❌ ${routeName} routes error:`, error.message);
    return false;
  }
};

// Mount routes - INCLUDING SETTLEMENTS
mountRoute('/api/auth', './routes/auth', 'Auth');
mountRoute('/api/users', './routes/users', 'User');
mountRoute('/api/transactions', './routes/transactions', 'Transaction');
mountRoute('/api/settlements', './routes/settlements', 'Settlement'); // 🎯 NEW: Added Settlement routes
mountRoute('/api/stores', './routes/stores', 'Store');
mountRoute('/api/coupons', './routes/coupons', 'Coupon');
mountRoute('/api/rewards', './routes/rewards', 'Reward');
mountRoute('/api/reward-history', './routes/reward-history', 'Reward History');
mountRoute('/api/dashboard', './routes/dashboard', 'Dashboard');

mountRoute('/api/faqs', './routes/faqs', 'FAQs');
mountRoute('/api/terms', './routes/terms', 'Terms & Conditions');
mountRoute('/api/videos', './routes/videos', 'App Demo Videos');
mountRoute('/api/stores-sequence', './routes/stores-sequence', 'Top Stores');
mountRoute('/api/surveys', './routes/surveys', 'Survey');

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Initialize and start server
const startServer = async () => {
  try {
    console.log('🔍 Testing database connection...');
    const dbConnected = await testConnection();
    
    if (dbConnected) {
      console.log('👤 Setting up admin table...');
      await Admin.createAdminsTable();
      console.log('✅ Database setup completed');
    } else {
      console.log('⚠️ Starting server without database connection');
    }
    
    app.listen(PORT, () => {
      console.log('\n🎉 Server started successfully!');
      console.log('╭─────────────────────────────────────╮');
      console.log(`│  🌐 Server: http://localhost:${PORT}     │`);
      console.log(`│  📱 Frontend: http://localhost:3000    │`);
      console.log(`│  🔌 API: http://localhost:${PORT}/api   │`);
      console.log(`│  🔐 Auth: http://localhost:${PORT}/api/auth │`);
      console.log(`│  💾 Database: ${dbConnected ? '✅ Connected' : '❌ Disconnected'} │`);
      console.log('╰─────────────────────────────────────╯');
      console.log('\n  🏢 Core Management APIs:');
      console.log('    - GET  /api/users         👥 Users');
      console.log('    - GET  /api/stores        🏪 Stores');
      console.log('    - GET  /api/transactions  💳 Transactions');
      console.log('    - GET  /api/settlements   🧮 Settlements'); // 🆕 NEW
      console.log('    - GET  /api/coupons       🎟️ Coupons');
      console.log('    - GET  /api/rewards       🎁 Rewards');
      console.log('    - GET  /api/reward-history 📈 Reward History');
      console.log('  📚 Content Management:');
      console.log('    - GET  /api/faqs          📝 FAQs');
      console.log('    - GET  /api/terms         📋 Terms');
      console.log('    - GET  /api/videos        🎬 Videos');
      console.log('    - GET  /api/stores-sequence ⭐ Top Stores');
      console.log('    - GET  /api/surveys       📊 Surveys');
    });
  } catch (error) {
    console.error('💥 Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();