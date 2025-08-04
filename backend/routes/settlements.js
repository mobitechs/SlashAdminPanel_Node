// routes/settlements.js - Settlements API Routes (Updated with Store Info)
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// GET /api/settlements/store/:id/info - Get store information for store-wise settlements page
router.get('/store/:id/info', async (req, res) => {
  try {
    console.log(`📥 GET /api/settlements/store/${req.params.id}/info - Fetching store information`);
    
    const storeId = parseInt(req.params.id);
    
    if (isNaN(storeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid store ID'
      });
    }
    
    // Get store details
    const [stores] = await pool.execute(`
      SELECT 
        s.id,
        s.name,
        s.email,
        CAST(s.phone_number AS CHAR) as phone_number,
        s.address,
        s.latitude,
        s.longitude,
        s.normal_discount_percentage,
        s.vip_discount_percentage,
        s.minimum_order_amount,
        s.is_active,
        s.is_premium,
        s.created_at,
        s.updated_at,
        c.name as category_name,
        c.id as category_id
      FROM stores s
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE s.id = ? AND s.is_active = 1
    `, [storeId]);
    
    if (stores.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }
    
    const store = stores[0];
    
    // Get additional store statistics
    const [storeStats] = await pool.execute(`
      SELECT 
        COUNT(DISTINCT s.settlement_id) as totalSettlements,
        COUNT(DISTINCT s.user_id) as uniqueCustomers,
        COALESCE(SUM(s.settlement_amount), 0) as totalSettlementAmount,
        COALESCE(SUM(s.settled_amount), 0) as totalSettledAmount,
        COALESCE(SUM(s.pending_amount), 0) as totalPendingAmount,
        COALESCE(SUM(s.commission_amount), 0) as totalCommissionAmount,
        COALESCE(AVG(s.settlement_amount), 0) as averageSettlementValue,
        COUNT(CASE WHEN s.settlement_status = 'completed' THEN 1 END) as completedSettlements,
        COUNT(CASE WHEN s.settlement_status = 'pending' THEN 1 END) as pendingSettlements
      FROM settlements s
      WHERE s.store_id = ? AND s.is_active = 1
    `, [storeId]);
    
    console.log(`✅ Store ${storeId} information fetched successfully`);
    
    res.json({
      success: true,
      data: {
        store,
        stats: storeStats[0]
      }
    });
  } catch (error) {
    console.error('❌ Error fetching store information:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch store information',
      error: error.message
    });
  }
});

