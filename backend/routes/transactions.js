// routes/transactions.js - Updated for Real Database Schema
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// GET /api/transactions - Get all transactions with detailed information
router.get('/', async (req, res) => {
  try {
    console.log('📥 GET /api/transactions - Fetching all transactions');
    console.log('Query params:', req.query);
    
    const { 
      search, 
      limit = 10, 
      offset = 0,
      store_id,
      user_id,
      payment_status,
      payment_method,
      date_from,
      date_to
    } = req.query;
    
    // Convert parameters to proper types
    const limitInt = Math.max(1, Math.min(100, parseInt(limit) || 10));
    const offsetInt = Math.max(0, parseInt(offset) || 0);
    
    console.log('Parsed params:', { limitInt, offsetInt, search, store_id, user_id, payment_status });
    
    // Base query using actual table names and columns from CSV
    let query = `
      SELECT 
        t.id,
        t.transaction_number,
        t.user_id,
        t.store_id,
        t.bill_amount,
        t.vendor_discount,
        t.cashback_used,
        t.coupon_discount,
        t.final_amount,
        t.cashback_earned,
        t.payment_method,
        t.payment_status,
        t.comment,
        t.created_at,
        t.updated_at,
        t.coupon_id,
        t.error_msg,
        -- Store information
        s.name as store_name,
        s.email as store_email,
        CAST(s.phone_number AS CHAR) as store_phone,
        s.address as store_address,
        c.name as store_category,
        -- User information
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        u.email as user_email,
        CAST(u.phone_number AS CHAR) as user_phone,
        -- Coupon information
        cp.code as coupon_code,
        cp.title as coupon_title
      FROM transactions t
      LEFT JOIN stores s ON t.store_id = s.id
      LEFT JOIN categories c ON s.category_id = c.id
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN coupons cp ON t.coupon_id = cp.id
      WHERE 1=1
    `;
    
    const params = [];
    
    // Add search functionality
    if (search && search.trim()) {
      query += ` AND (
        t.transaction_number LIKE ? OR 
        s.name LIKE ? OR 
        s.email LIKE ? OR 
        CAST(s.phone_number AS CHAR) LIKE ? OR 
        CONCAT(u.first_name, ' ', u.last_name) LIKE ? OR 
        u.email LIKE ? OR 
        CAST(u.phone_number AS CHAR) LIKE ? OR
        cp.code LIKE ? OR
        t.payment_status LIKE ?
      )`;
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    // Add store filter
    if (store_id && store_id !== '') {
      query += ` AND t.store_id = ?`;
      params.push(parseInt(store_id));
    }
    
    // Add user filter
    if (user_id && user_id !== '') {
      query += ` AND t.user_id = ?`;
      params.push(parseInt(user_id));
    }
    
    // Add payment status filter
    if (payment_status && payment_status !== '') {
      query += ` AND t.payment_status = ?`;
      params.push(payment_status);
    }
    
    // Add payment method filter
    if (payment_method && payment_method !== '') {
      query += ` AND t.payment_method = ?`;
      params.push(payment_method);
    }
    
    // Add date range filters
    if (date_from && date_from !== '') {
      query += ` AND DATE(t.created_at) >= ?`;
      params.push(date_from);
    }
    
    if (date_to && date_to !== '') {
      query += ` AND DATE(t.created_at) <= ?`;
      params.push(date_to);
    }
    
    // Add ordering and pagination
    query += ` ORDER BY t.created_at DESC LIMIT ${limitInt} OFFSET ${offsetInt}`;

    console.log('Final query:', query);
    console.log('Parameters:', params);
    
    // Execute the main query
    const [transactions] = await pool.execute(query, params);
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(DISTINCT t.id) as total 
      FROM transactions t 
      LEFT JOIN stores s ON t.store_id = s.id
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN coupons cp ON t.coupon_id = cp.id
      WHERE 1=1
    `;
    const countParams = [];
    
    if (search && search.trim()) {
      countQuery += ` AND (
        t.transaction_number LIKE ? OR 
        s.name LIKE ? OR 
        s.email LIKE ? OR 
        CAST(s.phone_number AS CHAR) LIKE ? OR 
        CONCAT(u.first_name, ' ', u.last_name) LIKE ? OR 
        u.email LIKE ? OR 
        CAST(u.phone_number AS CHAR) LIKE ? OR
        cp.code LIKE ? OR
        t.payment_status LIKE ?
      )`;
      const searchTerm = `%${search.trim()}%`;
      countParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    if (store_id && store_id !== '') {
      countQuery += ` AND t.store_id = ?`;
      countParams.push(parseInt(store_id));
    }
    
    if (user_id && user_id !== '') {
      countQuery += ` AND t.user_id = ?`;
      countParams.push(parseInt(user_id));
    }
    
    if (payment_status && payment_status !== '') {
      countQuery += ` AND t.payment_status = ?`;
      countParams.push(payment_status);
    }
    
    if (payment_method && payment_method !== '') {
      countQuery += ` AND t.payment_method = ?`;
      countParams.push(payment_method);
    }
    
    if (date_from && date_from !== '') {
      countQuery += ` AND DATE(t.created_at) >= ?`;
      countParams.push(date_from);
    }
    
    if (date_to && date_to !== '') {
      countQuery += ` AND DATE(t.created_at) <= ?`;
      countParams.push(date_to);
    }
    
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    // Get stats for dashboard using actual table names
    const [statsResult] = await pool.execute(`
      SELECT 
        COUNT(DISTINCT t.id) as totalTransactions,
        COUNT(DISTINCT t.store_id) as uniqueStores,
        COUNT(DISTINCT t.user_id) as uniqueUsers,
        COALESCE(SUM(t.bill_amount), 0) as totalBillAmount,
        COALESCE(SUM(t.final_amount), 0) as totalFinalAmount,
        COALESCE(SUM(t.vendor_discount), 0) as totalVendorDiscount,
        COALESCE(SUM(t.coupon_discount), 0) as totalCouponDiscount,
        COALESCE(SUM(t.cashback_used), 0) as totalCashbackUsed,
        COALESCE(AVG(t.final_amount), 0) as averageTransactionValue
      FROM transactions t
      WHERE t.payment_status != 'cancelled'
    `);
    
    console.log(`✅ Found ${transactions.length} transactions out of ${total} total`);
    
    res.json({
      success: true,
      data: {
        transactions: transactions,
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
    console.error('❌ Error fetching transactions:', error);
    console.error('SQL Error Details:', {
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      sql: error.sql
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message,
      debug: {
        code: error.code,
        errno: error.errno,
        sqlMessage: error.sqlMessage
      }
    });
  }
});

// GET /api/transactions/:id - Get transaction by ID with complete details
router.get('/:id', async (req, res) => {
  try {
    console.log(`📥 GET /api/transactions/${req.params.id} - Fetching transaction details`);
    
    const transactionId = parseInt(req.params.id);
    
    if (isNaN(transactionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction ID'
      });
    }
    
    // Get transaction details using actual table names and columns
    const [transactions] = await pool.execute(`
      SELECT 
        t.id,
        t.transaction_number,
        t.user_id,
        t.store_id,
        t.bill_amount,
        t.vendor_discount,
        t.cashback_used,
        t.coupon_discount,
        t.final_amount,
        t.cashback_earned,
        t.payment_method,
        t.payment_status,
        t.comment,
        t.created_at,
        t.updated_at,
        t.coupon_id,
        t.error_msg,
        -- Store information
        s.name as store_name,
        s.email as store_email,
        CAST(s.phone_number AS CHAR) as store_phone,
        s.address as store_address,
        s.latitude as store_latitude,
        s.longitude as store_longitude,
        c.name as store_category,
        -- User information
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        u.email as user_email,
        CAST(u.phone_number AS CHAR) as user_phone,
        u.referral_code as user_referral_code,
        -- Coupon information
        cp.code as coupon_code,
        cp.title as coupon_title,
        cp.description as coupon_description,
        cp.discount_amount as coupon_discount_amount,
        cp.discount_percentage as coupon_discount_percentage
      FROM transactions t
      LEFT JOIN stores s ON t.store_id = s.id
      LEFT JOIN categories c ON s.category_id = c.id
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN coupons cp ON t.coupon_id = cp.id
      WHERE t.id = ?
    `, [transactionId]);
    
    if (transactions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    const transaction = transactions[0];
    
    // Get related transactions for this user at this store
    const [relatedTransactions] = await pool.execute(`
      SELECT 
        t.id,
        t.transaction_number,
        t.bill_amount,
        t.final_amount,
        t.payment_status,
        t.created_at
      FROM transactions t
      WHERE t.user_id = ? AND t.store_id = ? AND t.id != ?
      ORDER BY t.created_at DESC
      LIMIT 10
    `, [transaction.user_id, transaction.store_id, transactionId]);
    
    console.log(`✅ Transaction ${transactionId} details fetched successfully`);
    console.log(`📈 Found ${relatedTransactions.length} related transactions`);
    
    res.json({
      success: true,
      data: {
        transaction,
        relatedTransactions
      }
    });
  } catch (error) {
    console.error('❌ Error fetching transaction details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction details',
      error: error.message
    });
  }
});

// POST /api/transactions - Create new transaction
router.post('/', async (req, res) => {
  try {
    console.log('📝 POST /api/transactions - Creating new transaction');
    console.log('Request data:', req.body);
    
    const {
      // Required fields
      store_id,
      user_id,
      bill_amount,
      final_amount,
      payment_method,
      
      // Optional fields
      transaction_number,
      vendor_discount = 0,
      cashback_used = 0,
      cashback_earned = 0,
      coupon_discount = 0,
      coupon_id,
      payment_status = 'pending',
      comment,
      error_msg
    } = req.body;

    // Validate required fields
    if (!store_id || !user_id || !bill_amount || !final_amount || !payment_method) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided: store_id, user_id, bill_amount, final_amount, payment_method'
      });
    }

    // Validate numeric fields
    const billAmountNum = parseFloat(bill_amount);
    const finalAmountNum = parseFloat(final_amount);
    const vendorDiscountNum = parseFloat(vendor_discount) || 0;
    const cashbackUsedNum = parseFloat(cashback_used) || 0;
    const cashbackEarnedNum = parseFloat(cashback_earned) || 0;
    const couponDiscountNum = parseFloat(coupon_discount) || 0;

    if (isNaN(billAmountNum) || billAmountNum <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Bill amount must be a positive number'
      });
    }

    if (isNaN(finalAmountNum) || finalAmountNum < 0) {
      return res.status(400).json({
        success: false,
        message: 'Final amount must be a non-negative number'
      });
    }

    // Check if store exists
    const [storeExists] = await pool.execute(
      'SELECT id FROM stores WHERE id = ? AND is_active = 1',
      [store_id]
    );

    if (storeExists.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid store ID or store is inactive'
      });
    }

    // Check if user exists
    const [userExists] = await pool.execute(
      'SELECT id FROM users WHERE id = ? AND is_active = 1',
      [user_id]
    );

    if (userExists.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID or user is inactive'
      });
    }

    // Generate transaction number if not provided
    let transactionNum = transaction_number;
    if (!transactionNum) {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      transactionNum = `TXN${timestamp}${random}`;
    }

    // Check if transaction number already exists
    const [existingTransaction] = await pool.execute(
      'SELECT id FROM transactions WHERE transaction_number = ?',
      [transactionNum]
    );

    if (existingTransaction.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Transaction number already exists'
      });
    }

    // Insert new transaction using actual table name and columns
    const [result] = await pool.execute(`
      INSERT INTO transactions (
        transaction_number,
        user_id,
        store_id,
        bill_amount,
        vendor_discount,
        cashback_used,
        coupon_discount,
        final_amount,
        cashback_earned,
        payment_method,
        payment_status,
        comment,
        created_at,
        updated_at,
        coupon_id,
        error_msg
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, ?)
    `, [
      transactionNum,
      user_id,
      store_id,
      billAmountNum,
      vendorDiscountNum,
      cashbackUsedNum,
      couponDiscountNum,
      finalAmountNum,
      cashbackEarnedNum,
      payment_method,
      payment_status,
      comment || null,
      coupon_id || null,
      error_msg || null
    ]);

    const transactionId = result.insertId;
    console.log(`✅ Transaction created with ID: ${transactionId}`);

    // Fetch the complete created transaction data
    const [createdTransactions] = await pool.execute(`
      SELECT 
        t.*,
        s.name as store_name,
        u.first_name as user_first_name,
        u.last_name as user_last_name
      FROM transactions t
      LEFT JOIN stores s ON t.store_id = s.id
      LEFT JOIN users  u ON t.user_id = u.id
      WHERE t.id = ?
    `, [transactionId]);

    console.log(`✅ Transaction ${transactionId} created successfully`);

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: {
        transaction: createdTransactions[0]
      }
    });

  } catch (error) {
    console.error('❌ Error creating transaction:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Transaction number already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create transaction',
      error: error.message
    });
  }
});

// PUT /api/transactions/:id - Update transaction
router.put('/:id', async (req, res) => {
  try {
    console.log(`📝 PUT /api/transactions/${req.params.id} - Updating transaction`);
    console.log('Update data:', req.body);
    
    const transactionId = parseInt(req.params.id);
    const updateData = req.body;
    
    if (isNaN(transactionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction ID'
      });
    }
    
    // Check if transaction exists
    const [existingTransactions] = await pool.execute(
      'SELECT id FROM transactions WHERE id = ?',
      [transactionId]
    );
    
    if (existingTransactions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Validate numeric fields if provided
    const numericFields = ['bill_amount', 'vendor_discount', 'cashback_used', 'cashback_earned', 'coupon_discount', 'final_amount'];
    for (const field of numericFields) {
      if (updateData[field] !== undefined) {
        const numValue = parseFloat(updateData[field]);
        if (isNaN(numValue) || numValue < 0) {
          return res.status(400).json({
            success: false,
            message: `${field} must be a non-negative number`
          });
        }
        updateData[field] = numValue;
      }
    }

    // Build update query dynamically using actual table columns
    const updateFields = [
      'transaction_number', 'user_id', 'store_id', 'bill_amount', 'vendor_discount',
      'cashback_used', 'cashback_earned', 'coupon_discount', 'final_amount',
      'payment_method', 'payment_status', 'comment', 'coupon_id', 'error_msg'
    ];
    
    const setClause = [];
    const params = [];

    updateFields.forEach(field => {
      if (updateData[field] !== undefined) {
        setClause.push(`${field} = ?`);
        params.push(updateData[field]);
      }
    });

    if (setClause.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    params.push(transactionId);
    
    await pool.execute(
      `UPDATE transactions SET ${setClause.join(', ')}, updated_at = NOW() WHERE id = ?`,
      params
    );
    
    // Fetch updated transaction
    const [updatedTransactions] = await pool.execute(`
      SELECT 
        t.*,
        s.name as store_name,
        u.first_name as user_first_name,
        u.last_name as user_last_name
      FROM transactions t
      LEFT JOIN stores s ON t.store_id = s.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
    `, [transactionId]);

    console.log(`✅ Transaction ${transactionId} updated successfully`);

    res.json({
      success: true,
      message: 'Transaction updated successfully',
      data: updatedTransactions[0]
    });
  } catch (error) {
    console.error('❌ Error updating transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update transaction',
      error: error.message
    });
  }
});

// PATCH /api/transactions/:id - Update transaction status
router.patch('/:id', async (req, res) => {
  try {
    console.log(`🔄 PATCH /api/transactions/${req.params.id} - Updating transaction status`);
    console.log('Request body:', req.body);
    
    const transactionId = parseInt(req.params.id);
    const { payment_status } = req.body;
    
    if (isNaN(transactionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction ID'
      });
    }
    
    if (!payment_status) {
      return res.status(400).json({
        success: false,
        message: 'Payment status is required'
      });
    }

    // Validate payment status
    const validStatuses = ['pending', 'completed', 'failed', 'cancelled', 'refunded'];
    if (!validStatuses.includes(payment_status.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid payment status. Must be one of: ${validStatuses.join(', ')}`
      });
    }
    
    // Check if transaction exists
    const [existingTransactions] = await pool.execute(
      'SELECT id FROM transactions WHERE id = ?',
      [transactionId]
    );
    
    if (existingTransactions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Update transaction status
    const [result] = await pool.execute(
      'UPDATE transactions SET payment_status = ?, updated_at = NOW() WHERE id = ?',
      [payment_status.toLowerCase(), transactionId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    console.log(`✅ Transaction ${transactionId} status updated successfully (payment_status: ${payment_status})`);

    res.json({
      success: true,
      message: `Transaction status updated to ${payment_status} successfully`
    });

  } catch (error) {
    console.error('❌ Error updating transaction status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update transaction status',
      error: error.message
    });
  }
});

