// routes/rewards.js - Complete Rewards Management API
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// GET /api/rewards - Get all rewards with usage statistics
router.get('/', async (req, res) => {
  try {
    console.log('📥 GET /api/rewards - Fetching all rewards');
    console.log('Query params:', req.query);
    
    const { 
      search, 
      limit = 10, 
      offset = 0,
      status,
      reward_type
    } = req.query;
    
    // Convert parameters to proper types
    const limitInt = Math.max(1, Math.min(100, parseInt(limit) || 10));
    const offsetInt = Math.max(0, parseInt(offset) || 0);
    
    console.log('Parsed params:', { limitInt, offsetInt, search, status, reward_type });
    
    // Base query with usage statistics from reward_history
    let query = `
      SELECT 
        r.reward_id as id,
        r.reward_name,
        r.reward_type,
        r.normal_users_reward_value,
        r.vip_users_reward_value,
        r.is_active,
        r.created_at,
        r.updated_at,
        COUNT(DISTINCT rh.id) as total_awarded,
        COALESCE(SUM(CASE WHEN rh.credit_debit = 'credit' THEN rh.amount END), 0) as total_credits,
        COALESCE(SUM(CASE WHEN rh.credit_debit = 'debit' THEN rh.amount END), 0) as total_debits
      FROM reward_types r
      LEFT JOIN reward_history rh ON r.reward_type = rh.reward_type
      WHERE 1=1
    `;
    
    const params = [];
    
    // Add search functionality
    if (search && search.trim()) {
      query += ` AND (r.reward_name LIKE ? OR r.reward_type LIKE ?)`;
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm);
    }
    
    // Add status filter
    if (status !== undefined && status !== '') {
      switch (status.toLowerCase()) {
        case 'active':
          query += ` AND r.is_active = 1`;
          break;
        case 'inactive':
          query += ` AND r.is_active = 0`;
          break;
      }
    }
    
    // Add reward type filter
    if (reward_type !== undefined && reward_type !== '') {
      query += ` AND r.reward_type = ?`;
      params.push(reward_type);
    }
    
    // Add GROUP BY clause
    query += ` 
      GROUP BY 
        r.reward_id, r.reward_name, r.reward_type, r.normal_users_reward_value,
        r.vip_users_reward_value, r.is_active, r.created_at, r.updated_at
    `;
    
    // Add ordering and pagination
    query += ` ORDER BY r.created_at DESC LIMIT ${limitInt} OFFSET ${offsetInt}`;

    console.log('Final query:', query);
    console.log('Parameters:', params);
    
    // Execute the main query
    const [rewards] = await pool.execute(query, params);
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(DISTINCT r.reward_id) as total 
      FROM reward_types r 
      WHERE 1=1
    `;
    const countParams = [];
    
    if (search && search.trim()) {
      countQuery += ` AND (r.reward_name LIKE ? OR r.reward_type LIKE ?)`;
      const searchTerm = `%${search.trim()}%`;
      countParams.push(searchTerm, searchTerm);
    }
    
    if (status !== undefined && status !== '') {
      switch (status.toLowerCase()) {
        case 'active':
          countQuery += ` AND r.is_active = 1`;
          break;
        case 'inactive':
          countQuery += ` AND r.is_active = 0`;
          break;
      }
    }
    
    if (reward_type !== undefined && reward_type !== '') {
      countQuery += ` AND r.reward_type = ?`;
      countParams.push(reward_type);
    }
    
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    // Get stats for dashboard
    const [statsResult] = await pool.execute(`
      SELECT 
        COUNT(DISTINCT r.reward_id) as totalRewards,
        COUNT(DISTINCT CASE WHEN r.is_active = 1 THEN r.reward_id END) as activeRewards,
        COUNT(DISTINCT rh.id) as totalAwarded,
        COALESCE(SUM(CASE WHEN rh.credit_debit = 'credit' THEN rh.amount END), 0) as totalCredits
      FROM reward_types r
      LEFT JOIN reward_history rh ON r.reward_type = rh.reward_type
    `);
    
    console.log(`✅ Found ${rewards.length} rewards out of ${total} total`);
    
    res.json({
      success: true,
      data: {
        rewards: rewards,
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
    console.error('❌ Error fetching rewards:', error);
    console.error('SQL Error Details:', {
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      sql: error.sql
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rewards',
      error: error.message,
      debug: {
        code: error.code,
        errno: error.errno,
        sqlMessage: error.sqlMessage
      }
    });
  }
});

// GET /api/rewards/:id - Get reward by ID with complete details
router.get('/:id', async (req, res) => {
  try {
    console.log(`📥 GET /api/rewards/${req.params.id} - Fetching reward details`);
    
    const rewardId = parseInt(req.params.id);
    
    if (isNaN(rewardId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reward ID'
      });
    }
    
    // Get reward details with usage statistics
    const [rewards] = await pool.execute(`
      SELECT 
        r.reward_id as id,
        r.reward_name,
        r.reward_type,
        r.normal_users_reward_value,
        r.vip_users_reward_value,
        r.is_active,
        r.created_at,
        r.updated_at,
        COUNT(DISTINCT rh.id) as total_awarded,
        COALESCE(SUM(CASE WHEN rh.credit_debit = 'credit' THEN rh.amount END), 0) as total_credits,
        COALESCE(SUM(CASE WHEN rh.credit_debit = 'debit' THEN rh.amount END), 0) as total_debits
      FROM reward_types r
      LEFT JOIN reward_history rh ON r.reward_type = rh.reward_type
      WHERE r.reward_id = ?
      GROUP BY 
        r.reward_id, r.reward_name, r.reward_type, r.normal_users_reward_value,
        r.vip_users_reward_value, r.is_active, r.created_at, r.updated_at
    `, [rewardId]);
    
    if (rewards.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reward not found'
      });
    }
    
    const reward = rewards[0];
    
    // Get recent reward history for this reward type
    const [recentHistory] = await pool.execute(`
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
        u.first_name,
        u.last_name,
        u.email,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        t.transaction_number,
        s.name as store_name
      FROM reward_history rh
      LEFT JOIN users u ON rh.user_id = u.id
      LEFT JOIN transactions t ON rh.transaction_id = t.id
      LEFT JOIN stores s ON rh.store_id = s.id
      WHERE rh.reward_type = ?
      ORDER BY rh.created_at DESC
      LIMIT 50
    `, [reward.reward_type]);
    
    console.log(`✅ Reward ${rewardId} details fetched successfully`);
    console.log(`📊 Found ${recentHistory.length} recent history entries`);
    
    res.json({
      success: true,
      data: {
        reward,
        recentHistory
      }
    });
  } catch (error) {
    console.error('❌ Error fetching reward details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reward details',
      error: error.message
    });
  }
});

// POST /api/rewards - Create new reward
router.post('/', async (req, res) => {
  try {
    console.log('📝 POST /api/rewards - Creating new reward');
    console.log('Request data:', req.body);
    
    const {
      reward_name,
      reward_type,
      normal_users_reward_value,
      vip_users_reward_value,
      is_active = 1
    } = req.body;

    // Validate required fields
    if (!reward_name || !reward_type || normal_users_reward_value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: reward_name, reward_type, normal_users_reward_value'
      });
    }

    // Validate reward values
    if (normal_users_reward_value < 0 || (vip_users_reward_value !== undefined && vip_users_reward_value < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Reward values cannot be negative'
      });
    }

    // Check if reward with same name already exists
    const [existingRewards] = await pool.execute(
      'SELECT reward_id, reward_name FROM reward_types WHERE reward_name = ?',
      [reward_name.trim()]
    );

    if (existingRewards.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Reward with this name already exists'
      });
    }

    try {
      // Insert new reward
      const [result] = await pool.execute(`
        INSERT INTO reward_types (
          reward_name, 
          reward_type, 
          normal_users_reward_value,
          vip_users_reward_value,
          is_active,
          created_at, 
          updated_at
        ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        reward_name.trim(),
        reward_type.trim(),
        parseFloat(normal_users_reward_value),
        vip_users_reward_value ? parseFloat(vip_users_reward_value) : null,
        is_active
      ]);

      const rewardId = result.insertId;
      console.log(`✅ Reward created with ID: ${rewardId}`);

      // Fetch the complete created reward data
      const [createdRewards] = await pool.execute(`
        SELECT 
          r.reward_id as id,
          r.reward_name,
          r.reward_type,
          r.normal_users_reward_value,
          r.vip_users_reward_value,
          r.is_active,
          r.created_at,
          r.updated_at
        FROM reward_types r
        WHERE r.reward_id = ?
      `, [rewardId]);

      console.log(`✅ Reward ${rewardId} created successfully`);

      res.status(201).json({
        success: true,
        message: 'Reward created successfully',
        data: {
          reward: createdRewards[0]
        }
      });

    } catch (error) {
      console.error('❌ Error creating reward:', error);
      
      // Handle specific database errors
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          message: 'Reward name already exists'
        });
      }

      throw error;
    }

  } catch (error) {
    console.error('❌ Error creating reward:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create reward',
      error: error.message
    });
  }
});

