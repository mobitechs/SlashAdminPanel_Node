
// routes/dashboard.js (FIXED VERSION)
const express = require('express');
const router = express.Router();
const { User, Transaction, Store } = require('../models');

// GET /api/dashboard/overview - Get dashboard overview
router.get('/overview', async (req, res) => {
  try {
    const [userStats, transactionStats, storeStats] = await Promise.all([
      User.getAnalytics(),
      Transaction.getAnalytics(30),
      Store.getAnalytics()
    ]);

    res.json({
      success: true,
      data: {
        users: userStats,
        transactions: transactionStats,
        stores: storeStats,
        overview: {
          totalUsers: userStats.total_users,
          totalStores: storeStats.total_stores,
          totalTransactions: transactionStats.total_transactions,
          totalRevenue: transactionStats.total_revenue,
          revenueGrowth: '+12.5%', // Calculate this based on previous period
          userGrowth: '+8.2%',     // Calculate this based on previous period
        }
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
});

module.exports = router;