// DELETE /api/transactions/:id - Delete transaction
router.delete('/:id', async (req, res) => {
  try {
    console.log(`🗑️ DELETE /api/transactions/${req.params.id} - Deleting transaction`);
    
    const transactionId = parseInt(req.params.id);
    
    if (isNaN(transactionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction ID'
      });
    }
    
    // Check if transaction exists
    const [existingTransactions] = await pool.execute(
      'SELECT id, payment_status FROM transactions WHERE id = ?',
      [transactionId]
    );
    
    if (existingTransactions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    const transaction = existingTransactions[0];

    // Check if transaction can be deleted (only pending or failed transactions)
    if (['completed', 'refunded'].includes(transaction.payment_status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete completed or refunded transactions. Consider cancelling instead.'
      });
    }

    // Delete the transaction
    const [result] = await pool.execute(
      'DELETE FROM transactions WHERE id = ?',
      [transactionId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    console.log(`✅ Transaction ${transactionId} deleted successfully`);

    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete transaction',
      error: error.message
    });
  }
});

// GET /api/transactions/stats/overview - Get transaction statistics
router.get('/stats/overview', async (req, res) => {
  try {
    console.log('📊 GET /api/transactions/stats/overview - Fetching transaction statistics');
    
    const { period = '30' } = req.query; // days
    const periodInt = parseInt(period) || 30;
    
    // Get comprehensive transaction statistics using actual table names
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(t.id) as totalTransactions,
        COUNT(DISTINCT t.store_id) as uniqueStores,
        COUNT(DISTINCT t.user_id) as uniqueUsers,
        COALESCE(SUM(t.bill_amount), 0) as totalBillAmount,
        COALESCE(SUM(t.final_amount), 0) as totalFinalAmount,
        COALESCE(SUM(t.vendor_discount), 0) as totalVendorDiscount,
        COALESCE(SUM(t.coupon_discount), 0) as totalCouponDiscount,
        COALESCE(SUM(t.cashback_used), 0) as totalCashbackUsed,
        COALESCE(AVG(t.final_amount), 0) as averageTransactionValue,
        COUNT(CASE WHEN t.payment_status = 'completed' THEN 1 END) as completedTransactions,
        COUNT(CASE WHEN t.payment_status = 'pending' THEN 1 END) as pendingTransactions,
        COUNT(CASE WHEN t.payment_status = 'failed' THEN 1 END) as failedTransactions
      FROM transactions t
      WHERE t.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [periodInt]);

    // Get daily transaction trends
    const [dailyTrends] = await pool.execute(`
      SELECT 
        DATE(t.created_at) as date,
        COUNT(t.id) as transaction_count,
        COALESCE(SUM(t.final_amount), 0) as total_amount,
        COALESCE(AVG(t.final_amount), 0) as average_amount
      FROM transactions t
      WHERE t.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(t.created_at)
      ORDER BY date ASC
    `, [periodInt]);

    // Get top stores by transaction volume
    const [topStores] = await pool.execute(`
      SELECT 
        s.id,
        s.name,
        COUNT(t.id) as transaction_count,
        COALESCE(SUM(t.final_amount), 0) as total_amount
      FROM transactions t
      LEFT JOIN stores s ON t.store_id = s.id
      WHERE t.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY s.id, s.name
      ORDER BY transaction_count DESC
      LIMIT 10
    `, [periodInt]);

    // Get payment method distribution
    const [paymentMethods] = await pool.execute(`
      SELECT 
        t.payment_method,
        COUNT(t.id) as transaction_count,
        COALESCE(SUM(t.final_amount), 0) as total_amount
      FROM transactions t
      WHERE t.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY t.payment_method
      ORDER BY transaction_count DESC
    `, [periodInt]);

    console.log(`✅ Transaction statistics fetched for ${periodInt} days`);

    res.json({
      success: true,
      data: {
        overview: stats[0],
        dailyTrends,
        topStores,
        paymentMethods,
        period: periodInt
      }
    });

  } catch (error) {
    console.error('❌ Error fetching transaction statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction statistics',
      error: error.message
    });
  }
});

