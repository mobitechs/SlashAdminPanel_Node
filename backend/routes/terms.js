// routes/terms.js - Complete Terms & Conditions Management API
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// GET /api/terms - Get all Terms & Conditions
router.get('/', async (req, res) => {
  try {
    console.log('📥 GET /api/terms - Fetching all Terms & Conditions');
    console.log('Query params:', req.query);
    
    const { 
      search, 
      limit = 10, 
      offset = 0,
      status
    } = req.query;
    
    // Convert parameters to proper types
    const limitInt = Math.max(1, Math.min(100, parseInt(limit) || 10));
    const offsetInt = Math.max(0, parseInt(offset) || 0);
    
    console.log('Parsed params:', { limitInt, offsetInt, search, status });
    
    // Base query
    let query = `
      SELECT 
        id,
        title,
        description,
        is_active,
        created_at,
        updated_at
      FROM terms_conditions
      WHERE 1=1
    `;
    
    const params = [];
    
    // Add search functionality
    if (search && search.trim()) {
      query += ` AND (title LIKE ? OR description LIKE ?)`;
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm);
    }
    
    // Add status filter
    if (status !== undefined && status !== '') {
      query += ` AND is_active = ?`;
      params.push(parseInt(status));
    }
    
    // Add ordering and pagination
    query += ` ORDER BY created_at DESC LIMIT ${limitInt} OFFSET ${offsetInt}`;

    console.log('Final query:', query);
    console.log('Parameters:', params);
    
    // Execute the main query
    const [terms] = await pool.execute(query, params);
    
    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM terms_conditions WHERE 1=1`;
    const countParams = [];
    
    if (search && search.trim()) {
      countQuery += ` AND (title LIKE ? OR description LIKE ?)`;
      const searchTerm = `%${search.trim()}%`;
      countParams.push(searchTerm, searchTerm);
    }
    
    if (status !== undefined && status !== '') {
      countQuery += ` AND is_active = ?`;
      countParams.push(parseInt(status));
    }
    
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    // Get stats
    const [statsResult] = await pool.execute(`
      SELECT 
        COUNT(*) as totalTerms,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as activeTerms
      FROM terms_conditions
    `);
    
    console.log(`✅ Found ${terms.length} Terms & Conditions out of ${total} total`);
    
    res.json({
      success: true,
      data: {
        terms: terms,
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
    console.error('❌ Error fetching Terms & Conditions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Terms & Conditions',
      error: error.message
    });
  }
});

// GET /api/terms/:id - Get Terms & Conditions by ID
router.get('/:id', async (req, res) => {
  try {
    console.log(`📥 GET /api/terms/${req.params.id} - Fetching Terms & Conditions details`);
    
    const termId = parseInt(req.params.id);
    
    if (isNaN(termId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Terms & Conditions ID'
      });
    }
    
    const [terms] = await pool.execute(`
      SELECT 
        id,
        title,
        description,
        is_active,
        created_at,
        updated_at
      FROM terms_conditions
      WHERE id = ?
    `, [termId]);
    
    if (terms.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Terms & Conditions not found'
      });
    }
    
    console.log(`✅ Terms & Conditions ${termId} details fetched successfully`);
    
    res.json({
      success: true,
      data: {
        term: terms[0]
      }
    });
  } catch (error) {
    console.error('❌ Error fetching Terms & Conditions details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Terms & Conditions details',
      error: error.message
    });
  }
});

// POST /api/terms - Create new Terms & Conditions
router.post('/', async (req, res) => {
  try {
    console.log('📝 POST /api/terms - Creating new Terms & Conditions');
    console.log('Request data:', req.body);
    
    const {
      title,
      description,
      is_active = 1
    } = req.body;

    // Validate required fields
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: title, description'
      });
    }

    // Insert new Terms & Conditions
    const [result] = await pool.execute(`
      INSERT INTO terms_conditions (
        title, 
        description, 
        is_active,
        created_at, 
        updated_at
      ) VALUES (?, ?, ?, NOW(), NOW())
    `, [
      title.trim(),
      description.trim(),
      is_active
    ]);

    const termId = result.insertId;
    console.log(`✅ Terms & Conditions created with ID: ${termId}`);

    // Fetch the complete created Terms & Conditions data
    const [createdTerms] = await pool.execute(`
      SELECT 
        id,
        title,
        description,
        is_active,
        created_at,
        updated_at
      FROM terms_conditions
      WHERE id = ?
    `, [termId]);

    console.log(`✅ Terms & Conditions ${termId} created successfully`);

    res.status(201).json({
      success: true,
      message: 'Terms & Conditions created successfully',
      data: {
        term: createdTerms[0]
      }
    });

  } catch (error) {
    console.error('❌ Error creating Terms & Conditions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create Terms & Conditions',
      error: error.message
    });
  }
});

// PUT /api/terms/:id - Update Terms & Conditions
router.put('/:id', async (req, res) => {
  try {
    console.log(`📝 PUT /api/terms/${req.params.id} - Updating Terms & Conditions`);
    console.log('Update data:', req.body);
    
    const termId = parseInt(req.params.id);
    const updateData = req.body;
    
    if (isNaN(termId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Terms & Conditions ID'
      });
    }
    
    // Check if Terms & Conditions exists
    const [existingTerms] = await pool.execute(
      'SELECT id FROM terms_conditions WHERE id = ?',
      [termId]
    );
    
    if (existingTerms.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Terms & Conditions not found'
      });
    }

    // Build update query dynamically
    const updateFields = [];
    const updateParams = [];

    const allowedFields = ['title', 'description', 'is_active'];

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateParams.push(updateData[field]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    updateParams.push(termId);

    await pool.execute(
      `UPDATE terms_conditions SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = ?`,
      updateParams
    );

    // Fetch updated Terms & Conditions
    const [updatedTerms] = await pool.execute(`
      SELECT 
        id,
        title,
        description,
        is_active,
        created_at,
        updated_at
      FROM terms_conditions
      WHERE id = ?
    `, [termId]);

    console.log(`✅ Terms & Conditions ${termId} updated successfully`);

    res.json({
      success: true,
      message: 'Terms & Conditions updated successfully',
      data: {
        term: updatedTerms[0]
      }
    });

  } catch (error) {
    console.error('❌ Error updating Terms & Conditions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update Terms & Conditions',
      error: error.message
    });
  }
});

// PATCH /api/terms/:id - Update Terms & Conditions status
router.patch('/:id', async (req, res) => {
  try {
    console.log(`🔄 PATCH /api/terms/${req.params.id} - Updating Terms & Conditions status`);
    console.log('Request body:', req.body);
    
    const termId = parseInt(req.params.id);
    const { is_active } = req.body;
    
    if (isNaN(termId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Terms & Conditions ID'
      });
    }
    
    const [result] = await pool.execute(
      'UPDATE terms_conditions SET is_active = ?, updated_at = NOW() WHERE id = ?',
      [is_active, termId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Terms & Conditions not found'
      });
    }

    console.log(`✅ Terms & Conditions ${termId} status updated successfully (is_active: ${is_active})`);

    res.json({
      success: true,
      message: is_active === 0 ? 'Terms & Conditions deactivated successfully' : 'Terms & Conditions activated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating Terms & Conditions status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update Terms & Conditions status',
      error: error.message
    });
  }
});

// DELETE /api/terms/:id - Delete Terms & Conditions
router.delete('/:id', async (req, res) => {
  try {
    console.log(`🗑️ DELETE /api/terms/${req.params.id} - Deleting Terms & Conditions`);
    
    const termId = parseInt(req.params.id);
    
    if (isNaN(termId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Terms & Conditions ID'
      });
    }
    
    const [result] = await pool.execute(
      'DELETE FROM terms_conditions WHERE id = ?',
      [termId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Terms & Conditions not found'
      });
    }

    console.log(`✅ Terms & Conditions ${termId} deleted successfully`);

    res.json({
      success: true,
      message: 'Terms & Conditions deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting Terms & Conditions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete Terms & Conditions',
      error: error.message
    });
  }
});

module.exports = router;