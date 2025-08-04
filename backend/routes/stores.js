// routes/stores.js - Complete Store Management Backend with File Upload Support
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { pool } = require('../config/database');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/stores/';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Check file type
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Configure multer fields for store images
const uploadFields = upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'banner_image', maxCount: 1 },
  { name: 'qr_code', maxCount: 1 }
]);

// GET /api/stores - Get all stores with detailed information
router.get('/', async (req, res) => {
  try {
    console.log('📥 GET /api/stores - Fetching all stores');
    console.log('Query params:', req.query);
    
    const { 
      search, 
      limit = 10, 
      offset = 0,
      category_id,
      is_premium,
      is_active = '1'
    } = req.query;
    
    // Convert parameters to proper types
    const limitInt = Math.max(1, Math.min(100, parseInt(limit) || 10));
    const offsetInt = Math.max(0, parseInt(offset) || 0);
    
    console.log('Parsed params:', { limitInt, offsetInt, search, category_id, is_premium });
    
    // Base query to get stores with category and transaction info
    let query = `
      SELECT 
        s.id,
        s.name,
        s.category_id,
        s.description,
        s.sub_category,
        s.phone_number,
        s.email,
        s.address,
        s.latitude,
        s.longitude,
        s.logo,
        s.banner_image,
        s.rating,
        s.total_reviews,
        s.normal_discount_percentage,
        s.vip_discount_percentage,
        s.commission_percent,
        s.minimum_order_amount,
        s.qr_code,
        s.upi_id,
        s.google_business_url,
        s.contract_start_date,
        s.contract_expiry_date,
        s.owner_password,
        s.closed_by,
        s.is_premium,
        s.is_active,
        s.created_at,
        s.updated_at,
        c.name as category_name,
        COUNT(DISTINCT t.id) AS total_transactions,
        COALESCE(SUM(t.bill_amount), 0) AS total_bill_amount,
        COALESCE(SUM(t.final_amount), 0) AS total_final_amount,
        COALESCE(AVG(t.final_amount), 0) AS average_order_value,
        COUNT(DISTINCT t.user_id) AS unique_customers
      FROM stores s
      LEFT JOIN categories c ON s.category_id = c.id
      LEFT JOIN transactions t ON s.id = t.store_id
      WHERE 1=1
    `;
    
    const params = [];
    
    // Add active filter
    if (is_active !== undefined && is_active !== '') {
      query += ` AND s.is_active = ?`;
      params.push(parseInt(is_active));
    }
    
    // Add search functionality
    if (search && search.trim()) {
      query += ` AND (s.name LIKE ? OR s.email LIKE ? OR s.phone_number LIKE ? OR s.address LIKE ? OR s.sub_category LIKE ?)`;
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    // Add category filter
    if (category_id && category_id !== '') {
      query += ` AND s.category_id = ?`;
      params.push(parseInt(category_id));
    }
    
    // Add partner filter
    if (is_premium !== undefined && is_premium !== '') {
      query += ` AND s.is_premium = ?`;
      params.push(parseInt(is_premium));
    }
    
    // Add GROUP BY clause
    query += ` 
      GROUP BY 
        s.id, s.name, s.category_id, s.description, s.sub_category, s.phone_number, s.email,
        s.address, s.latitude, s.longitude, s.logo, s.banner_image, s.rating,
        s.total_reviews, s.normal_discount_percentage, s.vip_discount_percentage,
        s.commission_percent, s.minimum_order_amount, s.qr_code, s.upi_id, s.google_business_url,
        s.contract_start_date, s.contract_expiry_date, s.owner_password, s.closed_by,
        s.is_premium, s.is_active, s.created_at, s.updated_at, c.name
    `;
    
    // Add ordering and pagination
    query += ` ORDER BY s.created_at DESC LIMIT ${limitInt} OFFSET ${offsetInt}`;

    console.log('Final query:', query);
    console.log('Parameters:', params);
    
    // Execute the main query
    const [stores] = await pool.execute(query, params);
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(DISTINCT s.id) as total 
      FROM stores s 
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE 1=1
    `;
    const countParams = [];
    
    if (is_active !== undefined && is_active !== '') {
      countQuery += ` AND s.is_active = ?`;
      countParams.push(parseInt(is_active));
    }
    
    if (search && search.trim()) {
      countQuery += ` AND (s.name LIKE ? OR s.email LIKE ? OR s.phone_number LIKE ? OR s.address LIKE ? OR s.sub_category LIKE ?)`;
      const searchTerm = `%${search.trim()}%`;
      countParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    if (category_id && category_id !== '') {
      countQuery += ` AND s.category_id = ?`;
      countParams.push(parseInt(category_id));
    }
    
    if (is_premium !== undefined && is_premium !== '') {
      countQuery += ` AND s.is_premium = ?`;
      countParams.push(parseInt(is_premium));
    }
    
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    // Get stats for dashboard
    const [statsResult] = await pool.execute(`
      SELECT 
        COUNT(DISTINCT s.id) as totalStores,
        COUNT(DISTINCT CASE WHEN s.is_premium = 1 THEN s.id END) as partnerStores,
        COUNT(DISTINCT t.id) as totalTransactions,
        COALESCE(SUM(t.bill_amount), 0) as totalBillAmount,
        COALESCE(SUM(t.final_amount), 0) as totalFinalAmount,
        COALESCE(AVG(s.rating), 0) as averageRating
      FROM stores s
      LEFT JOIN transactions t ON s.id = t.store_id
      WHERE s.is_active = 1
    `);
    
    console.log(`✅ Found ${stores.length} stores out of ${total} total`);
    
    res.json({
      success: true,
      data: {
        stores: stores,
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
    console.error('❌ Error fetching stores:', error);
    console.error('SQL Error Details:', {
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      sql: error.sql
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stores',
      error: error.message,
      debug: {
        code: error.code,
        errno: error.errno,
        sqlMessage: error.sqlMessage
      }
    });
  }
});

// GET /api/stores/:id - Get store by ID with complete details
router.get('/:id', async (req, res) => {
  try {
    console.log(`📥 GET /api/stores/${req.params.id} - Fetching store details`);
    
    const storeId = parseInt(req.params.id);
    
    if (isNaN(storeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid store ID'
      });
    }
    
    // 1. Get store details with category information
    const [stores] = await pool.execute(`
      SELECT 
        s.id,
        s.name,
        s.category_id,
        s.description,
        s.sub_category,
        s.phone_number,
        s.email,
        s.address,
        s.latitude,
        s.longitude,
        s.logo,
        s.banner_image,
        s.rating,
        s.total_reviews,
        s.normal_discount_percentage,
        s.vip_discount_percentage,
        s.commission_percent,
        s.minimum_order_amount,
        s.qr_code,
        s.upi_id,
        s.google_business_url,
        s.contract_start_date,
        s.contract_expiry_date,
        s.owner_password,
        s.closed_by,
        s.is_premium,
        s.is_active,
        s.created_at,
        s.updated_at,
        c.name as category_name,
        COUNT(DISTINCT t.id) as total_transactions,
        COALESCE(SUM(t.bill_amount), 0) as total_bill_amount,
        COALESCE(SUM(t.final_amount), 0) as total_final_amount,
        COALESCE(AVG(t.final_amount), 0) as average_order_value,
        COUNT(DISTINCT t.user_id) as unique_customers
      FROM stores s
      LEFT JOIN categories c ON s.category_id = c.id
      LEFT JOIN transactions t ON s.id = t.store_id
      WHERE s.id = ?
      GROUP BY 
        s.id, s.name, s.category_id, s.description, s.sub_category, s.phone_number, s.email,
        s.address, s.latitude, s.longitude, s.logo, s.banner_image, s.rating,
        s.total_reviews, s.normal_discount_percentage, s.vip_discount_percentage,
        s.commission_percent, s.minimum_order_amount, s.qr_code, s.upi_id, s.google_business_url,
        s.contract_start_date, s.contract_expiry_date, s.owner_password, s.closed_by,
        s.is_premium, s.is_active, s.created_at, s.updated_at, c.name
    `, [storeId]);
    
    if (stores.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }
    
    const store = stores[0];
    
    // 2. Get recent transactions for this store
    const [recentTransactions] = await pool.execute(`
      SELECT 
        t.id,
        t.transaction_number,
        t.user_id,
        t.bill_amount,
        t.final_amount,
        t.cashback_used,
        t.cashback_earned,
        t.payment_status,
        t.payment_method,
        t.created_at,
        u.first_name,
        u.last_name,
        u.email,
        u.phone_number
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.store_id = ?
      ORDER BY t.created_at DESC
      LIMIT 20
    `, [storeId]);
    
    // 3. Get monthly transaction summary for charts
    const [monthlyStats] = await pool.execute(`
      SELECT 
        DATE_FORMAT(t.created_at, '%Y-%m') as month,
        COUNT(t.id) as transaction_count,
        SUM(t.bill_amount) as total_bill_amount,
        SUM(t.final_amount) as total_final_amount,
        AVG(t.final_amount) as average_order_value
      FROM transactions t
      WHERE t.store_id = ? AND t.created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(t.created_at, '%Y-%m')
      ORDER BY month ASC
    `, [storeId]);
    
    console.log(`✅ Store ${storeId} details fetched successfully`);
    console.log(`📊 Found ${recentTransactions.length} recent transactions`);
    console.log(`📈 Found ${monthlyStats.length} months of data`);
    
    res.json({
      success: true,
      data: {
        store,
        recentTransactions,
        monthlyStats
      }
    });
  } catch (error) {
    console.error('❌ Error fetching store details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch store details',
      error: error.message
    });
  }
});

// POST /api/stores - Create new store with file uploads
router.post('/', uploadFields, async (req, res) => {
  try {
    console.log('📝 POST /api/stores - Creating new store');
    console.log('Request data:', req.body);
    console.log('Uploaded files:', req.files);
    
    const {
      // Required fields
      name,
      category_id,
      phone_number,
      email,
      address,
      
      // Optional fields
      description,
      sub_category,
      latitude,
      longitude,
      normal_discount_percentage = 0,
      vip_discount_percentage = 0,
      commission_percent = 0,
      minimum_order_amount = 0,
      upi_id,
      google_business_url,
      contract_start_date,
      contract_expiry_date,
      owner_password,
      closed_by,
      is_premium = 0,
      is_active = 1
    } = req.body;

    // Convert empty strings to null for numeric fields
    const convertEmptyToNull = (value) => {
      return value === '' || value === undefined || value === null ? null : value;
    };

    // Handle uploaded files - store full paths
    const getImagePath = (filename) => {
      return filename ? `/api/stores/image/${filename}` : null;
    };
    
    const logo = req.files && req.files.logo ? getImagePath(req.files.logo[0].filename) : null;
    const banner_image = req.files && req.files.banner_image ? getImagePath(req.files.banner_image[0].filename) : null;
    const qr_code = req.files && req.files.qr_code ? getImagePath(req.files.qr_code[0].filename) : null;

    // Convert and validate numeric fields
    const processedLatitude = convertEmptyToNull(latitude);
    const processedLongitude = convertEmptyToNull(longitude);
    const processedNormalDiscount = convertEmptyToNull(normal_discount_percentage) || 0;
    const processedVipDiscount = convertEmptyToNull(vip_discount_percentage) || 0;
    const processedCommission = convertEmptyToNull(commission_percent) || 0;
    const processedMinOrder = convertEmptyToNull(minimum_order_amount) || 0;

    // Validate numeric values if provided
    if (processedLatitude !== null && (isNaN(processedLatitude) || processedLatitude < -90 || processedLatitude > 90)) {
      return res.status(400).json({
        success: false,
        message: 'Latitude must be a valid number between -90 and 90'
      });
    }

    if (processedLongitude !== null && (isNaN(processedLongitude) || processedLongitude < -180 || processedLongitude > 180)) {
      return res.status(400).json({
        success: false,
        message: 'Longitude must be a valid number between -180 and 180'
      });
    }

    // Validate required fields
    if (!name || !category_id || !phone_number || !email || !address) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided: name, category_id, phone_number, email, address'
      });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Check if store already exists by email
    const [existingStores] = await pool.execute(
      'SELECT id, email FROM stores WHERE email = ?',
      [email]
    );

    if (existingStores.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Store with this email already exists'
      });
    }

    // Check if category exists
    const [categoryExists] = await pool.execute(
      'SELECT id FROM categories WHERE id = ? AND is_active = 1',
      [category_id]
    );

    if (categoryExists.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID'
      });
    }

    // Insert new store
    const [result] = await pool.execute(`
      INSERT INTO stores (
        name, 
        category_id, 
        description,
        sub_category,
        phone_number, 
        email, 
        address,
        latitude,
        longitude,
        logo,
        banner_image,
        qr_code,
        rating,
        total_reviews,
        normal_discount_percentage,
        vip_discount_percentage,
        commission_percent,
        minimum_order_amount,
        upi_id,
        google_business_url,
        contract_start_date,
        contract_expiry_date,
        owner_password,
        closed_by,
        is_premium,
        is_active,
        created_at, 
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      name,
      category_id,
      description || null,
      sub_category || null,
      phone_number,
      email,
      address,
      processedLatitude,
      processedLongitude,
      logo,
      banner_image,
      qr_code,
      processedNormalDiscount,
      processedVipDiscount,
      processedCommission,
      processedMinOrder,
      upi_id || null,
      google_business_url || null,
      contract_start_date || null,
      contract_expiry_date || null,
      owner_password || null,
      closed_by || null,
      is_premium,
      is_active
    ]);

    const storeId = result.insertId;
    console.log(`✅ Store created with ID: ${storeId}`);

    // Fetch the complete created store data
    const [createdStores] = await pool.execute(`
      SELECT 
        s.*,
        c.name as category_name
      FROM stores s
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE s.id = ?
    `, [storeId]);

    console.log(`✅ Store ${storeId} created successfully`);

    res.status(201).json({
      success: true,
      message: 'Store created successfully',
      data: {
        store: createdStores[0]
      }
    });

  } catch (error) {
    console.error('❌ Error creating store:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Store with this email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create store',
      error: error.message
    });
  }
});

