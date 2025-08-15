// routes/coupons.js - Complete Coupon Management API (UPDATED for coupon_master table)
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
    
    // Base query with store information
    let query = `
      SELECT 
        c.coupon_id as id,
        c.coupon_id,
        c.coupon_name,
        c.description,
        c.discount_type,
        c.discount_value,
        c.valid_from,
        c.valid_till as valid_until,
        c.lifetime_validity,
        c.for_all_user,
        c.for_all_vip_user,
        c.for_specific_user,
        c.for_all_store,
        c.for_all_premium_store,
        c.for_specific_store,
        c.for_new_user,
        c.new_user_name,
        c.new_user_mobile_no,
        c.store_id,
        c.user_id,
        c.is_active,
        c.created_at,
        c.updated_at,
        c.updated_by,
        s.name as store_name,
        CASE 
          WHEN c.for_all_store = 1 THEN 'All Stores'
          WHEN c.for_all_premium_store = 1 THEN 'Premium Stores'
          WHEN c.for_specific_store = 1 AND s.name IS NOT NULL THEN s.name
          ELSE 'All Stores'
        END as applicable_store
      FROM coupon_master c
      LEFT JOIN stores s ON c.store_id = s.id
      WHERE 1=1
    `;
    
    const params = [];
    
    // Add search functionality
    if (search && search.trim()) {
      query += ` AND (c.coupon_name LIKE ? OR c.description LIKE ? OR s.name LIKE ?)`;
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    // Add status filter
    if (status !== undefined && status !== '') {
      const now = new Date().toISOString();
      switch (status.toLowerCase()) {
        case 'active':
          query += ` AND c.is_active = 1 AND (c.lifetime_validity = 1 OR c.valid_till >= ?)`;
          params.push(now);
          break;
        case 'expired':
          query += ` AND c.lifetime_validity = 0 AND c.valid_till < ?`;
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
        query += ` AND c.for_all_store = 1`;
      } else {
        query += ` AND (c.store_id = ? OR c.for_all_store = 1)`;
        params.push(parseInt(store_id));
      }
    }
    
    // Add ordering and pagination
    query += ` ORDER BY c.created_at DESC LIMIT ${limitInt} OFFSET ${offsetInt}`;

    console.log('Final query:', query);
    console.log('Parameters:', params);
    
    // Execute the main query
    const [coupons] = await pool.execute(query, params);
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(DISTINCT c.coupon_id) as total 
      FROM coupon_master c 
      LEFT JOIN stores s ON c.store_id = s.id
      WHERE 1=1
    `;
    const countParams = [];
    
    if (search && search.trim()) {
      countQuery += ` AND (c.coupon_name LIKE ? OR c.description LIKE ? OR s.name LIKE ?)`;
      const searchTerm = `%${search.trim()}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (status !== undefined && status !== '') {
      const now = new Date().toISOString();
      switch (status.toLowerCase()) {
        case 'active':
          countQuery += ` AND c.is_active = 1 AND (c.lifetime_validity = 1 OR c.valid_till >= ?)`;
          countParams.push(now);
          break;
        case 'expired':
          countQuery += ` AND c.lifetime_validity = 0 AND c.valid_till < ?`;
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
        countQuery += ` AND c.for_all_store = 1`;
      } else {
        countQuery += ` AND (c.store_id = ? OR c.for_all_store = 1)`;
        countParams.push(parseInt(store_id));
      }
    }
    
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    // Get stats for dashboard
    const [statsResult] = await pool.execute(`
      SELECT 
        COUNT(DISTINCT c.coupon_id) as totalCoupons,
        COUNT(DISTINCT CASE WHEN c.is_active = 1 AND (c.lifetime_validity = 1 OR c.valid_till >= NOW()) THEN c.coupon_id END) as activeCoupons
      FROM coupon_master c
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
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coupons',
      error: error.message
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
    
    // Get coupon details with store information
    const [coupons] = await pool.execute(`
      SELECT 
        c.coupon_id as id,
        c.coupon_id,
        c.coupon_name,
        c.description,
        c.discount_type,
        c.discount_value,
        c.valid_from,
        c.valid_till as valid_until,
        c.lifetime_validity,
        c.for_all_user,
        c.for_all_vip_user,
        c.for_specific_user,
        c.for_all_store,
        c.for_all_premium_store,
        c.for_specific_store,
        c.for_new_user,
        c.new_user_name,
        c.new_user_mobile_no,
        c.store_id,
        c.user_id,
        c.is_active,
        c.created_at,
        c.updated_at,
        c.updated_by,
        s.name as store_name,
        u.first_name as updated_by_name
      FROM coupon_master c
      LEFT JOIN stores s ON c.store_id = s.id
      LEFT JOIN users u ON c.updated_by = u.id
      WHERE c.coupon_id = ?
    `, [couponId]);
    
    if (coupons.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }
    
    const coupon = coupons[0];
    
    console.log(`✅ Coupon ${couponId} details fetched successfully`);
    
    res.json({
      success: true,
      data: {
        coupon,
        usages: [], // No usage tracking in coupon_master
        users: []   // No user tracking in coupon_master
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
      coupon_name,
      description,
      discount_type,
      discount_value,
      valid_from,
      valid_till,
      lifetime_validity = 0,
      for_all_user = 1,
      for_all_vip_user = 0,
      for_specific_user = 0,
      for_all_store = 1,
      for_all_premium_store = 0,
      for_specific_store = 0,
      for_new_user = 0,
      new_user_name,
      new_user_mobile_no,
      store_id,
      user_id,
      is_active = 1,
      updated_by
    } = req.body;

    // Validate required fields
    if (!coupon_name || !discount_type || !discount_value) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: coupon_name, discount_type, discount_value'
      });
    }

    // Validate discount type
    if (!['percentage', 'fixed'].includes(discount_type)) {
      return res.status(400).json({
        success: false,
        message: 'discount_type must be either "percentage" or "fixed"'
      });
    }

    // Validate dates if not lifetime validity
    if (!lifetime_validity && (!valid_from || !valid_till)) {
      return res.status(400).json({
        success: false,
        message: 'valid_from and valid_till are required when lifetime_validity is false'
      });
    }

    if (!lifetime_validity && valid_from && valid_till) {
      const fromDate = new Date(valid_from);
      const tillDate = new Date(valid_till);
      
      if (tillDate <= fromDate) {
        return res.status(400).json({
          success: false,
          message: 'valid_till must be after valid_from'
        });
      }
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
        INSERT INTO coupon_master (
          coupon_name, 
          description, 
          discount_type,
          discount_value,
          valid_from,
          valid_till,
          lifetime_validity,
          for_all_user,
          for_all_vip_user,
          for_specific_user,
          for_all_store,
          for_all_premium_store,
          for_specific_store,
          for_new_user,
          new_user_name,
          new_user_mobile_no,
          store_id,
          user_id,
          is_active,
          created_at, 
          updated_at,
          updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?)
      `, [
        coupon_name,
        description || null,
        discount_type,
        discount_value,
        valid_from || null,
        valid_till || null,
        lifetime_validity,
        for_all_user,
        for_all_vip_user,
        for_specific_user,
        for_all_store,
        for_all_premium_store,
        for_specific_store,
        for_new_user,
        new_user_name || null,
        new_user_mobile_no || null,
        store_id || null,
        user_id || null,
        is_active,
        updated_by || null
      ]);

      const couponId = result.insertId;
      console.log(`✅ Coupon created with ID: ${couponId}`);

      // Fetch the complete created coupon data
      const [createdCoupons] = await pool.execute(`
        SELECT 
          c.coupon_id as id,
          c.*,
          s.name as store_name
        FROM coupon_master c
        LEFT JOIN stores s ON c.store_id = s.id
        WHERE c.coupon_id = ?
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
      'SELECT coupon_id FROM coupon_master WHERE coupon_id = ?',
      [couponId]
    );
    
    if (existingCoupons.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    // Validate discount type if provided
    if (updateData.discount_type && !['percentage', 'fixed'].includes(updateData.discount_type)) {
      return res.status(400).json({
        success: false,
        message: 'discount_type must be either "percentage" or "fixed"'
      });
    }

    // Validate dates if provided
    if (updateData.valid_from && updateData.valid_till && !updateData.lifetime_validity) {
      const fromDate = new Date(updateData.valid_from);
      const tillDate = new Date(updateData.valid_till);
      
      if (tillDate <= fromDate) {
        return res.status(400).json({
          success: false,
          message: 'valid_till must be after valid_from'
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
        'coupon_name', 'description', 'discount_type', 'discount_value',
        'valid_from', 'valid_till', 'lifetime_validity', 'for_all_user',
        'for_all_vip_user', 'for_specific_user', 'for_all_store',
        'for_all_premium_store', 'for_specific_store', 'for_new_user',
        'new_user_name', 'new_user_mobile_no', 'store_id', 'user_id',
        'is_active', 'updated_by'
      ];

      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          updateFields.push(`${field} = ?`);
          let value = updateData[field];
          
          if (field === 'store_id' && value === '') {
            value = null;
          } else if ((field === 'valid_from' || field === 'valid_till') && value) {
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
        `UPDATE coupon_master SET ${updateFields.join(', ')}, updated_at = NOW() WHERE coupon_id = ?`,
        updateParams
      );

      // Fetch updated coupon
      const [updatedCoupons] = await pool.execute(`
        SELECT 
          c.coupon_id as id,
          c.*,
          s.name as store_name
        FROM coupon_master c
        LEFT JOIN stores s ON c.store_id = s.id
        WHERE c.coupon_id = ?
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
      'SELECT coupon_id FROM coupon_master WHERE coupon_id = ?',
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
      'UPDATE coupon_master SET is_active = ?, updated_at = NOW() WHERE coupon_id = ?',
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
      'SELECT coupon_id FROM coupon_master WHERE coupon_id = ?',
      [couponId]
    );
    
    if (existingCoupons.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    // Delete the coupon
    const [result] = await pool.execute(
      'DELETE FROM coupon_master WHERE coupon_id = ?',
      [couponId]
    );

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
    console.error('❌ Error deleting coupon:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete coupon',
      error: error.message
    });
  }
});

// Helper functions
function formatDateForMySQL(dateString) {
  const date = new Date(dateString);
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

module.exports = router;