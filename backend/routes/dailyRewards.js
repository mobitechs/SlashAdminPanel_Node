// routes/dailyRewards.js - UPDATED with proper ENUM handling and missing routes
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Test endpoint
router.get('/test', (req, res) => {
  console.log('🧪 Daily Rewards Test endpoint hit');
  res.json({ 
    success: true, 
    message: 'Daily Rewards API is working',
    timestamp: new Date().toISOString()
  });
});

// ================================
// DAILY REWARD CAMPAIGNS ROUTES
// ================================

// GET /api/daily-rewards/campaigns - Get all campaigns
router.get('/campaigns', async (req, res) => {
  try {
    console.log('📥 GET /api/daily-rewards/campaigns - Fetching all campaigns');
    console.log('Query params:', req.query);
    
    const { 
      search, 
      limit = 50, 
      offset = 0,
      is_active,
      campaign_type
    } = req.query;
    
    const limitInt = Math.max(1, Math.min(100, parseInt(limit) || 50));
    const offsetInt = Math.max(0, parseInt(offset) || 0);
    
    // Base query
    let query = `
      SELECT 
        drc.*,
        (SELECT COUNT(*) FROM spin_wheel_rewards swr WHERE swr.campaign_id = drc.id) as reward_count,
        COALESCE((SELECT COUNT(*) FROM user_daily_spins uds WHERE uds.campaign_id = drc.id), 0) as total_spins
      FROM daily_reward_campaigns drc
      WHERE 1=1
    `;
    
    const params = [];
    
    // Add search functionality
    if (search && search.trim()) {
      query += ` AND (drc.title LIKE ? OR drc.description LIKE ? OR drc.campaign_type LIKE ?)`;
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    // Add active filter
    if (is_active !== undefined && is_active !== '') {
      query += ` AND drc.is_active = ?`;
      params.push(parseInt(is_active));
    }
    
    // Add campaign type filter
    if (campaign_type && campaign_type !== '') {
      query += ` AND drc.campaign_type = ?`;
      params.push(campaign_type);
    }
    
    // Add ordering and pagination
    query += ` ORDER BY drc.created_at DESC LIMIT ${limitInt} OFFSET ${offsetInt}`;
    
    console.log('📝 Final query:', query);
    console.log('📝 Parameters:', params);
    
    // Execute the main query
    const [campaigns] = await pool.execute(query, params);
    console.log(`✅ Query executed successfully. Found ${campaigns.length} campaigns`);
    
    // Get total count for filtered results
    let countQuery = `SELECT COUNT(*) as total FROM daily_reward_campaigns drc WHERE 1=1`;
    const countParams = [];
    
    if (search && search.trim()) {
      countQuery += ` AND (drc.title LIKE ? OR drc.description LIKE ? OR drc.campaign_type LIKE ?)`;
      const searchTerm = `%${search.trim()}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (is_active !== undefined && is_active !== '') {
      countQuery += ` AND drc.is_active = ?`;
      countParams.push(parseInt(is_active));
    }
    
    if (campaign_type && campaign_type !== '') {
      countQuery += ` AND drc.campaign_type = ?`;
      countParams.push(campaign_type);
    }
    
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    // Get stats
    const [statsResult] = await pool.execute(`
      SELECT 
        COUNT(*) as totalCampaigns,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as activeCampaigns,
        COUNT(CASE WHEN campaign_type = 'daily' THEN 1 END) as dailyCampaigns,
        COUNT(CASE WHEN campaign_type = 'weekly' THEN 1 END) as weeklyCampaigns,
        COUNT(CASE WHEN campaign_type = 'spin_wheel' THEN 1 END) as spinWheelCampaigns
      FROM daily_reward_campaigns
    `);
    
    console.log(`✅ Found ${campaigns.length} campaigns out of ${total} total`);
    
    res.json({
      success: true,
      data: {
        campaigns: campaigns,
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
    console.error('❌ Error fetching campaigns:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch campaigns',
      error: error.message
    });
  }
});

// GET /api/daily-rewards/campaigns/:id - Get campaign by ID
router.get('/campaigns/:id', async (req, res) => {
  try {
    console.log(`📥 GET /api/daily-rewards/campaigns/${req.params.id}`);
    
    const campaignId = parseInt(req.params.id);
    
    if (isNaN(campaignId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid campaign ID'
      });
    }
    
    // Get campaign details
    const [campaigns] = await pool.execute(`
      SELECT 
        drc.*,
        COALESCE((SELECT COUNT(*) FROM spin_wheel_rewards swr WHERE swr.campaign_id = drc.id), 0) as reward_count,
        COALESCE((SELECT COUNT(*) FROM user_daily_spins uds WHERE uds.campaign_id = drc.id), 0) as total_spins,
        COALESCE((SELECT COUNT(DISTINCT uds.user_id) FROM user_daily_spins uds WHERE uds.campaign_id = drc.id), 0) as unique_users
      FROM daily_reward_campaigns drc
      WHERE drc.id = ?
    `, [campaignId]);
    
    if (campaigns.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }
    
    const campaign = campaigns[0];
    
    // Get spin wheel rewards for this campaign
    const [rewards] = await pool.execute(`
      SELECT 
        swr.*,
        c.code as coupon_code,
        c.title as coupon_title
      FROM spin_wheel_rewards swr
      LEFT JOIN coupons c ON swr.coupon_id = c.id
      WHERE swr.campaign_id = ?
      ORDER BY swr.probability_weight DESC, swr.created_at ASC
    `, [campaignId]);
    
    console.log(`✅ Campaign ${campaignId} details fetched successfully`);
    
    res.json({
      success: true,
      data: {
        campaign,
        rewards
      }
    });
  } catch (error) {
    console.error('❌ Error fetching campaign details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch campaign details',
      error: error.message
    });
  }
});

// POST /api/daily-rewards/campaigns - Create new campaign
router.post('/campaigns', async (req, res) => {
  try {
    console.log('📝 POST /api/daily-rewards/campaigns - Creating new campaign');
    console.log('Request data:', req.body);
    
    const {
      campaign_type,
      title,
      description,
      start_date,
      end_date,
      repeat_interval,
      custom_interval_days,
      max_attempts_per_interval,
      is_active = 1
    } = req.body;

    // Validate required fields
    if (!campaign_type || !title || !repeat_interval || !max_attempts_per_interval) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: campaign_type, title, repeat_interval, max_attempts_per_interval'
      });
    }

    // FIXED: Map frontend values to database ENUM values
    let dbCampaignType = campaign_type;
    
    // If frontend sends 'daily', 'weekly', 'monthly', but DB expects 'spin_wheel', map accordingly
    const campaignTypeMapping = {
      'daily': 'spin_wheel',  // or keep as 'daily' if your DB has this
      'weekly': 'spin_wheel', // or keep as 'weekly' if your DB has this
      'monthly': 'spin_wheel', // or keep as 'monthly' if your DB has this
      'custom': 'spin_wheel',  // or keep as 'custom' if your DB has this
      'spin_wheel': 'spin_wheel'
    };
    
    // Check what campaign types are actually allowed in the database
    const [enumCheck] = await pool.execute(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'daily_reward_campaigns' 
      AND COLUMN_NAME = 'campaign_type'
    `);
    
    console.log('📊 Database campaign_type column info:', enumCheck[0]?.COLUMN_TYPE);
    
    // If it's an ENUM, use the mapping, otherwise use the original value
    if (enumCheck[0]?.COLUMN_TYPE?.includes('enum')) {
      dbCampaignType = campaignTypeMapping[campaign_type] || 'spin_wheel';
    }
    
    console.log(`🔄 Mapping campaign_type: ${campaign_type} -> ${dbCampaignType}`);

    // Insert new campaign
    const [result] = await pool.execute(`
      INSERT INTO daily_reward_campaigns (
        campaign_type,
        title,
        description,
        start_date,
        end_date,
        repeat_interval,
        custom_interval_days,
        is_active,
        max_attempts_per_interval,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      dbCampaignType,  // Use mapped value
      title,
      description || null,
      start_date || null,
      end_date || null,
      repeat_interval,
      custom_interval_days || null,
      is_active,
      max_attempts_per_interval
    ]);

    const campaignId = result.insertId;
    console.log(`✅ Campaign created with ID: ${campaignId}`);

    // Fetch the complete created campaign data
    const [createdCampaigns] = await pool.execute(`
      SELECT * FROM daily_reward_campaigns WHERE id = ?
    `, [campaignId]);

    res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      data: {
        campaign: createdCampaigns[0]
      }
    });

  } catch (error) {
    console.error('❌ Error creating campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create campaign',
      error: error.message
    });
  }
});

// PUT /api/daily-rewards/campaigns/:id - Update campaign
router.put('/campaigns/:id', async (req, res) => {
  try {
    console.log(`📝 PUT /api/daily-rewards/campaigns/${req.params.id}`);
    
    const campaignId = parseInt(req.params.id);
    const updateData = req.body;
    
    if (isNaN(campaignId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid campaign ID'
      });
    }
    
    // Check if campaign exists
    const [existingCampaigns] = await pool.execute(
      'SELECT id FROM daily_reward_campaigns WHERE id = ?',
      [campaignId]
    );
    
    if (existingCampaigns.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Handle campaign_type mapping for updates too
    if (updateData.campaign_type) {
      const campaignTypeMapping = {
        'daily': 'spin_wheel',
        'weekly': 'spin_wheel',
        'monthly': 'spin_wheel',
        'custom': 'spin_wheel',
        'spin_wheel': 'spin_wheel'
      };
      updateData.campaign_type = campaignTypeMapping[updateData.campaign_type] || 'spin_wheel';
    }

    // Build update query dynamically
    const updateFields = [
      'campaign_type', 'title', 'description', 'start_date', 'end_date',
      'repeat_interval', 'custom_interval_days', 'is_active', 'max_attempts_per_interval'
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

    params.push(campaignId);
    
    await pool.execute(
      `UPDATE daily_reward_campaigns SET ${setClause.join(', ')}, updated_at = NOW() WHERE id = ?`,
      params
    );
    
    // Fetch updated campaign
    const [updatedCampaigns] = await pool.execute(`
      SELECT * FROM daily_reward_campaigns WHERE id = ?
    `, [campaignId]);

    console.log(`✅ Campaign ${campaignId} updated successfully`);

    res.json({
      success: true,
      message: 'Campaign updated successfully',
      data: updatedCampaigns[0]
    });
  } catch (error) {
    console.error('❌ Error updating campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update campaign',
      error: error.message
    });
  }
});

// DELETE /api/daily-rewards/campaigns/:id - Delete campaign
router.delete('/campaigns/:id', async (req, res) => {
  try {
    console.log(`🗑️ DELETE /api/daily-rewards/campaigns/${req.params.id}`);
    
    const campaignId = parseInt(req.params.id);
    
    if (isNaN(campaignId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid campaign ID'
      });
    }
    
    // Check if campaign exists
    const [existingCampaigns] = await pool.execute(
      'SELECT id FROM daily_reward_campaigns WHERE id = ?',
      [campaignId]
    );
    
    if (existingCampaigns.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Check if campaign has associated rewards
    const [rewards] = await pool.execute(
      'SELECT COUNT(*) as count FROM spin_wheel_rewards WHERE campaign_id = ?',
      [campaignId]
    );

    if (rewards[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete campaign that has spin wheel rewards. Delete rewards first.'
      });
    }

    // Delete the campaign
    const [result] = await pool.execute(
      'DELETE FROM daily_reward_campaigns WHERE id = ?',
      [campaignId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    console.log(`✅ Campaign ${campaignId} deleted successfully`);

    res.json({
      success: true,
      message: 'Campaign deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete campaign',
      error: error.message
    });
  }
});

// ================================
// SPIN WHEEL REWARDS ROUTES - ADDED MISSING ROUTES
// ================================

// GET /api/daily-rewards/rewards - Get all spin wheel rewards
router.get('/rewards', async (req, res) => {
  try {
    console.log('📥 GET /api/daily-rewards/rewards - Fetching all spin wheel rewards');
    
    const { 
      campaign_id,
      reward_type,
      is_active,
      limit = 20,
      offset = 0
    } = req.query;
    
    const limitInt = Math.max(1, Math.min(100, parseInt(limit) || 20));
    const offsetInt = Math.max(0, parseInt(offset) || 0);
    
    let query = `
      SELECT 
        swr.*,
        drc.title as campaign_title,
        drc.campaign_type,
        c.code as coupon_code,
        c.title as coupon_title
      FROM spin_wheel_rewards swr
      LEFT JOIN daily_reward_campaigns drc ON swr.campaign_id = drc.id
      LEFT JOIN coupons c ON swr.coupon_id = c.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (campaign_id && campaign_id !== '') {
      query += ` AND swr.campaign_id = ?`;
      params.push(parseInt(campaign_id));
    }
    
    if (reward_type && reward_type !== '') {
      query += ` AND swr.reward_type = ?`;
      params.push(reward_type);
    }
    
    if (is_active !== undefined && is_active !== '') {
      query += ` AND swr.is_active = ?`;
      params.push(parseInt(is_active));
    }
    
    query += ` ORDER BY swr.campaign_id, swr.probability_weight DESC LIMIT ${limitInt} OFFSET ${offsetInt}`;
    
    const [rewards] = await pool.execute(query, params);
    
    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM spin_wheel_rewards swr WHERE 1=1`;
    const countParams = [];
    
    if (campaign_id && campaign_id !== '') {
      countQuery += ` AND swr.campaign_id = ?`;
      countParams.push(parseInt(campaign_id));
    }
    
    if (reward_type && reward_type !== '') {
      countQuery += ` AND swr.reward_type = ?`;
      countParams.push(reward_type);
    }
    
    if (is_active !== undefined && is_active !== '') {
      countQuery += ` AND swr.is_active = ?`;
      countParams.push(parseInt(is_active));
    }
    
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    console.log(`✅ Found ${rewards.length} spin wheel rewards out of ${total} total`);
    
    res.json({
      success: true,
      data: {
        rewards: rewards,
        pagination: {
          total: total,
          totalPages: Math.ceil(total / limitInt),
          currentPage: Math.floor(offsetInt / limitInt) + 1,
          itemsPerPage: limitInt
        }
      }
    });
  } catch (error) {
    console.error('❌ Error fetching spin wheel rewards:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch spin wheel rewards',
      error: error.message
    });
  }
});

// GET /api/daily-rewards/rewards/:id - Get reward by ID
router.get('/rewards/:id', async (req, res) => {
  try {
    console.log(`📥 GET /api/daily-rewards/rewards/${req.params.id}`);
    
    const rewardId = parseInt(req.params.id);
    
    if (isNaN(rewardId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reward ID'
      });
    }
    
    const [rewards] = await pool.execute(`
      SELECT 
        swr.*,
        drc.title as campaign_title,
        drc.campaign_type,
        c.code as coupon_code,
        c.title as coupon_title
      FROM spin_wheel_rewards swr
      LEFT JOIN daily_reward_campaigns drc ON swr.campaign_id = drc.id
      LEFT JOIN coupons c ON swr.coupon_id = c.id
      WHERE swr.id = ?
    `, [rewardId]);
    
    if (rewards.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reward not found'
      });
    }
    
    console.log(`✅ Reward ${rewardId} details fetched successfully`);
    
    res.json({
      success: true,
      data: rewards[0]
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

// POST /api/daily-rewards/rewards - Create new spin wheel reward
router.post('/rewards', async (req, res) => {
  try {
    console.log('📝 POST /api/daily-rewards/rewards - Creating new spin wheel reward');
    console.log('Request data:', req.body);
    
    const {
      campaign_id,
      reward_type,
      reward_value,
      coupon_id,
      probability_weight,
      display_text,
      display_color,
      is_active = 1
    } = req.body;

    // Validate required fields
    if (!campaign_id || !reward_type || !probability_weight || !display_text) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: campaign_id, reward_type, probability_weight, display_text'
      });
    }

    // Check if campaign exists
    const [campaignExists] = await pool.execute(
      'SELECT id FROM daily_reward_campaigns WHERE id = ?',
      [campaign_id]
    );

    if (campaignExists.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid campaign ID'
      });
    }

    // Insert new spin wheel reward
    const [result] = await pool.execute(`
      INSERT INTO spin_wheel_rewards (
        campaign_id,
        reward_type,
        reward_value,
        coupon_id,
        probability_weight,
        display_text,
        display_color,
        is_active,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      campaign_id,
      reward_type,
      reward_value || null,
      coupon_id || null,
      probability_weight,
      display_text,
      display_color || '#3b82f6',
      is_active
    ]);

    const rewardId = result.insertId;
    console.log(`✅ Spin wheel reward created with ID: ${rewardId}`);

    // Fetch the complete created reward data
    const [createdRewards] = await pool.execute(`
      SELECT 
        swr.*,
        drc.title as campaign_title
      FROM spin_wheel_rewards swr
      LEFT JOIN daily_reward_campaigns drc ON swr.campaign_id = drc.id
      WHERE swr.id = ?
    `, [rewardId]);

    res.status(201).json({
      success: true,
      message: 'Spin wheel reward created successfully',
      data: {
        reward: createdRewards[0]
      }
    });

  } catch (error) {
    console.error('❌ Error creating spin wheel reward:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create spin wheel reward',
      error: error.message
    });
  }
});

