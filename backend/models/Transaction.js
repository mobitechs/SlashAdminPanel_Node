// models/Transaction.js - ULTRA SIMPLE VERSION
const { pool } = require('../config/database');

class Transaction {
  static async getAll(filters = {}) {
    try {
      const simpleQuery = `
        SELECT 
          t.id,
          t.transaction_number,
          t.final_amount,
          t.payment_status,
          t.created_at
        FROM transactions t
        ORDER BY t.created_at DESC
        LIMIT 10
      `;
      
      const [rows] = await pool.execute(simpleQuery);
      const [countResult] = await pool.execute('SELECT COUNT(*) as total FROM transactions');
      
      return {
        transactions: rows,
        total: countResult[0].total,
        pagination: {
          page: 1,
          limit: 10,
          totalPages: Math.ceil(countResult[0].total / 10)
        }
      };
    } catch (error) {
      console.error('Transaction.getAll error:', error);
      throw error;
    }
  }

  static async getAnalytics() {
    try {
      const [stats] = await pool.execute(`
        SELECT 
          COUNT(*) as total_transactions,
          COALESCE(SUM(final_amount), 0) as total_revenue
        FROM transactions
      `);
      
      return {
        total_transactions: parseInt(stats[0].total_transactions) || 0,
        successful_transactions: 0,
        pending_transactions: 0,
        failed_transactions: 0,
        total_revenue: parseFloat(stats[0].total_revenue) || 0,
        avg_transaction_value: 0,
        dailyRevenue: []
      };
    } catch (error) {
      console.error('Transaction.getAnalytics error:', error);
      throw error;
    }
  }
}

module.exports = Transaction;