// GET /api/settlements/store/:id - Get all settlements for a specific store
router.get('/store/:id', async (req, res) => {
  try {
    console.log(`📥 GET /api/settlements/store/${req.params.id} - Fetching store settlements`);
    
    const storeId = parseInt(req.params.id);
    const { 
      search, 
      limit = 100, 
      offset = 0,
      settlement_status,
      payment_method,
      date_from,
      date_to
    } = req.query;
    
    if (isNaN(storeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid store ID'
      });
    }
    
    // Convert parameters to proper types
    const limitInt = Math.max(1, Math.min(1000, parseInt(limit) || 100));
    const offsetInt = Math.max(0, parseInt(offset) || 0);
    
    console.log('Parsed params:', { storeId, limitInt, offsetInt, search, settlement_status });
    
    // Base query for store settlements
    let query = `
      SELECT 
        s.settlement_id,
        s.store_id,
        s.transaction_id,
        s.user_id,
        s.bill_amount,
        s.commission_percentage,
        s.commission_amount,
        s.settlement_amount,
        s.settled_amount,
        s.pending_amount,
        s.extra_paid_amount,
        s.settlement_status,
        s.payment_method,
        s.payment_reference,
        s.bank_account,
        s.tax_amount,
        s.processing_fee,
        s.net_settlement_amount,
        s.processed_by,
        s.processed_at,
        s.transaction_date,
        s.settlement_date,
        s.created_at,
        s.updated_at,
        s.comments,
        s.is_active,
        s.final_amount,
        -- Store information
        st.name as store_name,
        st.email as store_email,
        CAST(st.phone_number AS CHAR) as store_phone,
        st.address as store_address,
        c.name as store_category,
        -- User information
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        u.email as user_email,
        CAST(u.phone_number AS CHAR) as user_phone,
        -- Transaction information
        t.transaction_number
      FROM settlements s
      LEFT JOIN stores st ON s.store_id = st.id
      LEFT JOIN categories c ON st.category_id = c.id
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN transactions t ON s.transaction_id = t.id
      WHERE s.is_active = 1 AND s.store_id = ?
    `;
    
    const params = [storeId];
    
    // Add search functionality
    if (search && search.trim()) {
      query += ` AND (
        s.settlement_id LIKE ? OR 
        CONCAT(u.first_name, ' ', u.last_name) LIKE ? OR 
        u.email LIKE ? OR 
        CAST(u.phone_number AS CHAR) LIKE ? OR
        s.settlement_status LIKE ? OR
        s.payment_reference LIKE ? OR
        t.transaction_number LIKE ?
      )`;
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    // Add settlement status filter
    if (settlement_status && settlement_status !== '') {
      query += ` AND s.settlement_status = ?`;
      params.push(settlement_status);
    }
    
    // Add payment method filter
    if (payment_method && payment_method !== '') {
      query += ` AND s.payment_method = ?`;
      params.push(payment_method);
    }
    
    // Add date range filters
    if (date_from && date_from !== '') {
      query += ` AND DATE(s.created_at) >= ?`;
      params.push(date_from);
    }
    
    if (date_to && date_to !== '') {
      query += ` AND DATE(s.created_at) <= ?`;
      params.push(date_to);
    }
    
    // Add ordering and pagination
    query += ` ORDER BY s.created_at DESC LIMIT ${limitInt} OFFSET ${offsetInt}`;

    console.log('Final query:', query);
    console.log('Parameters:', params);
    
    // Execute the main query
    const [settlements] = await pool.execute(query, params);
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(DISTINCT s.settlement_id) as total 
      FROM settlements s 
      LEFT JOIN stores st ON s.store_id = st.id
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN transactions t ON s.transaction_id = t.id
      WHERE s.is_active = 1 AND s.store_id = ?
    `;
    const countParams = [storeId];
    
    if (search && search.trim()) {
      countQuery += ` AND (
        s.settlement_id LIKE ? OR 
        CONCAT(u.first_name, ' ', u.last_name) LIKE ? OR 
        u.email LIKE ? OR 
        CAST(u.phone_number AS CHAR) LIKE ? OR
        s.settlement_status LIKE ? OR
        s.payment_reference LIKE ? OR
        t.transaction_number LIKE ?
      )`;
      const searchTerm = `%${search.trim()}%`;
      countParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    if (settlement_status && settlement_status !== '') {
      countQuery += ` AND s.settlement_status = ?`;
      countParams.push(settlement_status);
    }
    
    if (payment_method && payment_method !== '') {
      countQuery += ` AND s.payment_method = ?`;
      countParams.push(payment_method);
    }
    
    if (date_from && date_from !== '') {
      countQuery += ` AND DATE(s.created_at) >= ?`;
      countParams.push(date_from);
    }
    
    if (date_to && date_to !== '') {
      countQuery += ` AND DATE(s.created_at) <= ?`;
      countParams.push(date_to);
    }
    
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    // Get stats for this store
    const [statsResult] = await pool.execute(`
      SELECT 
        COUNT(DISTINCT s.settlement_id) as totalSettlements,
        COUNT(DISTINCT s.user_id) as uniqueUsers,
        COALESCE(SUM(s.settlement_amount), 0) as totalSettlementAmount,
        COALESCE(SUM(s.settled_amount), 0) as totalSettledAmount,
        COALESCE(SUM(s.pending_amount), 0) as totalPendingAmount,
        COALESCE(SUM(s.commission_amount), 0) as totalCommissionAmount,
        COALESCE(AVG(s.settlement_amount), 0) as averageSettlementValue
      FROM settlements s
      WHERE s.store_id = ? AND s.is_active = 1 AND s.settlement_status != 'cancelled'
    `, [storeId]);
    
    console.log(`✅ Found ${settlements.length} settlements out of ${total} total for store ${storeId}`);
    
    res.json({
      success: true,
      data: {
        settlements: settlements,
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
    console.error('❌ Error fetching store settlements:', error);
    console.error('SQL Error Details:', {
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      sql: error.sql
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch store settlements',
      error: error.message,
      debug: {
        code: error.code,
        errno: error.errno,
        sqlMessage: error.sqlMessage
      }
    });
  }
});

// GET /api/settlements - Get all settlements with detailed information
router.get('/', async (req, res) => {
  try {
    console.log('📥 GET /api/settlements - Fetching all settlements');
    console.log('Query params:', req.query);
    
    const { 
      search, 
      limit = 10, 
      offset = 0,
      store_id,
      user_id,
      settlement_status,
      payment_method,
      date_from,
      date_to
    } = req.query;
    
    // Convert parameters to proper types
    const limitInt = Math.max(1, Math.min(100, parseInt(limit) || 10));
    const offsetInt = Math.max(0, parseInt(offset) || 0);
    
    console.log('Parsed params:', { limitInt, offsetInt, search, store_id, user_id, settlement_status });
    
    // Base query using actual table names and columns from CSV
    let query = `
      SELECT 
        s.settlement_id,
        s.store_id,
        s.transaction_id,
        s.user_id,
        s.bill_amount,
        s.commission_percentage,
        s.commission_amount,
        s.settlement_amount,
        s.settled_amount,
        s.pending_amount,
        s.extra_paid_amount,
        s.settlement_status,
        s.payment_method,
        s.payment_reference,
        s.bank_account,
        s.tax_amount,
        s.processing_fee,
        s.net_settlement_amount,
        s.processed_by,
        s.processed_at,
        s.transaction_date,
        s.settlement_date,
        s.created_at,
        s.updated_at,
        s.comments,
        s.is_active,
        s.final_amount,
        -- Store information
        st.name as store_name,
        st.email as store_email,
        CAST(st.phone_number AS CHAR) as store_phone,
        st.address as store_address,
        c.name as store_category,
        -- User information
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        u.email as user_email,
        CAST(u.phone_number AS CHAR) as user_phone,
        -- Transaction information
        t.transaction_number
      FROM settlements s
      LEFT JOIN stores st ON s.store_id = st.id
      LEFT JOIN categories c ON st.category_id = c.id
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN transactions t ON s.transaction_id = t.id
      WHERE s.is_active = 1
    `;
    
    const params = [];
    
    // Add search functionality
    if (search && search.trim()) {
      query += ` AND (
        s.settlement_id LIKE ? OR 
        st.name LIKE ? OR 
        st.email LIKE ? OR 
        CAST(st.phone_number AS CHAR) LIKE ? OR 
        CONCAT(u.first_name, ' ', u.last_name) LIKE ? OR 
        u.email LIKE ? OR 
        CAST(u.phone_number AS CHAR) LIKE ? OR
        s.settlement_status LIKE ? OR
        s.payment_reference LIKE ? OR
        t.transaction_number LIKE ?
      )`;
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    // Add store filter
    if (store_id && store_id !== '') {
      query += ` AND s.store_id = ?`;
      params.push(parseInt(store_id));
    }
    
    // Add user filter
    if (user_id && user_id !== '') {
      query += ` AND s.user_id = ?`;
      params.push(parseInt(user_id));
    }
    
    // Add settlement status filter
    if (settlement_status && settlement_status !== '') {
      query += ` AND s.settlement_status = ?`;
      params.push(settlement_status);
    }
    
    // Add payment method filter
    if (payment_method && payment_method !== '') {
      query += ` AND s.payment_method = ?`;
      params.push(payment_method);
    }
    
    // Add date range filters
    if (date_from && date_from !== '') {
      query += ` AND DATE(s.created_at) >= ?`;
      params.push(date_from);
    }
    
    if (date_to && date_to !== '') {
      query += ` AND DATE(s.created_at) <= ?`;
      params.push(date_to);
    }
    
    // Add ordering and pagination
    query += ` ORDER BY s.created_at DESC LIMIT ${limitInt} OFFSET ${offsetInt}`;

    console.log('Final query:', query);
    console.log('Parameters:', params);
    
    // Execute the main query
    const [settlements] = await pool.execute(query, params);
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(DISTINCT s.settlement_id) as total 
      FROM settlements s 
      LEFT JOIN stores st ON s.store_id = st.id
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN transactions t ON s.transaction_id = t.id
      WHERE s.is_active = 1
    `;
    const countParams = [];
    
    if (search && search.trim()) {
      countQuery += ` AND (
        s.settlement_id LIKE ? OR 
        st.name LIKE ? OR 
        st.email LIKE ? OR 
        CAST(st.phone_number AS CHAR) LIKE ? OR 
        CONCAT(u.first_name, ' ', u.last_name) LIKE ? OR 
        u.email LIKE ? OR 
        CAST(u.phone_number AS CHAR) LIKE ? OR
        s.settlement_status LIKE ? OR
        s.payment_reference LIKE ? OR
        t.transaction_number LIKE ?
      )`;
      const searchTerm = `%${search.trim()}%`;
      countParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    if (store_id && store_id !== '') {
      countQuery += ` AND s.store_id = ?`;
      countParams.push(parseInt(store_id));
    }
    
    if (user_id && user_id !== '') {
      countQuery += ` AND s.user_id = ?`;
      countParams.push(parseInt(user_id));
    }
    
    if (settlement_status && settlement_status !== '') {
      countQuery += ` AND s.settlement_status = ?`;
      countParams.push(settlement_status);
    }
    
    if (payment_method && payment_method !== '') {
      countQuery += ` AND s.payment_method = ?`;
      countParams.push(payment_method);
    }
    
    if (date_from && date_from !== '') {
      countQuery += ` AND DATE(s.created_at) >= ?`;
      countParams.push(date_from);
    }
    
    if (date_to && date_to !== '') {
      countQuery += ` AND DATE(s.created_at) <= ?`;
      countParams.push(date_to);
    }
    
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    // Get stats for dashboard using actual table names
    const [statsResult] = await pool.execute(`
      SELECT 
        COUNT(DISTINCT s.settlement_id) as totalSettlements,
        COUNT(DISTINCT s.store_id) as uniqueStores,
        COUNT(DISTINCT s.user_id) as uniqueUsers,
        COALESCE(SUM(s.settlement_amount), 0) as totalSettlementAmount,
        COALESCE(SUM(s.settled_amount), 0) as totalSettledAmount,
        COALESCE(SUM(s.pending_amount), 0) as totalPendingAmount,
        COALESCE(SUM(s.commission_amount), 0) as totalCommissionAmount,
        COALESCE(AVG(s.settlement_amount), 0) as averageSettlementValue
      FROM settlements s
      WHERE s.is_active = 1 AND s.settlement_status != 'cancelled'
    `);
    
    console.log(`✅ Found ${settlements.length} settlements out of ${total} total`);
    
    res.json({
      success: true,
      data: {
        settlements: settlements,
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
    console.error('❌ Error fetching settlements:', error);
    console.error('SQL Error Details:', {
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      sql: error.sql
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settlements',
      error: error.message,
      debug: {
        code: error.code,
        errno: error.errno,
        sqlMessage: error.sqlMessage
      }
    });
  }
});

// GET /api/settlements/:id - Get settlement by ID with complete details
router.get('/:id', async (req, res) => {
  try {
    console.log(`📥 GET /api/settlements/${req.params.id} - Fetching settlement details`);
    
    const settlementId = parseInt(req.params.id);
    
    if (isNaN(settlementId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid settlement ID'
      });
    }
    
    // Get settlement details using actual table names and columns
    const [settlements] = await pool.execute(`
      SELECT 
        s.settlement_id,
        s.store_id,
        s.transaction_id,
        s.user_id,
        s.bill_amount,
        s.commission_percentage,
        s.commission_amount,
        s.settlement_amount,
        s.settled_amount,
        s.pending_amount,
        s.extra_paid_amount,
        s.settlement_status,
        s.payment_method,
        s.payment_reference,
        s.bank_account,
        s.tax_amount,
        s.processing_fee,
        s.net_settlement_amount,
        s.processed_by,
        s.processed_at,
        s.transaction_date,
        s.settlement_date,
        s.created_at,
        s.updated_at,
        s.comments,
        s.is_active,
        s.final_amount,
        -- Store information
        st.name as store_name,
        st.email as store_email,
        CAST(st.phone_number AS CHAR) as store_phone,
        st.address as store_address,
        st.latitude as store_latitude,
        st.longitude as store_longitude,
        c.name as store_category,
        -- User information
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        u.email as user_email,
        CAST(u.phone_number AS CHAR) as user_phone,
        u.referral_code as user_referral_code,
        -- Transaction information
        t.transaction_number,
        t.payment_status as transaction_payment_status
      FROM settlements s
      LEFT JOIN stores st ON s.store_id = st.id
      LEFT JOIN categories c ON st.category_id = c.id
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN transactions t ON s.transaction_id = t.id
      WHERE s.settlement_id = ? AND s.is_active = 1
    `, [settlementId]);
    
    if (settlements.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Settlement not found'
      });
    }
    
    const settlement = settlements[0];
    
    // Get related settlements for this store
    const [relatedSettlements] = await pool.execute(`
      SELECT 
        s.settlement_id,
        s.settlement_amount,
        s.settled_amount,
        s.settlement_status,
        s.created_at
      FROM settlements s
      WHERE s.store_id = ? AND s.settlement_id != ? AND s.is_active = 1
      ORDER BY s.created_at DESC
      LIMIT 10
    `, [settlement.store_id, settlementId]);
    
    console.log(`✅ Settlement ${settlementId} details fetched successfully`);
    console.log(`📈 Found ${relatedSettlements.length} related settlements`);
    
    res.json({
      success: true,
      data: {
        settlement,
        relatedSettlements
      }
    });
  } catch (error) {
    console.error('❌ Error fetching settlement details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settlement details',
      error: error.message
    });
  }
});

