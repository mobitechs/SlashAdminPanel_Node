// routes/coupons.js - Complete Coupon Management API (FIXED for Real Database)
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// GET /api/coupons - Get all coupons with store and usage information
router.get('/', async (req, res) => {
  try {
    console.log('📥 GET /api/coupons - Fetching all coupons');
    console.log('Query params:', req.query);
    
    const { 
      search, 
      limit = 10, 
      offset = 0,
      include_store = 'true',
      include_usage = 'true',
      status,
      store_id
    } = req.query;
    
    // Convert parameters to proper types
    const limitInt = Math.max(1, Math.min(100, parseInt(limit) || 10));
    const offsetInt = Math.max(0, parseInt(offset) || 0);
    
    console.log('Parsed params:', { limitInt, offsetInt, search, status, store_id });
    
    // Base query with store information and usage statistics
    let query = `
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
        c.is_active,
        c.created_at,
        c.updated_at,
        s.name as store_name,
        COUNT(DISTINCT uc.id) as total_used,
        COUNT(DISTINCT CASE WHEN uc.is_used = 1 THEN uc.id END) as total_redeemed
      FROM coupons c
      LEFT JOIN stores s ON c.store_id = s.id
      LEFT JOIN user_coupons uc ON c.id = uc.coupon_id
      WHERE 1=1
    `;
    
    const params = [];
    
    // Add search functionality
    if (search && search.trim()) {
      query += ` AND (c.code LIKE ? OR c.title LIKE ? OR c.description LIKE ? OR s.name LIKE ?)`;
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    // Add status filter
    if (status !== undefined && status !== '') {
      const now = new Date().toISOString();
      switch (status.toLowerCase()) {
        case 'active':
          query += ` AND c.is_active = 1 AND c.valid_until >= ?`;
          params.push(now);
          break;
        case 'expired':
          query += ` AND c.valid_until < ?`;
          params.push(now);
          break;
        case 'inactive':
          query += ` AND c.is_active = 0`;
          break;
        case 'upcoming':
          query += ` AND c.is_active = 1 AND c.valid_from > ?`;
          params.push(now);
          break;
      }
    }
    
    // Add store filter
    if (store_id !== undefined && store_id !== '') {
      if (store_id === 'global') {
        query += ` AND c.store_id IS NULL`;
      } else {
        query += ` AND c.store_id = ?`;
        params.push(parseInt(store_id));
      }
    }
    
    // Add GROUP BY clause
    query += ` 
      GROUP BY 
        c.id, c.code, c.title, c.description, c.discount_amount, c.discount_percentage,
        c.store_id, c.min_order_amount, c.max_discount, c.valid_from, c.valid_until,
        c.usage_limit, c.is_active, c.created_at, c.updated_at, s.name
    `;
    
    // Add ordering and pagination
    query += ` ORDER BY c.created_at DESC LIMIT ${limitInt} OFFSET ${offsetInt}`;

    console.log('Final query:', query);
    console.log('Parameters:', params);
    
    // Execute the main query
    const [coupons] = await pool.execute(query, params);
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(DISTINCT c.id) as total 
      FROM coupons c 
      LEFT JOIN stores s ON c.store_id = s.id
      WHERE 1=1
    `;
    const countParams = [];
    
    if (search && search.trim()) {
      countQuery += ` AND (c.code LIKE ? OR c.title LIKE ? OR c.description LIKE ? OR s.name LIKE ?)`;
      const searchTerm = `%${search.trim()}%`;
      countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    if (status !== undefined && status !== '') {
      const now = new Date().toISOString();
      switch (status.toLowerCase()) {
        case 'active':
          countQuery += ` AND c.is_active = 1 AND c.valid_until >= ?`;
          countParams.push(now);
          break;
        case 'expired':
          countQuery += ` AND c.valid_until < ?`;
          countParams.push(now);
          break;
        case 'inactive':
          countQuery += ` AND c.is_active = 0`;
          break;
        case 'upcoming':
          countQuery += ` AND c.is_active = 1 AND c.valid_from > ?`;
          countParams.push(now);
          break;
      }
    }
    
    if (store_id !== undefined && store_id !== '') {
      if (store_id === 'global') {
        countQuery += ` AND c.store_id IS NULL`;
      } else {
        countQuery += ` AND c.store_id = ?`;
        countParams.push(parseInt(store_id));
      }
    }
    
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    // Get stats for dashboard
    const [statsResult] = await pool.execute(`
      SELECT 
        COUNT(DISTINCT c.id) as totalCoupons,
        COUNT(DISTINCT CASE WHEN c.is_active = 1 AND c.valid_until >= NOW() THEN c.id END) as activeCoupons,
        COUNT(DISTINCT uc.id) as totalRedemptions,
        COALESCE(SUM(CASE WHEN uc.is_used = 1 THEN 
          COALESCE(c.discount_amount, c.max_discount, 0) 
        END), 0) as totalSavings
      FROM coupons c
      LEFT JOIN user_coupons uc ON c.id = uc.coupon_id
    `);
    
    console.log(`✅ Found ${coupons.length} coupons out of ${total} total`);
    
    res.json({
      success: true,
      data: {
        coupons: coupons,
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
    console.error('❌ Error fetching coupons:', error);
    console.error('SQL Error Details:', {
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      sql: error.sql
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coupons',
      error: error.message,
      debug: {
        code: error.code,
        errno: error.errno,
        sqlMessage: error.sqlMessage
      }
    });
  }
});

// GET /api/coupons/:id - Get coupon by ID with complete details
router.get('/:id', async (req, res) => {
  try {
    console.log(`📥 GET /api/coupons/${req.params.id} - Fetching coupon details`);
    
    const couponId = parseInt(req.params.id);
    
    if (isNaN(couponId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coupon ID'
      });
    }
    
    // 1. Get coupon details with store information
    const [coupons] = await pool.execute(`
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
        c.is_active,
        c.created_at,
        c.updated_at,
        s.name as store_name,
        COUNT(DISTINCT uc.id) as total_used,
        COUNT(DISTINCT CASE WHEN uc.is_used = 1 THEN uc.id END) as total_redeemed
      FROM coupons c
      LEFT JOIN stores s ON c.store_id = s.id
      LEFT JOIN user_coupons uc ON c.id = uc.coupon_id
      WHERE c.id = ?
      GROUP BY 
        c.id, c.code, c.title, c.description, c.discount_amount, c.discount_percentage,
        c.store_id, c.min_order_amount, c.max_discount, c.valid_from, c.valid_until,
        c.usage_limit, c.is_active, c.created_at, c.updated_at, s.name
    `, [couponId]);
    
    if (coupons.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }
    
    const coupon = coupons[0];
    
    // 2. Get usage history with transaction and user details
    const [usages] = await pool.execute(`
      SELECT 
        uc.id,
        uc.user_id,
        uc.coupon_id,
        uc.is_used,
        uc.used_at,
        uc.transaction_id,
        uc.created_at,
        u.first_name,
        u.last_name,
        u.email,
        u.phone_number,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        t.transaction_number,
        t.bill_amount as order_amount,
        t.coupon_discount as discount_applied
      FROM user_coupons uc
      LEFT JOIN users u ON uc.user_id = u.id
      LEFT JOIN transactions t ON uc.transaction_id = t.id
      WHERE uc.coupon_id = ? AND uc.is_used = 1
      ORDER BY uc.used_at DESC
    `, [couponId]);
    
    // 3. Get all users who have this coupon (used and unused)
    const [users] = await pool.execute(`
      SELECT 
        uc.id,
        uc.user_id,
        uc.is_used,
        uc.used_at,
        uc.created_at,
        u.first_name,
        u.last_name,
        u.email,
        u.phone_number
      FROM user_coupons uc
      LEFT JOIN users u ON uc.user_id = u.id
      WHERE uc.coupon_id = ?
      ORDER BY uc.created_at DESC
    `, [couponId]);
    
    console.log(`✅ Coupon ${couponId} details fetched successfully`);
    console.log(`📊 Found ${usages.length} usages`);
    console.log(`👥 Found ${users.length} users with this coupon`);
    
    res.json({
      success: true,
      data: {
        coupon,
        usages,
        users
      }
    });
  } catch (error) {
    console.error('❌ Error fetching coupon details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coupon details',
      error: error.message
    });
  }
});

// POST /api/coupons - Create new coupon
router.post('/', async (req, res) => {
  try {
    console.log('📝 POST /api/coupons - Creating new coupon');
    console.log('Request data:', req.body);
    
    const {
      code,
      title,
      description,
      discount_amount,
      discount_percentage,
      store_id,
      min_order_amount = 0,
      max_discount,
      valid_from,
      valid_until,
      usage_limit = 1,
      is_active = 1
    } = req.body;

    // Validate required fields
    if (!code || !title || !valid_from || !valid_until) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: code, title, valid_from, valid_until'
      });
    }

    // Validate discount configuration
    if (!discount_amount && !discount_percentage) {
      return res.status(400).json({
        success: false,
        message: 'Either discount_amount or discount_percentage must be provided'
      });
    }

    if (discount_amount && discount_percentage) {
      return res.status(400).json({
        success: false,
        message: 'Cannot have both discount_amount and discount_percentage'
      });
    }

    // Validate dates
    const fromDate = new Date(valid_from);
    const untilDate = new Date(valid_until);
    
    if (untilDate <= fromDate) {
      return res.status(400).json({
        success: false,
        message: 'valid_until must be after valid_from'
      });
    }

    // Check if coupon code already exists
    const [existingCoupons] = await pool.execute(
      'SELECT id, code FROM coupons WHERE code = ?',
      [code.toUpperCase()]
    );

    if (existingCoupons.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code already exists'
      });
    }

    // Validate store_id if provided
    if (store_id) {
      const [stores] = await pool.execute(
        'SELECT id FROM stores WHERE id = ?',
        [store_id]
      );
      
      if (stores.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid store_id'
        });
      }
    }

    try {
      // Insert new coupon
      const [result] = await pool.execute(`
        INSERT INTO coupons (
          code, 
          title, 
          description, 
          discount_amount,
          discount_percentage,
          store_id,
          min_order_amount,
          max_discount,
          valid_from,
          valid_until,
          usage_limit,
          is_active,
          created_at, 
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        code.toUpperCase(),
        title,
        description || null,
        discount_amount || null,
        discount_percentage || null,
        store_id || null,
        min_order_amount,
        max_discount || null,
        valid_from,
        valid_until,
        usage_limit,
        is_active
      ]);

      const couponId = result.insertId;
      console.log(`✅ Coupon created with ID: ${couponId}`);

      // Fetch the complete created coupon data
      const [createdCoupons] = await pool.execute(`
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
          c.is_active,
          c.created_at,
          c.updated_at,
          s.name as store_name
        FROM coupons c
        LEFT JOIN stores s ON c.store_id = s.id
        WHERE c.id = ?
      `, [couponId]);

      console.log(`✅ Coupon ${couponId} created successfully`);

      res.status(201).json({
        success: true,
        message: 'Coupon created successfully',
        data: {
          coupon: createdCoupons[0]
        }
      });

    } catch (error) {
      console.error('❌ Error creating coupon:', error);
      
      // Handle specific database errors
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          message: 'Coupon code already exists'
        });
      }

      throw error;
    }

  } catch (error) {
    console.error('❌ Error creating coupon:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create coupon',
      error: error.message
    });
  }
});

