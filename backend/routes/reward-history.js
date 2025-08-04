// routes/reward-history.js - SIMPLIFIED VERSION to avoid wallet JOIN issues
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// GET /api/reward-history - Get all reward history with basic details
router.get('/', async (req, res) => {
  try {
    console.log('📥 GET /api/reward-history - Fetching all reward history');
    console.log('Query params:', req.query);
    
    const { 
      search, 
      limit = 10, 
      offset = 0,
      credit_debit,
      reward_type
    } = req.query;
    
    const limitInt = Math.max(1, Math.min(1000, parseInt(limit) || 10));
    const offsetInt = Math.max(0, parseInt(offset) || 0);
    
    console.log('Parsed params:', { limitInt, offsetInt, search, credit_debit, reward_type });
    
    // Simplified query without wallet JOIN to avoid issues
    let query = `
      SELECT 
        rh.id,
        rh.user_id,
        rh.transaction_id,
        rh.store_id,
        rh.reward_type,
        rh.amount,
        rh.description,
        rh.credit_debit,
        rh.created_at,
        
        -- User details
        u.first_name,
        u.last_name,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        u.email as user_email,
        u.phone_number as user_phone,
        
        -- Transaction details
        t.transaction_number,
        t.bill_amount,
        t.final_amount,
        t.cashback_used,
        t.payment_status,
        
        -- Store details
        s.name as store_name,
        s.phone_number as store_phone,
        s.address as store_address,
        
        -- Reward type details
        rt.reward_name
        
      FROM reward_history rh
      LEFT JOIN users u ON rh.user_id = u.id
      LEFT JOIN transactions t ON rh.transaction_id = t.id
      LEFT JOIN stores s ON rh.store_id = s.id
      LEFT JOIN reward_types rt ON rh.reward_type = rt.reward_id
      WHERE 1=1
    `;
    
    const params = [];
    
    // Add search functionality
    if (search && search.trim()) {
      query += ` AND (
        CONCAT(u.first_name, ' ', u.last_name) LIKE ? OR 
        u.email LIKE ? OR 
        u.phone_number LIKE ? OR
        s.name LIKE ? OR
        t.transaction_number LIKE ? OR
        rh.description LIKE ? OR
        rt.reward_name LIKE ?
      )`;
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    // Add credit/debit filter
    if (credit_debit !== undefined && credit_debit !== '') {
      query += ` AND rh.credit_debit = ?`;
      params.push(credit_debit);
    }
    
    // Add reward type filter
    if (reward_type !== undefined && reward_type !== '') {
      query += ` AND rh.reward_type = ?`;
      params.push(reward_type);
    }
    
    // Add ordering and pagination
    query += ` ORDER BY rh.created_at DESC LIMIT ${limitInt} OFFSET ${offsetInt}`;

    console.log('Final query:', query);
    console.log('Parameters:', params);
    
    // Execute the main query
    const [history] = await pool.execute(query, params);
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM reward_history rh
      LEFT JOIN users u ON rh.user_id = u.id
      LEFT JOIN stores s ON rh.store_id = s.id
      LEFT JOIN transactions t ON rh.transaction_id = t.id
      LEFT JOIN reward_types rt ON rh.reward_type = rt.reward_id
      WHERE 1=1
    `;
    const countParams = [];
    
    // Apply same filters to count query
    if (search && search.trim()) {
      countQuery += ` AND (
        CONCAT(u.first_name, ' ', u.last_name) LIKE ? OR 
        u.email LIKE ? OR 
        u.phone_number LIKE ? OR
        s.name LIKE ? OR
        t.transaction_number LIKE ? OR
        rh.description LIKE ? OR
        rt.reward_name LIKE ?
      )`;
      const searchTerm = `%${search.trim()}%`;
      countParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    if (credit_debit !== undefined && credit_debit !== '') {
      countQuery += ` AND rh.credit_debit = ?`;
      countParams.push(credit_debit);
    }
    
    if (reward_type !== undefined && reward_type !== '') {
      countQuery += ` AND rh.reward_type = ?`;
      countParams.push(reward_type);
    }
    
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    // Get basic stats
    const [statsResult] = await pool.execute(`
      SELECT 
        COUNT(*) as totalHistory,
        COUNT(DISTINCT rh.user_id) as uniqueUsers,
        COALESCE(SUM(CASE WHEN rh.credit_debit = 'credit' THEN rh.amount END), 0) as totalCredits,
        COALESCE(SUM(CASE WHEN rh.credit_debit = 'debit' THEN rh.amount END), 0) as totalDebits,
        COUNT(CASE WHEN rh.credit_debit = 'credit' THEN 1 END) as creditCount,
        COUNT(CASE WHEN rh.credit_debit = 'debit' THEN 1 END) as debitCount
      FROM reward_history rh
    `);
    
    console.log(`✅ Found ${history.length} reward history records out of ${total} total`);
    
    res.json({
      success: true,
      data: {
        history: history,
        pagination: {
          total: total,
          totalPages: Math.ceil(total / limitInt),
          currentPage: Math.floor(offsetInt / limitInt) + 1,
          itemsPerPage: limitInt
        },
        stats: statsResult[0]
      }
    });
  } catch (error) {
    console.error('❌ Error fetching reward history:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reward history',
      error: error.message
    });
  }
});

// GET /api/reward-history/:id - Get reward history by ID with basic details
router.get('/:id', async (req, res) => {
  try {
    console.log(`📥 GET /api/reward-history/${req.params.id} - Fetching reward history details`);
    
    const historyId = parseInt(req.params.id);
    
    if (isNaN(historyId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reward history ID'
      });
    }
    
    // Simplified query without wallet JOIN
    const [history] = await pool.execute(`
      SELECT 
        rh.id,
        rh.user_id,
        rh.transaction_id,
        rh.store_id,
        rh.reward_type,
        rh.amount,
        rh.description,
        rh.credit_debit,
        rh.created_at,
        
        -- User details
        u.first_name,
        u.last_name,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        u.email as user_email,
        u.phone_number as user_phone,
        u.created_at as user_join_date,
        
        -- Transaction details
        t.transaction_number,
        t.bill_amount,
        t.final_amount,
        t.cashback_used,
        t.payment_status,
        t.created_at as transaction_date,
        
        -- Store details
        s.name as store_name,
        s.phone_number as store_phone,
        s.email as store_email,
        s.address as store_address,
        
        -- Reward type details
        rt.reward_name,
        rt.reward_type as reward_type_category,
        rt.normal_users_reward_value,
        rt.vip_users_reward_value,
        rt.is_active as reward_type_active
        
      FROM reward_history rh
      LEFT JOIN users u ON rh.user_id = u.id
      LEFT JOIN transactions t ON rh.transaction_id = t.id
      LEFT JOIN stores s ON rh.store_id = s.id
      LEFT JOIN reward_types rt ON rh.reward_type = rt.reward_id
      WHERE rh.id = ?
    `, [historyId]);
    
    if (history.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reward history record not found'
      });
    }
    
    const historyRecord = history[0];
    
    // Get related reward history for the same user
    const [relatedHistory] = await pool.execute(`
      SELECT 
        rh.id,
        rh.reward_type,
        rh.amount,
        rh.credit_debit,
        rh.description,
        rh.created_at,
        t.transaction_number,
        s.name as store_name,
        rt.reward_name
      FROM reward_history rh
      LEFT JOIN transactions t ON rh.transaction_id = t.id
      LEFT JOIN stores s ON rh.store_id = s.id
      LEFT JOIN reward_types rt ON rh.reward_type = rt.reward_id
      WHERE rh.user_id = ? AND rh.id != ?
      ORDER BY rh.created_at DESC
      LIMIT 10
    `, [historyRecord.user_id, historyId]);
    
    // Calculate cashback earned if it's a transaction-linked reward
    if (historyRecord.transaction_id && historyRecord.bill_amount && historyRecord.final_amount) {
      historyRecord.cashback_earned = historyRecord.bill_amount - historyRecord.final_amount;
    }
    
    console.log(`✅ Reward history ${historyId} details fetched successfully`);
    
    res.json({
      success: true,
      data: {
        history: historyRecord,
        relatedHistory: relatedHistory
      }
    });
  } catch (error) {
    console.error('❌ Error fetching reward history details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reward history details',
      error: error.message
    });
  }
});

// Helper function for date validation
function isValidDate(dateString) {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

module.exports = router;