// POST /api/settlements - Create new settlement
router.post('/', async (req, res) => {
  try {
    console.log('📝 POST /api/settlements - Creating new settlement');
    console.log('Request data:', req.body);
    
    const {
      // Required fields
      store_id,
      user_id,
      bill_amount,
      commission_percentage,
      settlement_amount,
      
      // Optional fields
      transaction_id,
      commission_amount,
      settled_amount = 0,
      pending_amount = 0,
      extra_paid_amount = 0,
      settlement_status = 'pending',
      payment_method,
      payment_reference,
      bank_account,
      tax_amount = 0,
      processing_fee = 0,
      net_settlement_amount,
      processed_by,
      comments,
      transaction_date,
      settlement_date,
      final_amount = 0
    } = req.body;

    // Validate required fields
    if (!store_id || !user_id || !bill_amount || !commission_percentage || !settlement_amount) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided: store_id, user_id, bill_amount, commission_percentage, settlement_amount'
      });
    }

    // Clean and validate numeric fields
    const billAmountNum = parseFloat(bill_amount);
    const commissionPercentageNum = parseFloat(commission_percentage);
    const settlementAmountNum = parseFloat(settlement_amount);
    const commissionAmountNum = parseFloat(commission_amount) || (billAmountNum * commissionPercentageNum) / 100;
    const settledAmountNum = parseFloat(settled_amount) || 0;
    const pendingAmountNum = parseFloat(pending_amount) || 0;
    const extraPaidAmountNum = parseFloat(extra_paid_amount) || 0;
    const taxAmountNum = parseFloat(tax_amount) || 0;
    const processingFeeNum = parseFloat(processing_fee) || 0;
    const netSettlementAmountNum = parseFloat(net_settlement_amount) || (settlementAmountNum - taxAmountNum - processingFeeNum + extraPaidAmountNum);
    const finalAmountNum = parseFloat(final_amount) || 0;

    if (isNaN(billAmountNum) || billAmountNum <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Bill amount must be a positive number'
      });
    }

    if (isNaN(commissionPercentageNum) || commissionPercentageNum < 0 || commissionPercentageNum > 100) {
      return res.status(400).json({
        success: false,
        message: 'Commission percentage must be between 0 and 100'
      });
    }

    if (isNaN(settlementAmountNum) || settlementAmountNum < 0) {
      return res.status(400).json({
        success: false,
        message: 'Settlement amount must be a non-negative number'
      });
    }

    // Clean integer fields (convert empty strings to null)
    const cleanTransactionId = (transaction_id === '' || transaction_id == null) ? null : parseInt(transaction_id);
    const cleanProcessedBy = (processed_by === '' || processed_by == null) ? null : parseInt(processed_by);
    const cleanBankAccount = (bank_account === '' || bank_account == null) ? null : parseInt(bank_account);

    // Clean string fields (convert empty strings to null)
    const cleanPaymentMethod = (payment_method === '' || payment_method == null) ? null : payment_method;
    const cleanPaymentReference = (payment_reference === '' || payment_reference == null) ? null : payment_reference;
    const cleanComments = (comments === '' || comments == null) ? null : comments;

    // Clean date fields (convert empty strings to null)
    const cleanTransactionDate = (transaction_date === '' || transaction_date == null) ? null : transaction_date;
    const cleanSettlementDate = (settlement_date === '' || settlement_date == null) ? null : settlement_date;

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

    // Check if transaction exists (if provided)
    if (cleanTransactionId) {
      const [transactionExists] = await pool.execute(
        'SELECT id FROM transactions WHERE id = ?',
        [cleanTransactionId]
      );

      if (transactionExists.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid transaction ID'
        });
      }
    }

    console.log('Cleaned data for insertion:', {
      store_id,
      cleanTransactionId,
      user_id,
      billAmountNum,
      commissionPercentageNum,
      commissionAmountNum,
      settlementAmountNum,
      settledAmountNum,
      pendingAmountNum,
      extraPaidAmountNum,
      settlement_status,
      cleanPaymentMethod,
      cleanPaymentReference,
      cleanBankAccount,
      taxAmountNum,
      processingFeeNum,
      netSettlementAmountNum,
      cleanProcessedBy,
      cleanTransactionDate,
      cleanSettlementDate,
      cleanComments,
      finalAmountNum
    });

    // Insert new settlement using actual table name and columns
    const [result] = await pool.execute(`
      INSERT INTO settlements (
        store_id,
        transaction_id,
        user_id,
        bill_amount,
        commission_percentage,
        commission_amount,
        settlement_amount,
        settled_amount,
        pending_amount,
        extra_paid_amount,
        settlement_status,
        payment_method,
        payment_reference,
        bank_account,
        tax_amount,
        processing_fee,
        net_settlement_amount,
        processed_by,
        processed_at,
        transaction_date,
        settlement_date,
        created_at,
        updated_at,
        comments,
        is_active,
        final_amount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, 1, ?)
    `, [
      store_id,
      cleanTransactionId,
      user_id,
      billAmountNum,
      commissionPercentageNum,
      commissionAmountNum,
      settlementAmountNum,
      settledAmountNum,
      pendingAmountNum,
      extraPaidAmountNum,
      settlement_status,
      cleanPaymentMethod,
      cleanPaymentReference,
      cleanBankAccount,
      taxAmountNum,
      processingFeeNum,
      netSettlementAmountNum,
      cleanProcessedBy,
      cleanProcessedBy ? new Date() : null, // FIX: Use cleanProcessedBy instead of undefined processed_at
      cleanTransactionDate,
      cleanSettlementDate,
      cleanComments,
      finalAmountNum
    ]);

    const settlementId = result.insertId;
    console.log(`✅ Settlement created with ID: ${settlementId}`);

    // Fetch the complete created settlement data
    const [createdSettlements] = await pool.execute(`
      SELECT 
        s.*,
        st.name as store_name,
        u.first_name as user_first_name,
        u.last_name as user_last_name
      FROM settlements s
      LEFT JOIN stores st ON s.store_id = st.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.settlement_id = ?
    `, [settlementId]);

    console.log(`✅ Settlement ${settlementId} created successfully`);

    res.status(201).json({
      success: true,
      message: 'Settlement created successfully',
      data: {
        settlement: createdSettlements[0]
      }
    });

  } catch (error) {
    console.error('❌ Error creating settlement:', error);
    console.error('SQL Error Details:', {
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      sql: error.sql
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to create settlement',
      error: error.message,
      debug: {
        code: error.code,
        errno: error.errno,
        sqlMessage: error.sqlMessage
      }
    });
  }
});