// PUT /api/coupons/:id - Update coupon
router.put('/:id', async (req, res) => {
  try {
    console.log(`📝 PUT /api/coupons/${req.params.id} - Updating coupon`);
    console.log('Update data:', req.body);
    
    const couponId = parseInt(req.params.id);
    const updateData = req.body;
    
    if (isNaN(couponId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coupon ID'
      });
    }
    
    // Check if coupon exists
    const [existingCoupons] = await pool.execute(
      'SELECT id FROM coupons WHERE id = ?',
      [couponId]
    );
    
    if (existingCoupons.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    // Validate discount configuration if provided
    if (updateData.discount_amount && updateData.discount_percentage) {
      return res.status(400).json({
        success: false,
        message: 'Cannot have both discount_amount and discount_percentage'
      });
    }

    // Validate dates if provided
    if (updateData.valid_from && updateData.valid_until) {
      const fromDate = new Date(updateData.valid_from);
      const untilDate = new Date(updateData.valid_until);
      
      if (untilDate <= fromDate) {
        return res.status(400).json({
          success: false,
          message: 'valid_until must be after valid_from'
        });
      }
    }

    // Check for duplicate coupon code if code is being updated
    if (updateData.code) {
      const [duplicateCoupons] = await pool.execute(
        'SELECT id FROM coupons WHERE code = ? AND id != ?',
        [updateData.code.toUpperCase(), couponId]
      );
      
      if (duplicateCoupons.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Coupon code already exists'
        });
      }
    }

    // Validate store_id if provided
    if (updateData.store_id) {
      const [stores] = await pool.execute(
        'SELECT id FROM stores WHERE id = ?',
        [updateData.store_id]
      );
      
      if (stores.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid store_id'
        });
      }
    }

    try {
      // Build update query dynamically
      const updateFields = [];
      const updateParams = [];

      const allowedFields = [
        'code', 'title', 'description', 'discount_amount', 'discount_percentage',
        'store_id', 'min_order_amount', 'max_discount', 'valid_from', 
        'valid_until', 'usage_limit', 'is_active'
      ];

      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
            updateFields.push(`${field} = ?`);
            let value = updateData[field];
            
            // Special handling for specific fields
            if (field === 'code' && value) {
            value = value.toUpperCase();
            } else if (field === 'store_id' && value === '') {
            value = null;
            } else if ((field === 'discount_amount' || field === 'discount_percentage') && value === '') {
            value = null;
            } else if (field === 'valid_from' || field === 'valid_until') {
            // FIXED: Format dates properly for MySQL timestamp columns
            value = formatDateForMySQL(value);
            }
            
            updateParams.push(value);
        }
    }); 

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid fields to update'
        });
      }

      updateParams.push(couponId);

      await pool.execute(
        `UPDATE coupons SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = ?`,
        updateParams
      );

      // Fetch updated coupon
      const [updatedCoupons] = await pool.execute(`
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
          c.is_active,
          c.created_at,
          c.updated_at,
          s.name as store_name
        FROM coupons c
        LEFT JOIN stores s ON c.store_id = s.id
        WHERE c.id = ?
      `, [couponId]);

      console.log(`✅ Coupon ${couponId} updated successfully`);

      res.json({
        success: true,
        message: 'Coupon updated successfully',
        data: {
          coupon: updatedCoupons[0]
        }
      });

    } catch (error) {
      console.error('❌ Error updating coupon:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          message: 'Coupon code already exists'
        });
      }

      throw error;
    }

  } catch (error) {
    console.error('❌ Error updating coupon:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update coupon',
      error: error.message
    });
  }
});