// PUT /api/rewards/:id - Update reward
router.put('/:id', async (req, res) => {
  try {
    console.log(`📝 PUT /api/rewards/${req.params.id} - Updating reward`);
    console.log('Update data:', req.body);
    
    const rewardId = parseInt(req.params.id);
    const updateData = req.body;
    
    if (isNaN(rewardId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reward ID'
      });
    }
    
    // Check if reward exists
    const [existingRewards] = await pool.execute(
      'SELECT reward_id FROM reward_types WHERE reward_id = ?',
      [rewardId]
    );
    
    if (existingRewards.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reward not found'
      });
    }

    // Validate reward values if provided
    if (updateData.normal_users_reward_value !== undefined && updateData.normal_users_reward_value < 0) {
      return res.status(400).json({
        success: false,
        message: 'Normal users reward value cannot be negative'
      });
    }

    if (updateData.vip_users_reward_value !== undefined && updateData.vip_users_reward_value < 0) {
      return res.status(400).json({
        success: false,
        message: 'VIP users reward value cannot be negative'
      });
    }

    // Check for duplicate reward name if name is being updated
    if (updateData.reward_name) {
      const [duplicateRewards] = await pool.execute(
        'SELECT reward_id FROM reward_types WHERE reward_name = ? AND reward_id != ?',
        [updateData.reward_name.trim(), rewardId]
      );
      
      if (duplicateRewards.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Reward name already exists'
        });
      }
    }

    try {
      // Build update query dynamically
      const updateFields = [];
      const updateParams = [];

      const allowedFields = [
        'reward_name', 'reward_type', 'normal_users_reward_value', 
        'vip_users_reward_value', 'is_active'
      ];

      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          updateFields.push(`${field} = ?`);
          let value = updateData[field];
          
          // Special handling for specific fields
          if (field === 'reward_name' || field === 'reward_type') {
            value = value.trim();
          } else if (field === 'normal_users_reward_value' || field === 'vip_users_reward_value') {
            value = value === '' ? null : parseFloat(value);
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

      updateParams.push(rewardId);

      await pool.execute(
        `UPDATE reward_types SET ${updateFields.join(', ')}, updated_at = NOW() WHERE reward_id = ?`,
        updateParams
      );

      // Fetch updated reward
      const [updatedRewards] = await pool.execute(`
        SELECT 
          r.reward_id as id,
          r.reward_name,
          r.reward_type,
          r.normal_users_reward_value,
          r.vip_users_reward_value,
          r.is_active,
          r.created_at,
          r.updated_at
        FROM reward_types r
        WHERE r.reward_id = ?
      `, [rewardId]);

      console.log(`✅ Reward ${rewardId} updated successfully`);

      res.json({
        success: true,
        message: 'Reward updated successfully',
        data: {
          reward: updatedRewards[0]
        }
      });

    } catch (error) {
      console.error('❌ Error updating reward:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          message: 'Reward name already exists'
        });
      }

      throw error;
    }

  } catch (error) {
    console.error('❌ Error updating reward:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update reward',
      error: error.message
    });
  }
});