// PUT /api/stores/:id - Update store with file uploads
router.put('/:id', uploadFields, async (req, res) => {
  try {
    console.log(`📝 PUT /api/stores/${req.params.id} - Updating store`);
    console.log('Update data:', req.body);
    console.log('Uploaded files:', req.files);
    
    const storeId = parseInt(req.params.id);
    const updateData = req.body;
    
    if (isNaN(storeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid store ID'
      });
    }
    
    // Validate email format if provided
    if (updateData.email && !isValidEmail(updateData.email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }
    
    // Check if store exists
    const [existingStores] = await pool.execute(
      'SELECT id FROM stores WHERE id = ?',
      [storeId]
    );
    
    if (existingStores.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Convert empty strings to null for numeric fields
    const convertEmptyToNull = (value) => {
      return value === '' || value === undefined || value === null ? null : value;
    };

    // Handle uploaded files - store full paths
    const getImagePath = (filename) => {
      return filename ? `/api/stores/image/${filename}` : null;
    };
    
    if (req.files) {
      if (req.files.logo) updateData.logo = getImagePath(req.files.logo[0].filename);
      if (req.files.banner_image) updateData.banner_image = getImagePath(req.files.banner_image[0].filename);
      if (req.files.qr_code) updateData.qr_code = getImagePath(req.files.qr_code[0].filename);
    }

    // Handle image removal
    if (req.body.remove_logo === 'true') updateData.logo = null;
    if (req.body.remove_banner_image === 'true') updateData.banner_image = null;
    if (req.body.remove_qr_code === 'true') updateData.qr_code = null;

    // Convert numeric fields - handle empty strings
    const numericFields = ['latitude', 'longitude', 'normal_discount_percentage', 'vip_discount_percentage', 'commission_percent', 'minimum_order_amount'];
    numericFields.forEach(field => {
      if (updateData[field] !== undefined) {
        updateData[field] = convertEmptyToNull(updateData[field]);
        // Convert to number if not null
        if (updateData[field] !== null) {
          const numValue = parseFloat(updateData[field]);
          if (isNaN(numValue)) {
            return res.status(400).json({
              success: false,
              message: `${field} must be a valid number`
            });
          }
          updateData[field] = numValue;
        }
      }
    });

    // Additional validation for coordinate fields
    if (updateData.latitude !== undefined && updateData.latitude !== null && (updateData.latitude < -90 || updateData.latitude > 90)) {
      return res.status(400).json({
        success: false,
        message: 'Latitude must be between -90 and 90'
      });
    }

    if (updateData.longitude !== undefined && updateData.longitude !== null && (updateData.longitude < -180 || updateData.longitude > 180)) {
      return res.status(400).json({
        success: false,
        message: 'Longitude must be between -180 and 180'
      });
    }

    // Build update query dynamically
    const updateFields = [
      'name', 'category_id', 'description', 'sub_category', 'phone_number', 'email', 'address',
      'latitude', 'longitude', 'normal_discount_percentage', 'vip_discount_percentage', 'commission_percent',
      'minimum_order_amount', 'upi_id', 'google_business_url', 'contract_start_date', 'contract_expiry_date',
      'owner_password', 'closed_by', 'is_premium', 'is_active', 'logo', 'banner_image', 'qr_code'
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

    params.push(storeId);
    
    await pool.execute(
      `UPDATE stores SET ${setClause.join(', ')}, updated_at = NOW() WHERE id = ?`,
      params
    );
    
    // Fetch updated store
    const [updatedStores] = await pool.execute(`
      SELECT 
        s.*,
        c.name as category_name
      FROM stores s
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE s.id = ?
    `, [storeId]);

    console.log(`✅ Store ${storeId} updated successfully`);

    res.json({
      success: true,
      message: 'Store updated successfully',
      data: updatedStores[0]
    });
  } catch (error) {
    console.error('❌ Error updating store:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update store',
      error: error.message
    });
  }
});

// PATCH /api/stores/:id - Toggle store status
router.patch('/:id', async (req, res) => {
  try {
    console.log(`🔄 PATCH /api/stores/${req.params.id} - Updating store status`);
    console.log('Request body:', req.body);
    
    const storeId = parseInt(req.params.id);
    const { is_active } = req.body;
    
    if (isNaN(storeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid store ID'
      });
    }
    
    // Check if store exists
    const [existingStores] = await pool.execute(
      'SELECT id FROM stores WHERE id = ?',
      [storeId]
    );
    
    if (existingStores.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Update store status
    const [result] = await pool.execute(
      'UPDATE stores SET is_active = ?, updated_at = NOW() WHERE id = ?',
      [is_active, storeId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    console.log(`✅ Store ${storeId} status updated successfully (is_active: ${is_active})`);

    res.json({
      success: true,
      message: is_active === 0 ? 'Store deactivated successfully' : 'Store activated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating store status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update store status',
      error: error.message
    });
  }
});

// GET /api/stores/categories - Get all categories
router.get('/categories/list', async (req, res) => {
  try {
    console.log('📥 GET /api/stores/categories - Fetching categories');
    
    const [categories] = await pool.execute(`
      SELECT 
        c.id,
        c.name,
        c.icon,
        c.display_order,
        c.is_active,
        c.created_at,
        c.updated_at,
        COUNT(s.id) as store_count
      FROM categories c
      LEFT JOIN stores s ON c.id = s.category_id AND s.is_active = 1
      WHERE c.is_active = 1
      GROUP BY c.id, c.name, c.icon, c.display_order, c.is_active, c.created_at, c.updated_at
      ORDER BY c.display_order ASC, c.name ASC
    `);
    
    console.log(`✅ Found ${categories.length} categories`);
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
});

// GET /api/stores/image/:filename - Serve uploaded images
router.get('/image/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const imagePath = path.join(__dirname, '../uploads/stores/', filename);
    
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }
    
    // Set appropriate headers
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };
    
    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow CORS for images
    
    // Send file
    res.sendFile(imagePath);
  } catch (error) {
    console.error('❌ Error serving image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to serve image',
      error: error.message
    });
  }
});

// Helper function for email validation
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

module.exports = router;