// PUT /api/daily-rewards/rewards/:id - Update spin wheel reward
router.put('/rewards/:id', async (req, res) => {
  try {
    console.log(`📝 PUT /api/daily-rewards/rewards/${req.params.id}`);
    
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
      'SELECT id FROM spin_wheel_rewards WHERE id = ?',
      [rewardId]
    );
    
    if (existingRewards.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Spin wheel reward not found'
      });
    }

    // Build update query dynamically
    const updateFields = [
      'campaign_id', 'reward_type', 'reward_value', 'coupon_id',
      'probability_weight', 'display_text', 'display_color', 'is_active'
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

    params.push(rewardId);
    
    await pool.execute(
      `UPDATE spin_wheel_rewards SET ${setClause.join(', ')}, updated_at = NOW() WHERE id = ?`,
      params
    );
    
    // Fetch updated reward
    const [updatedRewards] = await pool.execute(`
      SELECT 
        swr.*,
        drc.title as campaign_title
      FROM spin_wheel_rewards swr
      LEFT JOIN daily_reward_campaigns drc ON swr.campaign_id = drc.id
      WHERE swr.id = ?
    `, [rewardId]);

    console.log(`✅ Spin wheel reward ${rewardId} updated successfully`);

    res.json({
      success: true,
      message: 'Spin wheel reward updated successfully',
      data: updatedRewards[0]
    });
  } catch (error) {
    console.error('❌ Error updating spin wheel reward:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update spin wheel reward',
      error: error.message
    });
  }
});