// PUT /api/settlements/:id - Update settlement (FIXED VERSION - REPLACE BOTH PUT ROUTES)
router.put('/:id', async (req, res) => {
  try {
    console.log(`📝 PUT /api/settlements/${req.params.id} - Updating settlement`);
    console.log('Update data (raw):', req.body);
    
    const settlementId = parseInt(req.params.id);
    const updateData = { ...req.body }; // Clone to avoid modifying original
    
    if (isNaN(settlementId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid settlement ID'
      });
    }
    
    // Check if settlement exists
    const [existingSettlements] = await pool.execute(
      'SELECT settlement_id FROM settlements WHERE settlement_id = ? AND is_active = 1',
      [settlementId]
    );
    
    if (existingSettlements.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Settlement not found'
      });
    }

    // CRITICAL: Clean up data types before validation
    
    // 1. Handle integer fields that can be NULL (including processed_by)
    const integerFields = ['store_id', 'transaction_id', 'user_id', 'bank_account', 'processed_by'];
    integerFields.forEach(field => {
      if (updateData[field] !== undefined) {
        if (updateData[field] === '' || updateData[field] === null || updateData[field] === 'null') {
          updateData[field] = null;
        } else {
          const intValue = parseInt(updateData[field]);
          if (!isNaN(intValue) && intValue > 0) {
            updateData[field] = intValue;
          } else {
            updateData[field] = null;
          }
        }
      }
    });

    // 2. Handle decimal/numeric fields (set empty to 0)
    const numericFields = [
      'bill_amount', 'commission_percentage', 'commission_amount', 'settlement_amount',
      'settled_amount', 'pending_amount', 'extra_paid_amount', 'tax_amount', 
      'processing_fee', 'net_settlement_amount', 'final_amount'
    ];
    
    for (const field of numericFields) {
      if (updateData[field] !== undefined) {
        if (updateData[field] === '' || updateData[field] === null || updateData[field] === 'null') {
          updateData[field] = 0;
        } else {
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
    }

    // 3. Handle string fields that can be NULL  
    const stringFields = ['settlement_status', 'payment_method', 'payment_reference', 'comments'];
    stringFields.forEach(field => {
      if (updateData[field] !== undefined) {
        if (updateData[field] === '' || updateData[field] === 'null') {
          updateData[field] = null;
        }
        // Keep non-empty strings as is
      }
    });

    // 4. Handle date fields
    const dateFields = ['transaction_date', 'settlement_date'];
    dateFields.forEach(field => {
      if (updateData[field] !== undefined) {
        if (updateData[field] === '' || updateData[field] === null || updateData[field] === 'null') {
          updateData[field] = null;
        } else {
          // Validate date format
          const date = new Date(updateData[field]);
          if (isNaN(date.getTime())) {
            return res.status(400).json({
              success: false,
              message: `${field} must be a valid date`
            });
          }
          // Keep valid date as is
        }
      }
    });

    console.log('Update data (cleaned):', updateData);

    // Build update query dynamically
    const allowedFields = [
      'store_id', 'transaction_id', 'user_id', 'bill_amount', 'commission_percentage',
      'commission_amount', 'settlement_amount', 'settled_amount', 'pending_amount',
      'extra_paid_amount', 'settlement_status', 'payment_method', 'payment_reference',
      'bank_account', 'tax_amount', 'processing_fee', 'net_settlement_amount',
      'processed_by', 'transaction_date', 'settlement_date', 'comments', 'final_amount'
    ];
    
    const setClause = [];
    const params = [];

    allowedFields.forEach(field => {
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

    // Add processed_at if processed_by is being updated
    if (updateData.processed_by !== undefined && updateData.processed_by !== null) {
      setClause.push('processed_at = NOW()');
    }

    // Always update the updated_at timestamp
    setClause.push('updated_at = NOW()');
    params.push(settlementId);
    
    const updateQuery = `UPDATE settlements SET ${setClause.join(', ')} WHERE settlement_id = ?`;
    
    console.log('Final SQL Query:', updateQuery);
    console.log('Parameters:', params);
    
    await pool.execute(updateQuery, params);
    
    // Fetch updated settlement
    const [updatedSettlements] = await pool.execute(`
      SELECT 
        s.*,
        st.name as store_name,
        u.first_name as user_first_name,
        u.last_name as user_last_name
      FROM settlements s
      LEFT JOIN stores st ON s.store_id = st.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.settlement_id = ?
    `, [settlementId]);

    console.log(`✅ Settlement ${settlementId} updated successfully`);

    res.json({
      success: true,
      message: 'Settlement updated successfully',
      data: updatedSettlements[0]
    });
  } catch (error) {
    console.error('❌ Error updating settlement:', error);
    console.error('SQL Error Details:', {
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      sql: error.sql
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to update settlement',
      error: error.message,
      debug: {
        code: error.code,
        errno: error.errno,
        sqlMessage: error.sqlMessage
      }
    });
  }
});

// PATCH /api/settlements/:id - Update settlement status (KEEP THIS SEPARATE)
router.patch('/:id', async (req, res) => {
  try {
    console.log(`🔄 PATCH /api/settlements/${req.params.id} - Updating settlement status`);
    console.log('Request body:', req.body);
    
    const settlementId = parseInt(req.params.id);
    const { settlement_status } = req.body;
    
    if (isNaN(settlementId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid settlement ID'
      });
    }
    
    if (!settlement_status) {
      return res.status(400).json({
        success: false,
        message: 'Settlement status is required'
      });
    }

    // Validate settlement status
    const validStatuses = ['pending', 'processing', 'completed', 'failed', 'cancelled'];
    if (!validStatuses.includes(settlement_status.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid settlement status. Must be one of: ${validStatuses.join(', ')}`
      });
    }
    
    // Check if settlement exists
    const [existingSettlements] = await pool.execute(
      'SELECT settlement_id FROM settlements WHERE settlement_id = ? AND is_active = 1',
      [settlementId]
    );
    
    if (existingSettlements.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Settlement not found'
      });
    }

    // Update settlement status
    const [result] = await pool.execute(
      'UPDATE settlements SET settlement_status = ?, updated_at = NOW() WHERE settlement_id = ?',
      [settlement_status.toLowerCase(), settlementId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Settlement not found'
      });
    }

    console.log(`✅ Settlement ${settlementId} status updated successfully (settlement_status: ${settlement_status})`);

    res.json({
      success: true,
      message: `Settlement status updated to ${settlement_status} successfully`
    });

  } catch (error) {
    console.error('❌ Error updating settlement status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settlement status',
      error: error.message
    });
  }
});

// DELETE /api/settlements/:id - Delete settlement (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    console.log(`🗑️ DELETE /api/settlements/${req.params.id} - Deleting settlement`);
    
    const settlementId = parseInt(req.params.id);
    
    if (isNaN(settlementId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid settlement ID'
      });
    }
    
    // Check if settlement exists
    const [existingSettlements] = await pool.execute(
      'SELECT settlement_id, settlement_status FROM settlements WHERE settlement_id = ? AND is_active = 1',
      [settlementId]
    );
    
    if (existingSettlements.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Settlement not found'
      });
    }

    const settlement = existingSettlements[0];

    // Check if settlement can be deleted (only pending or failed settlements)
    if (['completed'].includes(settlement.settlement_status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete completed settlements. Consider cancelling instead.'
      });
    }

    // Soft delete the settlement (set is_active to 0)
    const [result] = await pool.execute(
      'UPDATE settlements SET is_active = 0, updated_at = NOW() WHERE settlement_id = ?',
      [settlementId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Settlement not found'
      });
    }

    console.log(`✅ Settlement ${settlementId} deleted successfully`);

    res.json({
      success: true,
      message: 'Settlement deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting settlement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete settlement',
      error: error.message
    });
  }
});

// GET /api/settlements/stats/overview - Get settlement statistics
router.get('/stats/overview', async (req, res) => {
  try {
    console.log('📊 GET /api/settlements/stats/overview - Fetching settlement statistics');
    
    const { period = '30' } = req.query; // days
    const periodInt = parseInt(period) || 30;
    
    // Get comprehensive settlement statistics using actual table names
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(s.settlement_id) as totalSettlements,
        COUNT(DISTINCT s.store_id) as uniqueStores,
        COUNT(DISTINCT s.user_id) as uniqueUsers,
        COALESCE(SUM(s.settlement_amount), 0) as totalSettlementAmount,
        COALESCE(SUM(s.settled_amount), 0) as totalSettledAmount,
        COALESCE(SUM(s.pending_amount), 0) as totalPendingAmount,
        COALESCE(SUM(s.commission_amount), 0) as totalCommissionAmount,
        COALESCE(AVG(s.settlement_amount), 0) as averageSettlementValue,
        COUNT(CASE WHEN s.settlement_status = 'completed' THEN 1 END) as completedSettlements,
        COUNT(CASE WHEN s.settlement_status = 'pending' THEN 1 END) as pendingSettlements,
        COUNT(CASE WHEN s.settlement_status = 'processing' THEN 1 END) as processingSettlements,
        COUNT(CASE WHEN s.settlement_status = 'failed' THEN 1 END) as failedSettlements
      FROM settlements s
      WHERE s.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) AND s.is_active = 1
    `, [periodInt]);

    // Get daily settlement trends
    const [dailyTrends] = await pool.execute(`
      SELECT 
        DATE(s.created_at) as date,
        COUNT(s.settlement_id) as settlement_count,
        COALESCE(SUM(s.settlement_amount), 0) as total_amount,
        COALESCE(AVG(s.settlement_amount), 0) as average_amount
      FROM settlements s
      WHERE s.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) AND s.is_active = 1
      GROUP BY DATE(s.created_at)
      ORDER BY date ASC
    `, [periodInt]);

    // Get top stores by settlement volume
    const [topStores] = await pool.execute(`
      SELECT 
        st.id,
        st.name,
        COUNT(s.settlement_id) as settlement_count,
        COALESCE(SUM(s.settlement_amount), 0) as total_amount
      FROM settlements s
      LEFT JOIN stores st ON s.store_id = st.id
      WHERE s.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) AND s.is_active = 1
      GROUP BY st.id, st.name
      ORDER BY settlement_count DESC
      LIMIT 10
    `, [periodInt]);

    // Get payment method distribution
    const [paymentMethods] = await pool.execute(`
      SELECT 
        s.payment_method,
        COUNT(s.settlement_id) as settlement_count,
        COALESCE(SUM(s.settlement_amount), 0) as total_amount
      FROM settlements s
      WHERE s.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) AND s.is_active = 1
        AND s.payment_method IS NOT NULL
      GROUP BY s.payment_method
      ORDER BY settlement_count DESC
    `, [periodInt]);

    console.log(`✅ Settlement statistics fetched for ${periodInt} days`);

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
    console.error('❌ Error fetching settlement statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settlement statistics',
      error: error.message
    });
  }
});

// Search endpoints for settlement forms
// GET /api/settlements/search/users - Search users for settlement forms
router.get('/search/users', async (req, res) => {
  try {
    console.log('🔍 GET /api/settlements/search/users - Searching users');
    
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

// GET /api/settlements/search/stores - Search stores for settlement forms
router.get('/search/stores', async (req, res) => {
  try {
    console.log('🔍 GET /api/settlements/search/stores - Searching stores');
    
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
        s.is_premium,
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

module.exports = router;