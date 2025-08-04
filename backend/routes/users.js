// routes/users.js - Complete with Create User Functionality + Referrals + VIP Fields
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// GET /api/users - Get all users with wallet information
router.get('/', async (req, res) => {
  try {
    console.log('📥 GET /api/users - Fetching all users');
    console.log('Query params:', req.query);
    
    const { 
      search, 
      limit = 10, 
      offset = 0,
      include_wallet = 'true',
      isEmailVerified,
      isPhoneVerified
    } = req.query;
    
    // Convert parameters to proper types
    const limitInt = Math.max(1, Math.min(100, parseInt(limit) || 10));
    const offsetInt = Math.max(0, parseInt(offset) || 0);
    
    console.log('Parsed params:', { limitInt, offsetInt, search });
    
    // Base query using your optimized SQL + VIP fields
    let query = `
      SELECT 
        u.id,
        u.phone_number,
        u.first_name,
        u.last_name,
        u.email,
        u.referral_code,
        u.is_email_verified,
        u.is_phone_verified,
        u.is_active,
        u.is_vip,
        u.vip_start_date,
        u.vip_end_date,
        u.device_token,
        u.created_at,
        u.updated_at,
        COALESCE(uw.available_cashback, 0) as available_cashback,
        COALESCE(uw.total_cashback_earned, 0) as total_cashback_earned,
        COALESCE(uw.total_cashback_redeemed, 0) as total_cashback_redeemed,
        COALESCE(uw.total_coupon_redeemed, 0) as total_coupon_redeemed,
        COUNT(DISTINCT t.id) AS total_transactions,
        COALESCE(SUM(t.final_amount), 0) AS total_spent
      FROM users u
      LEFT JOIN user_wallets uw ON u.id = uw.user_id
      LEFT JOIN transactions t ON u.id = t.user_id
      WHERE u.deleted_at IS NULL AND u.is_active = 1
    `;
    
    const params = [];
    
    // Add search functionality
    if (search && search.trim()) {
      query += ` AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR u.phone_number LIKE ?)`;
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    // Add email verification filter
    if (isEmailVerified !== undefined && isEmailVerified !== '') {
      query += ` AND u.is_email_verified = ?`;
      params.push(parseInt(isEmailVerified));
    }
    
    // Add phone verification filter  
    if (isPhoneVerified !== undefined && isPhoneVerified !== '') {
      query += ` AND u.is_phone_verified = ?`;
      params.push(parseInt(isPhoneVerified));
    }
    
    // Add wallet filter (only users with wallet records)
    if (include_wallet === 'true') {
      query += ` AND uw.id IS NOT NULL`;
    }
    
    // Add GROUP BY clause (from your optimized query) + VIP fields
    query += ` 
      GROUP BY 
        u.id, 
        u.phone_number,
        u.first_name,
        u.last_name,
        u.email,
        u.referral_code,
        u.is_email_verified,
        u.is_phone_verified,
        u.is_active,
        u.is_vip,
        u.vip_start_date,
        u.vip_end_date,
        u.device_token,
        u.created_at,
        u.updated_at,
        uw.available_cashback,
        uw.total_cashback_earned,
        uw.total_cashback_redeemed,
        uw.total_coupon_redeemed
    `;
    
    // Add ordering and pagination
    query += ` ORDER BY u.created_at DESC LIMIT ${limitInt} OFFSET ${offsetInt}`;

    console.log('Final query:', query);
    console.log('Parameters:', params);
    console.log('Parameter types:', params.map(p => typeof p));
    
    // Execute the main query
    const [users] = await pool.execute(query, params);
    
    // Get total count for pagination (separate simpler query)
    let countQuery = `
      SELECT COUNT(DISTINCT u.id) as total 
      FROM users u 
      LEFT JOIN user_wallets uw ON u.id = uw.user_id
      WHERE u.deleted_at IS NULL AND u.is_active = 1
    `;
    const countParams = [];
    
    if (search && search.trim()) {
      countQuery += ` AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR u.phone_number LIKE ?)`;
      const searchTerm = `%${search.trim()}%`;
      countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    if (isEmailVerified !== undefined && isEmailVerified !== '') {
      countQuery += ` AND u.is_email_verified = ?`;
      countParams.push(parseInt(isEmailVerified));
    }
    
    if (isPhoneVerified !== undefined && isPhoneVerified !== '') {
      countQuery += ` AND u.is_phone_verified = ?`;
      countParams.push(parseInt(isPhoneVerified));
    }
    
    if (include_wallet === 'true') {
      countQuery += ` AND uw.id IS NOT NULL`;
    }
    
    console.log('Count query:', countQuery);
    console.log('Count parameters:', countParams);
    
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    // Get stats for dashboard (separate query for better performance) + VIP users
    const [statsResult] = await pool.execute(`
      SELECT 
        COUNT(DISTINCT u.id) as totalUsers,
        COUNT(DISTINCT CASE WHEN u.is_email_verified = 1 THEN u.id END) as verifiedUsers,
        COUNT(DISTINCT CASE WHEN u.is_vip = 1 THEN u.id END) as vipUsers,
        COALESCE(SUM(uw.available_cashback), 0) as totalCashback,
        COALESCE(SUM(uw.total_cashback_earned), 0) as totalEarned
      FROM users u
      LEFT JOIN user_wallets uw ON u.id = uw.user_id
      WHERE u.deleted_at IS NULL AND u.is_active = 1
    `);
    
    console.log(`✅ Found ${users.length} users out of ${total} total`);
    
    res.json({
      success: true,
      data: {
        users: users,
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
    console.error('❌ Error fetching users:', error);
    console.error('SQL Error Details:', {
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      sql: error.sql
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message,
      debug: {
        code: error.code,
        errno: error.errno,
        sqlMessage: error.sqlMessage
      }
    });
  }
});

// GET /api/users/:id - Get user by ID with complete details
router.get('/:id', async (req, res) => {
  try {
    console.log(`📥 GET /api/users/${req.params.id} - Fetching user details`);
    
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }
    
    // 1. Get user details with wallet and profile information + VIP fields
    const [users] = await pool.execute(`
      SELECT 
        u.id,
        u.phone_number,
        u.first_name,
        u.last_name,
        u.email,
        u.referral_code,
        u.is_email_verified,
        u.is_phone_verified,
        u.is_active,
        u.is_vip,
        u.vip_start_date,
        u.vip_end_date,
        u.device_token,
        u.created_at,
        u.updated_at,
        COALESCE(uw.available_cashback, 0) as available_cashback,
        COALESCE(uw.total_cashback_earned, 0) as total_cashback_earned,
        COALESCE(uw.total_cashback_redeemed, 0) as total_cashback_redeemed,
        COALESCE(uw.total_coupon_redeemed, 0) as total_coupon_redeemed,
        up.profile_picture,
        up.gender,
        up.date_of_birth,
        up.anniversary_date,
        up.spouse_birth_date,
        up.address_building,
        up.address_street,
        up.address_city,
        up.address_state,
        up.address_pincode,
        up.profile_completion_percentage,
        COUNT(DISTINCT t.id) as total_transactions,
        COALESCE(SUM(t.final_amount), 0) as total_spent
      FROM users u
      LEFT JOIN user_wallets uw ON u.id = uw.user_id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN transactions t ON u.id = t.user_id
      WHERE u.id = ? AND u.deleted_at IS NULL
      GROUP BY 
        u.id, u.phone_number, u.first_name, u.last_name, u.email,
        u.referral_code, u.is_email_verified, u.is_phone_verified, 
        u.is_active, u.is_vip, u.vip_start_date, u.vip_end_date,
        u.device_token, u.created_at, u.updated_at,
        uw.available_cashback, uw.total_cashback_earned, 
        uw.total_cashback_redeemed, uw.total_coupon_redeemed,
        up.profile_picture, up.gender, up.date_of_birth, up.anniversary_date,
        up.spouse_birth_date, up.address_building, up.address_street,
        up.address_city, up.address_state, up.address_pincode,
        up.profile_completion_percentage
    `, [userId]);
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const user = users[0];
    
    // 2. Get recent transactions (for transaction tab)
    const [recentTransactions] = await pool.execute(`
      SELECT 
        t.id,
        t.transaction_number,
        t.bill_amount,
        t.final_amount,
        t.cashback_used,
        t.payment_status,
        t.created_at,
        s.name as store_name,
        c.name as category_name
      FROM transactions t
      LEFT JOIN stores s ON t.store_id = s.id
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE t.user_id = ?
      ORDER BY t.created_at DESC
    `, [userId]);
    
    // 3. Get ALL reward history with transaction and store details (for rewards tab)
    const [rewards] = await pool.execute(`
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
        -- Transaction details (NULL if reward is not linked to a transaction)
        t.transaction_number,
        t.bill_amount,
        t.final_amount,
        -- Store details (NULL if reward is not linked to a store)
        s.name as store_name
      FROM reward_history rh
      LEFT JOIN transactions t ON rh.transaction_id = t.id
      LEFT JOIN stores s ON rh.store_id = s.id
      WHERE rh.user_id = ?
      ORDER BY rh.created_at DESC
    `, [userId]);
    
    console.log(`✅ User ${userId} details fetched successfully`);
    console.log(`📊 Found ${recentTransactions.length} transactions`);
    console.log(`🎁 Found ${rewards.length} rewards`);
    
    // Log some sample data for debugging
    if (rewards.length > 0) {
      console.log(`🎁 Sample reward:`, {
        id: rewards[0].id,
        type: rewards[0].reward_type,
        amount: rewards[0].amount,
        transaction: rewards[0].transaction_number || 'No transaction',
        store: rewards[0].store_name || 'No store'
      });
    }
    
    res.json({
      success: true,
      data: {
        user,
        recentTransactions,
        rewards
      }
    });
  } catch (error) {
    console.error('❌ Error fetching user details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user details',
      error: error.message
    });
  }
});

// GET /api/users/:id/referrals - Get all referrals made by a specific user
router.get('/:id/referrals', async (req, res) => {
  try {
    console.log(`📥 GET /api/users/${req.params.id}/referrals - Fetching user referrals`);
    
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }
    
    // Check if the referrer user exists
    const [referrerUser] = await pool.execute(
      'SELECT id, first_name, last_name FROM users WHERE id = ? AND deleted_at IS NULL',
      [userId]
    );
    
    if (referrerUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get all referrals made by this user with referred user details
    const [referrals] = await pool.execute(`
      SELECT 
        r.id,
        r.referrer_user_id,
        r.referred_user_id,
        r.referral_status,
        r.reward_earned,
        r.referred_date,
        r.signup_date,
        r.first_transaction_date,
        r.created_at,
        r.updated_at,
        -- Referred user details (NULL if user hasn't signed up yet)
        ru.first_name as referred_first_name,
        ru.last_name as referred_last_name,
        ru.email as referred_email,
        ru.phone_number as referred_phone,
        ru.is_active as referred_is_active,
        ru.is_email_verified as referred_is_email_verified,
        ru.is_phone_verified as referred_is_phone_verified,
        ru.created_at as referred_user_created_at
      FROM referrals r
      LEFT JOIN users ru ON r.referred_user_id = ru.id AND ru.deleted_at IS NULL
      WHERE r.referrer_user_id = ?
      ORDER BY r.created_at DESC
    `, [userId]);
    
    // Get referral statistics for this user
    const [referralStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_referrals,
        COUNT(CASE WHEN referral_status = 'link_sent' THEN 1 END) as pending_referrals,
        COUNT(CASE WHEN referral_status = 'signed_up' THEN 1 END) as signed_up_referrals,
        COUNT(CASE WHEN referral_status = 'transaction_made' THEN 1 END) as completed_referrals,
        COALESCE(SUM(reward_earned), 0) as total_rewards_earned,
        COALESCE(AVG(reward_earned), 0) as average_reward_per_referral
      FROM referrals 
      WHERE referrer_user_id = ?
    `, [userId]);
    
    console.log(`✅ User ${userId} referrals fetched successfully`);
    console.log(`👥 Found ${referrals.length} referrals`);
    console.log(`📊 Referral Stats:`, referralStats[0]);
    
    // Log some sample data for debugging
    if (referrals.length > 0) {
      console.log(`👥 Sample referral:`, {
        id: referrals[0].id,
        status: referrals[0].referral_status,
        reward: referrals[0].reward_earned,
        referred_user: referrals[0].referred_first_name 
          ? `${referrals[0].referred_first_name} ${referrals[0].referred_last_name}` 
          : 'Not signed up yet'
      });
    }
    
    res.json({
      success: true,
      data: {
        referrals: referrals,
        stats: referralStats[0],
        referrer: {
          id: referrerUser[0].id,
          name: `${referrerUser[0].first_name} ${referrerUser[0].last_name}`
        }
      }
    });
  } catch (error) {
    console.error('❌ Error fetching user referrals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user referrals',
      error: error.message
    });
  }
});

// POST /api/users - Create new user
router.post('/', async (req, res) => {
  try {
    console.log('📝 POST /api/users - Creating new user');
    console.log('Request data:', req.body);
    
    const {
      // Required fields
      phone_number,
      first_name,
      last_name,
      email,
      
      // Optional user table fields
      is_email_verified = 0,
      is_phone_verified = 0,
      is_active = 1,
      
      // VIP fields
      is_vip = 0,
      vip_start_date,
      vip_end_date,
      
      // Optional profile fields
      gender,
      date_of_birth,
      anniversary_date,
      spouse_birth_date,
      address_building,
      address_street,
      address_city,
      address_state,
      address_pincode
    } = req.body;

    // Validate required fields
    if (!phone_number || !first_name || !last_name || !email) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided: phone_number, first_name, last_name, email'
      });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Validate phone number format
    if (!isValidPhoneNumber(phone_number)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format'
      });
    }

    // VIP validation
    if (parseInt(is_vip) === 1) {
      if (!vip_start_date || !vip_end_date) {
        return res.status(400).json({
          success: false,
          message: 'VIP start date and end date are required for VIP users'
        });
      }
      
      const startDate = new Date(vip_start_date);
      const endDate = new Date(vip_end_date);
      
      if (startDate >= endDate) {
        return res.status(400).json({
          success: false,
          message: 'VIP end date must be after start date'
        });
      }
    }

    // Check if user already exists by email
    const [existingEmailUsers] = await pool.execute(
      'SELECT id, email FROM users WHERE email = ? AND deleted_at IS NULL',
      [email]
    );

    if (existingEmailUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Check if user already exists by phone number
    const [existingPhoneUsers] = await pool.execute(
      'SELECT id, phone_number FROM users WHERE phone_number = ? AND deleted_at IS NULL',
      [phone_number]
    );

    if (existingPhoneUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User with this phone number already exists'
      });
    }

    // Generate unique referral code
    const referral_code = await generateReferralCode();

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Insert into users table with VIP fields
      const [userResult] = await connection.execute(`
        INSERT INTO users (
          phone_number, 
          first_name, 
          last_name, 
          email, 
          referral_code,
          is_email_verified,
          is_phone_verified,
          is_active,
          is_vip,
          vip_start_date,
          vip_end_date,
          created_at, 
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        phone_number,
        first_name,
        last_name,
        email,
        referral_code,
        is_email_verified,
        is_phone_verified,
        is_active,
        is_vip,
        is_vip == 1 ? vip_start_date : null,
        is_vip == 1 ? vip_end_date : null
      ]);

      const userId = userResult.insertId;
      console.log(`✅ User created with ID: ${userId}`);

      // Create profile if any profile fields are provided
      const profileFields = [
        'gender', 'date_of_birth', 'anniversary_date', 'spouse_birth_date',
        'address_building', 'address_street', 'address_city', 'address_state', 'address_pincode'
      ];

      const profileData = {};
      let hasProfileData = false;

      profileFields.forEach(field => {
        if (req.body[field] !== undefined && req.body[field] !== '') {
          // Convert empty strings to null for date fields
          if (['date_of_birth', 'anniversary_date', 'spouse_birth_date'].includes(field)) {
            profileData[field] = req.body[field] || null;
          } else {
            profileData[field] = req.body[field];
          }
          hasProfileData = true;
        }
      });

      if (hasProfileData) {
        const fields = Object.keys(profileData);
        const values = Object.values(profileData);
        const placeholders = fields.map(() => '?').join(', ');
        const fieldNames = fields.join(', ');

        await connection.execute(`
          INSERT INTO user_profiles (
            user_id, 
            ${fieldNames}, 
            created_at, 
            updated_at
          ) VALUES (?, ${placeholders}, NOW(), NOW())
        `, [userId, ...values]);

        console.log('✅ User profile created');
      }

      // Check if user wallet already exists before creating
      const [existingWallet] = await connection.execute(
        'SELECT id FROM user_wallets WHERE user_id = ?',
        [userId]
      );

      if (existingWallet.length === 0) {
        // Create user wallet only if it doesn't exist
        await connection.execute(`
          INSERT INTO user_wallets (
            user_id,
            available_cashback,
            total_cashback_earned,
            total_cashback_redeemed,
            total_coupon_redeemed,
            created_at,
            updated_at
          ) VALUES (?, 0, 0, 0, 0, NOW(), NOW())
        `, [userId]);

        console.log('✅ User wallet created');
      } else {
        console.log('ℹ️ User wallet already exists, skipping creation');
      }

      await connection.commit();

      // Fetch the complete created user data using the same query structure as GET + VIP fields
      const [createdUsers] = await connection.execute(`
        SELECT 
          u.id,
          u.phone_number,
          u.first_name,
          u.last_name,
          u.email,
          u.referral_code,
          u.is_email_verified,
          u.is_phone_verified,
          u.is_active,
          u.is_vip,
          u.vip_start_date,
          u.vip_end_date,
          u.device_token,
          u.created_at,
          u.updated_at,
          COALESCE(uw.available_cashback, 0) as available_cashback,
          COALESCE(uw.total_cashback_earned, 0) as total_cashback_earned,
          COALESCE(uw.total_cashback_redeemed, 0) as total_cashback_redeemed,
          COALESCE(uw.total_coupon_redeemed, 0) as total_coupon_redeemed,
          up.profile_picture,
          up.gender,
          up.date_of_birth,
          up.anniversary_date,
          up.spouse_birth_date,
          up.address_building,
          up.address_street,
          up.address_city,
          up.address_state,
          up.address_pincode,
          up.profile_completion_percentage
        FROM users u
        LEFT JOIN user_wallets uw ON u.id = uw.user_id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE u.id = ?
      `, [userId]);

      console.log(`✅ User ${userId} created successfully`);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: {
          user: createdUsers[0]
        }
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('❌ Error creating user:', error);
    
    // Handle specific database errors
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Phone number or email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    });
  }
});

// PUT /api/users/:id - Update user
router.put('/:id', async (req, res) => {
  try {
    console.log(`📝 PUT /api/users/${req.params.id} - Updating user`);
    console.log('Update data:', req.body);
    
    const userId = parseInt(req.params.id);
    const updateData = req.body;
    
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }
    
    // Validate email format if provided
    if (updateData.email && !isValidEmail(updateData.email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Validate phone number if provided
    if (updateData.phone_number && !isValidPhoneNumber(updateData.phone_number)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format'
      });
    }

    // VIP validation
    if (parseInt(updateData.is_vip) === 1) {
      if (!updateData.vip_start_date || !updateData.vip_end_date) {
        return res.status(400).json({
          success: false,
          message: 'VIP start date and end date are required for VIP users'
        });
      }
      
      const startDate = new Date(updateData.vip_start_date);
      const endDate = new Date(updateData.vip_end_date);
      
      if (startDate >= endDate) {
        return res.status(400).json({
          success: false,
          message: 'VIP end date must be after start date'
        });
      }
    }
    
    // Check if user exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE id = ? AND deleted_at IS NULL',
      [userId]
    );
    
    if (existingUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Update user table fields including VIP fields
      const userFields = [
        'first_name', 'last_name', 'email', 'phone_number', 
        'is_email_verified', 'is_phone_verified', 'is_active',
        'is_vip', 'vip_start_date', 'vip_end_date'
      ];
      const userUpdateFields = [];
      const userParams = [];

      userFields.forEach(field => {
        if (updateData[field] !== undefined) {
          userUpdateFields.push(`${field} = ?`);
          
          // Handle VIP date fields - set to NULL if not VIP
          if ((field === 'vip_start_date' || field === 'vip_end_date') && updateData.is_vip != 1) {
            userParams.push(null);
          } else {
            userParams.push(updateData[field]);
          }
        }
      });

      if (userUpdateFields.length > 0) {
        userParams.push(userId);
        await connection.execute(
          `UPDATE users SET ${userUpdateFields.join(', ')}, updated_at = NOW() WHERE id = ?`,
          userParams
        );
        console.log('✅ User table updated');
      }

      // Update user_profiles table if profile fields are provided
      const profileFields = [
        'gender', 'date_of_birth', 'anniversary_date', 'spouse_birth_date', 
        'address_building', 'address_street', 'address_city', 'address_state', 'address_pincode'
      ];
      
      const profileUpdateFields = [];
      const profileParams = [];

      profileFields.forEach(field => {
        if (updateData[field] !== undefined && updateData[field] !== '') {
          profileUpdateFields.push(`${field} = ?`);
          // Convert empty strings to null for date fields
          if (['date_of_birth', 'anniversary_date', 'spouse_birth_date'].includes(field)) {
            profileParams.push(updateData[field] || null);
          } else {
            profileParams.push(updateData[field]);
          }
        }
      });

      console.log('Profile fields to update:', profileUpdateFields);
      console.log('Profile parameters:', profileParams);

      if (profileUpdateFields.length > 0) {
        // Check if profile exists
        const [profileExists] = await connection.execute(
          'SELECT id FROM user_profiles WHERE user_id = ?', [userId]
        );

        if (profileExists.length > 0) {
          // Update existing profile
          profileParams.push(userId);
          await connection.execute(
            `UPDATE user_profiles SET ${profileUpdateFields.join(', ')}, updated_at = NOW() WHERE user_id = ?`,
            profileParams
          );
          console.log('✅ User profile updated');
        } else {
          // Create new profile only if we have valid data
          const fields = profileUpdateFields.map(field => field.split(' = ')[0]).join(', ');
          const placeholders = profileUpdateFields.map(() => '?').join(', ');
          
          console.log('Creating new profile with fields:', fields);
          console.log('Creating new profile with params:', [userId, ...profileParams.slice(0, -1)]);
          
          await connection.execute(
            `INSERT INTO user_profiles (user_id, ${fields}, created_at, updated_at) VALUES (?, ${placeholders}, NOW(), NOW())`,
            [userId, ...profileParams.slice(0, -1)]
          );
          console.log('✅ User profile created');
        }
      } else {
        console.log('ℹ️ No profile fields to update (all empty)');
      }

      await connection.commit();
      
      // Fetch updated user using the same query structure as GET + VIP fields
      const [updatedUsers] = await connection.execute(`
        SELECT 
          u.id,
          u.phone_number,
          u.first_name,
          u.last_name,
          u.email,
          u.referral_code,
          u.is_email_verified,
          u.is_phone_verified,
          u.is_active,
          u.is_vip,
          u.vip_start_date,
          u.vip_end_date,
          u.device_token,
          u.created_at,
          u.updated_at,
          COALESCE(uw.available_cashback, 0) as available_cashback,
          COALESCE(uw.total_cashback_earned, 0) as total_cashback_earned,
          COALESCE(uw.total_cashback_redeemed, 0) as total_cashback_redeemed,
          COALESCE(uw.total_coupon_redeemed, 0) as total_coupon_redeemed,
          up.gender,
          up.date_of_birth,
          up.address_city,
          up.address_state,
          up.address_pincode
        FROM users u
        LEFT JOIN user_wallets uw ON u.id = uw.user_id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE u.id = ?
      `, [userId]);

      console.log(`✅ User ${userId} updated successfully`);

      res.json({
        success: true,
        message: 'User updated successfully',
        data: updatedUsers[0]
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
});

// DELETE /api/users/:id - Soft delete user
router.patch('/:id', async (req, res) => {
  try {
    console.log(`🔄 PATCH /api/users/${req.params.id} - Updating user status`);
    console.log('Request body:', req.body);
    
    const userId = parseInt(req.params.id);
    const { is_active } = req.body;
    
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }
    
    // Check if user exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE id = ? AND deleted_at IS NULL',
      [userId]
    );
    
    if (existingUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user status
    const [result] = await pool.execute(
      'UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ? AND deleted_at IS NULL',
      [is_active, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found or already deleted'
      });
    }

    console.log(`✅ User ${userId} status updated successfully (is_active: ${is_active})`);

    res.json({
      success: true,
      message: is_active === 0 ? 'User deactivated successfully' : 'User activated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating user status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message
    });
  }
});

// Helper function to generate unique referral code
async function generateReferralCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let referralCode;
  let isUnique = false;
  
  while (!isUnique) {
    referralCode = '';
    for (let i = 0; i < 8; i++) {
      referralCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    // Check if this referral code already exists
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE referral_code = ?',
      [referralCode]
    );
    
    if (existing.length === 0) {
      isUnique = true;
    }
  }
  
  return referralCode;
}

// Helper functions
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhoneNumber(phone) {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
}

module.exports = router;