// DELETE /api/daily-rewards/rewards/:id - Delete spin wheel reward
router.delete('/rewards/:id', async (req, res) => {
  try {
    console.log(`🗑️ DELETE /api/daily-rewards/rewards/${req.params.id}`);
    
    const rewardId = parseInt(req.params.id);
    
    if (isNaN(rewardId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reward ID'
      });
    }
    
    // Check if reward exists
    const [existingRewards] = await pool.execute(
      'SELECT id FROM spin_wheel_rewards WHERE id = ?',
      [rewardId]
    );
    
    if (existingRewards.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Spin wheel reward not found'
      });
    }

    // Delete the reward
    const [result] = await pool.execute(
      'DELETE FROM spin_wheel_rewards WHERE id = ?',
      [rewardId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Spin wheel reward not found'
      });
    }

    console.log(`✅ Spin wheel reward ${rewardId} deleted successfully`);

    res.json({
      success: true,
      message: 'Spin wheel reward deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting spin wheel reward:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete spin wheel reward',
      error: error.message
    });
  }
});

// Add this route to your routes/transactions.js or routes/daily-rewards.js

// GET /api/transactions/search/coupons - Search coupons in coupon_master for daily rewards

// Alternative endpoint specifically for daily rewards if you want a separate route
// GET /api/daily-rewards/search/coupons
router.get('/daily-rewards/search/coupons', async (req, res) => {
  try {
    console.log('🔍 GET /api/daily-rewards/search/coupons - Daily rewards coupon search');
    
    const { q: searchQuery, limit = 20 } = req.query;
    
    if (!searchQuery || searchQuery.length < 1) {
      return res.json({
        success: true,
        data: []
      });
    }

    console.log(`🔍 Daily rewards searching for: "${searchQuery}"`);
    
    const searchPattern = `%${searchQuery}%`;
    const limitInt = Math.min(50, parseInt(limit) || 20);
    
    // Search in coupon_master table
    const query = `
      SELECT 
        coupon_id as id,
        coupon_name as code,
        coupon_name as name,
        coupon_name as title,
        description,
        discount_type,
        discount_value,
        is_active,
        valid_from,
        valid_till,
        for_all_store,
        for_specific_store,
        store_id,
        created_at,
        updated_at
      FROM coupon_master
      WHERE (coupon_name LIKE ? OR description LIKE ?)
        AND is_active = 1
      ORDER BY coupon_name ASC
      LIMIT ?
    `;
    
    const [coupons] = await pool.execute(query, [searchPattern, searchPattern, limitInt]);
    
    // Filter by validity if needed
    const currentTime = Math.floor(Date.now() / 1000);
    const validCoupons = coupons.filter(coupon => {
      // If valid_from and valid_till are set, check validity
      if (coupon.valid_from && coupon.valid_till) {
        return currentTime >= coupon.valid_from && currentTime <= coupon.valid_till;
      }
      // If no validity dates, consider it valid
      return true;
    });
    
    console.log(`✅ Daily rewards found ${validCoupons.length} valid coupons matching "${searchQuery}"`);
    
    res.json({
      success: true,
      data: validCoupons
    });
    
  } catch (error) {
    console.error('❌ Error in daily rewards coupon search:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search coupons for daily rewards',
      error: error.message
    });
  }
});

module.exports = router;