// PATCH /api/rewards/:id - Update reward status
router.patch('/:id', async (req, res) => {
  try {
    console.log(`🔄 PATCH /api/rewards/${req.params.id} - Updating reward status`);
    console.log('Request body:', req.body);
    
    const rewardId = parseInt(req.params.id);
    const { is_active } = req.body;
    
    if (isNaN(rewardId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reward ID'
      });
    }
    
    // Check if reward exists
    const [existingRewards] = await pool.execute(
      'SELECT reward_id FROM reward_types WHERE reward_id = ?',
      [rewardId]
    );
    
    if (existingRewards.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reward not found'
      });
    }

    // Update reward status
    const [result] = await pool.execute(
      'UPDATE reward_types SET is_active = ?, updated_at = NOW() WHERE reward_id = ?',
      [is_active, rewardId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reward not found'
      });
    }

    console.log(`✅ Reward ${rewardId} status updated successfully (is_active: ${is_active})`);

    res.json({
      success: true,
      message: is_active === 0 ? 'Reward deactivated successfully' : 'Reward activated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating reward status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update reward status',
      error: error.message
    });
  }
});

// DELETE /api/rewards/:id - Delete reward (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    console.log(`🗑️ DELETE /api/rewards/${req.params.id} - Deleting reward`);
    
    const rewardId = parseInt(req.params.id);
    
    if (isNaN(rewardId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reward ID'
      });
    }
    
    // Check if reward exists
    const [existingRewards] = await pool.execute(
      'SELECT reward_id, reward_type FROM reward_types WHERE reward_id = ?',
      [rewardId]
    );
    
    if (existingRewards.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reward not found'
      });
    }

    // Check if reward has been used in reward_history
    const [usageCheck] = await pool.execute(
      'SELECT COUNT(*) as usage_count FROM reward_history WHERE reward_type = ?',
      [existingRewards[0].reward_type]
    );

    if (usageCheck[0].usage_count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete reward that has been used. Consider deactivating instead.'
      });
    }

    // Soft delete by setting is_active = 0
    const [result] = await pool.execute(
      'UPDATE reward_types SET is_active = 0, updated_at = NOW() WHERE reward_id = ?',
      [rewardId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reward not found'
      });
    }

    console.log(`✅ Reward ${rewardId} deactivated successfully`);

    res.json({
      success: true,
      message: 'Reward deactivated successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting reward:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete reward',
      error: error.message
    });
  }
});

// Helper functions
function isValidDate(dateString) {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

module.exports = router;