// Search endpoints for transaction forms
// GET /api/transactions/search/users - Search users for transaction forms
router.get('/search/users', async (req, res) => {
  try {
    console.log('🔍 GET /api/transactions/search/users - Searching users');
    
    const { q: searchTerm } = req.query;
    
    if (!searchTerm || searchTerm.length < 2) {
      return res.json({
        success: true,
        data: [],
        message: 'Search term too short'
      });
    }

    const searchPattern = `%${searchTerm}%`;
    
    const [users] = await pool.execute(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        CAST(u.phone_number AS CHAR) as phone_number,
        u.is_active,
        COALESCE(uw.available_cashback, 0) as available_cashback,
        COALESCE(uw.total_cashback_earned, 0) as total_cashback_earned
      FROM users u
      LEFT JOIN user_wallets uw ON u.id = uw.user_id
      WHERE (
        LOWER(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))) LIKE LOWER(?) OR
        LOWER(COALESCE(u.email, '')) LIKE LOWER(?) OR
        CAST(u.phone_number AS CHAR) LIKE ?
      ) 
      AND u.is_active = 1
      ORDER BY u.first_name, u.last_name
      LIMIT 10
    `, [searchPattern, searchPattern, searchPattern]);

    console.log(`✅ Found ${users.length} users matching "${searchTerm}"`);

    res.json({
      success: true,
      data: users,
      count: users.length
    });

  } catch (error) {
    console.error('❌ User search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search users',
      error: error.message
    });
  }
});

// GET /api/transactions/search/stores - Search stores for transaction forms
router.get('/search/stores', async (req, res) => {
  try {
    console.log('🔍 GET /api/transactions/search/stores - Searching stores');
    
    const { q: searchTerm } = req.query;
    
    if (!searchTerm || searchTerm.length < 2) {
      return res.json({
        success: true,
        data: [],
        message: 'Search term too short'
      });
    }

    const searchPattern = `%${searchTerm}%`;
    
    const [stores] = await pool.execute(`
      SELECT 
        s.id,
        s.name,
        s.email,
        CAST(s.phone_number AS CHAR) as phone_number,
        s.address,
        s.normal_discount_percentage,
        s.vip_discount_percentage,
        s.minimum_order_amount,
        s.is_active,
        s.is_partner,
        c.name as category_name
      FROM stores s
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE (
        LOWER(COALESCE(s.name, '')) LIKE LOWER(?) OR
        LOWER(COALESCE(s.email, '')) LIKE LOWER(?) OR
        CAST(s.phone_number AS CHAR) LIKE ?
      ) 
      AND s.is_active = 1
      ORDER BY s.name
      LIMIT 10
    `, [searchPattern, searchPattern, searchPattern]);

    console.log(`✅ Found ${stores.length} stores matching "${searchTerm}"`);

    res.json({
      success: true,
      data: stores,
      count: stores.length
    });

  } catch (error) {
    console.error('❌ Store search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search stores',
      error: error.message
    });
  }
});


// GET /api/transactions/search/coupons - Search coupons for transaction forms
// GET /api/transactions/search/coupons - Search coupons for transaction forms (DEBUG VERSION)
router.get('/search/coupons', async (req, res) => {
  try {
    console.log('🔍 GET /api/transactions/search/coupons - Searching coupons');
    
    const { q: searchTerm } = req.query;
    
    if (!searchTerm || searchTerm.length < 2) {
      return res.json({
        success: true,
        data: [],
        message: 'Search term too short'
      });
    }

    const searchPattern = `%${searchTerm}%`;
    const currentDate = new Date().toISOString().split('T')[0];
    
    console.log(`🔍 Searching for pattern: "${searchPattern}"`);
    console.log(`📅 Current date: ${currentDate}`);
    
    // Try to search coupons with debug info
    try {
      // First, let's see all coupons to understand the data
      const [allCoupons] = await pool.execute(`
        SELECT 
          c.id,
          c.code,
          c.title,
          c.description,
          c.discount_amount,
          c.discount_percentage,
          c.store_id,
          c.min_order_amount,
          c.max_discount,
          c.valid_from,
          c.valid_until,
          c.usage_limit,
          c.is_active
        FROM coupons c
        LIMIT 5
      `);
      
      console.log('📋 Sample coupons in database:', allCoupons);
      
      // Now search with less restrictive conditions
      const [couponsStep1] = await pool.execute(`
        SELECT 
          c.id,
          c.code,
          c.title,
          c.is_active,
          c.valid_from,
          c.valid_until,
          LOWER(COALESCE(c.code, '')) as lower_code,
          LOWER(?) as search_pattern
        FROM coupons c
        WHERE LOWER(COALESCE(c.code, '')) LIKE LOWER(?)
      `, [searchPattern, searchPattern]);
      
      console.log('🔍 Step 1 - Code match only:', couponsStep1);
      
      // Add active filter
      const [couponsStep2] = await pool.execute(`
        SELECT 
          c.id,
          c.code,
          c.title,
          c.is_active,
          c.valid_from,
          c.valid_until
        FROM coupons c
        WHERE LOWER(COALESCE(c.code, '')) LIKE LOWER(?)
        AND c.is_active = 1
      `, [searchPattern]);
      
      console.log('🔍 Step 2 - Code + Active filter:', couponsStep2);
      
      // Final query with all conditions but more flexible date handling
      const [finalCoupons] = await pool.execute(`
        SELECT 
          c.id,
          c.code,
          c.title as name,
          c.description,
          c.discount_amount,
          c.discount_percentage,
          c.store_id,
          c.min_order_amount,
          c.max_discount,
          c.valid_from,
          c.valid_until,
          c.usage_limit,
          c.is_active
        FROM coupons c
        WHERE LOWER(COALESCE(c.code, '')) LIKE LOWER(?)
        AND c.is_active = 1
        AND (c.valid_from IS NULL OR DATE(c.valid_from) <= ?)
        AND (c.valid_until IS NULL OR DATE(c.valid_until) >= ?)
        ORDER BY c.code
        LIMIT 10
      `, [searchPattern, currentDate, currentDate]);

      console.log(`✅ Final result: Found ${finalCoupons.length} coupons matching "${searchTerm}"`);
      console.log('📋 Final coupons:', finalCoupons);

      res.json({
        success: true,
        data: finalCoupons,
        count: finalCoupons.length,
        debug: {
          searchPattern,
          currentDate,
          allCouponsCount: allCoupons.length,
          step1Count: couponsStep1.length,
          step2Count: couponsStep2.length,
          finalCount: finalCoupons.length
        }
      });
    } catch (tableError) {
      console.warn('⚠️ Coupons table error:', tableError.message);
      res.json({
        success: true,
        data: [],
        count: 0,
        message: 'Coupons feature not available',
        error: tableError.message
      });
    }

  } catch (error) {
    console.error('❌ Coupon search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search coupons',
      error: error.message
    });
  }
});

module.exports = router;