// PATCH /api/coupons/:id - Update coupon status
router.patch('/:id', async (req, res) => {
  try {
    console.log(`🔄 PATCH /api/coupons/${req.params.id} - Updating coupon status`);
    console.log('Request body:', req.body);
    
    const couponId = parseInt(req.params.id);
    const { is_active } = req.body;
    
    if (isNaN(couponId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coupon ID'
      });
    }
    
    // Check if coupon exists
    const [existingCoupons] = await pool.execute(
      'SELECT id FROM coupons WHERE id = ?',
      [couponId]
    );
    
    if (existingCoupons.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    // Update coupon status
    const [result] = await pool.execute(
      'UPDATE coupons SET is_active = ?, updated_at = NOW() WHERE id = ?',
      [is_active, couponId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    console.log(`✅ Coupon ${couponId} status updated successfully (is_active: ${is_active})`);

    res.json({
      success: true,
      message: is_active === 0 ? 'Coupon deactivated successfully' : 'Coupon activated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating coupon status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update coupon status',
      error: error.message
    });
  }
});

// DELETE /api/coupons/:id - Delete coupon (hard delete)
router.delete('/:id', async (req, res) => {
  try {
    console.log(`🗑️ DELETE /api/coupons/${req.params.id} - Deleting coupon`);
    
    const couponId = parseInt(req.params.id);
    
    if (isNaN(couponId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coupon ID'
      });
    }
    
    // Check if coupon exists
    const [existingCoupons] = await pool.execute(
      'SELECT id FROM coupons WHERE id = ?',
      [couponId]
    );
    
    if (existingCoupons.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    // Check if coupon has been used
    const [usageCheck] = await pool.execute(
      'SELECT COUNT(*) as usage_count FROM user_coupons WHERE coupon_id = ? AND is_used = 1',
      [couponId]
    );

    if (usageCheck[0].usage_count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete coupon that has been used. Consider deactivating instead.'
      });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Delete user_coupons first (foreign key constraint)
      await connection.execute(
        'DELETE FROM user_coupons WHERE coupon_id = ?',
        [couponId]
      );

      // Delete the coupon
      const [result] = await connection.execute(
        'DELETE FROM coupons WHERE id = ?',
        [couponId]
      );

      await connection.commit();

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Coupon not found'
        });
      }

      console.log(`✅ Coupon ${couponId} deleted successfully`);

      res.json({
        success: true,
        message: 'Coupon deleted successfully'
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('❌ Error deleting coupon:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete coupon',
      error: error.message
    });
  }
});

// Helper functions
function isValidDate(dateString) {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

function formatDateForMySQL(dateString) {
  // Convert ISO string to MySQL timestamp format
  const date = new Date(dateString);
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

module.exports = router;