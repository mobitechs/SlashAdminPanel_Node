// routes/faqs.js - Complete FAQs Management API
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// GET /api/faqs - Get all FAQs
router.get('/', async (req, res) => {
  try {
    console.log('📥 GET /api/faqs - Fetching all FAQs');
    console.log('Query params:', req.query);
    
    const { 
      search, 
      limit = 10, 
      offset = 0,
      category,
      status
    } = req.query;
    
    // Convert parameters to proper types
    const limitInt = Math.max(1, Math.min(100, parseInt(limit) || 10));
    const offsetInt = Math.max(0, parseInt(offset) || 0);
    
    console.log('Parsed params:', { limitInt, offsetInt, search, category, status });
    
    // Base query
    let query = `
      SELECT 
        id,
        question,
        answer,
        category,
        display_order,
        is_active,
        created_at,
        updated_at
      FROM faqs
      WHERE 1=1
    `;
    
    const params = [];
    
    // Add search functionality
    if (search && search.trim()) {
      query += ` AND (question LIKE ? OR answer LIKE ? OR category LIKE ?)`;
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    // Add category filter
    if (category && category.trim()) {
      query += ` AND category = ?`;
      params.push(category.trim());
    }
    
    // Add status filter
    if (status !== undefined && status !== '') {
      query += ` AND is_active = ?`;
      params.push(parseInt(status));
    }
    
    // Add ordering and pagination
    query += ` ORDER BY display_order ASC, created_at DESC LIMIT ${limitInt} OFFSET ${offsetInt}`;

    console.log('Final query:', query);
    console.log('Parameters:', params);
    
    // Execute the main query
    const [faqs] = await pool.execute(query, params);
    
    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM faqs WHERE 1=1`;
    const countParams = [];
    
    if (search && search.trim()) {
      countQuery += ` AND (question LIKE ? OR answer LIKE ? OR category LIKE ?)`;
      const searchTerm = `%${search.trim()}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (category && category.trim()) {
      countQuery += ` AND category = ?`;
      countParams.push(category.trim());
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
        COUNT(*) as totalFaqs,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as activeFaqs,
        COUNT(DISTINCT category) as categories
      FROM faqs
    `);
    
    console.log(`✅ Found ${faqs.length} FAQs out of ${total} total`);
    
    res.json({
      success: true,
      data: {
        faqs: faqs,
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
    console.error('❌ Error fetching FAQs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch FAQs',
      error: error.message
    });
  }
});

// GET /api/faqs/:id - Get FAQ by ID
router.get('/:id', async (req, res) => {
  try {
    console.log(`📥 GET /api/faqs/${req.params.id} - Fetching FAQ details`);
    
    const faqId = parseInt(req.params.id);
    
    if (isNaN(faqId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid FAQ ID'
      });
    }
    
    const [faqs] = await pool.execute(`
      SELECT 
        id,
        question,
        answer,
        category,
        display_order,
        is_active,
        created_at,
        updated_at
      FROM faqs
      WHERE id = ?
    `, [faqId]);
    
    if (faqs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }
    
    console.log(`✅ FAQ ${faqId} details fetched successfully`);
    
    res.json({
      success: true,
      data: {
        faq: faqs[0]
      }
    });
  } catch (error) {
    console.error('❌ Error fetching FAQ details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch FAQ details',
      error: error.message
    });
  }
});

// POST /api/faqs - Create new FAQ
router.post('/', async (req, res) => {
  try {
    console.log('📝 POST /api/faqs - Creating new FAQ');
    console.log('Request data:', req.body);
    
    const {
      question,
      answer,
      category,
      display_order = 0,
      is_active = 1
    } = req.body;

    // Validate required fields
    if (!question || !answer || !category) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: question, answer, category'
      });
    }

    // Insert new FAQ
    const [result] = await pool.execute(`
      INSERT INTO faqs (
        question, 
        answer, 
        category, 
        display_order,
        is_active,
        created_at, 
        updated_at
      ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      question.trim(),
      answer.trim(),
      category.trim(),
      parseInt(display_order) || 0,
      is_active
    ]);

    const faqId = result.insertId;
    console.log(`✅ FAQ created with ID: ${faqId}`);

    // Fetch the complete created FAQ data
    const [createdFaqs] = await pool.execute(`
      SELECT 
        id,
        question,
        answer,
        category,
        display_order,
        is_active,
        created_at,
        updated_at
      FROM faqs
      WHERE id = ?
    `, [faqId]);

    console.log(`✅ FAQ ${faqId} created successfully`);

    res.status(201).json({
      success: true,
      message: 'FAQ created successfully',
      data: {
        faq: createdFaqs[0]
      }
    });

  } catch (error) {
    console.error('❌ Error creating FAQ:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create FAQ',
      error: error.message
    });
  }
});

// PUT /api/faqs/:id - Update FAQ
router.put('/:id', async (req, res) => {
  try {
    console.log(`📝 PUT /api/faqs/${req.params.id} - Updating FAQ`);
    console.log('Update data:', req.body);
    
    const faqId = parseInt(req.params.id);
    const updateData = req.body;
    
    if (isNaN(faqId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid FAQ ID'
      });
    }
    
    // Check if FAQ exists
    const [existingFaqs] = await pool.execute(
      'SELECT id FROM faqs WHERE id = ?',
      [faqId]
    );
    
    if (existingFaqs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }

    // Build update query dynamically
    const updateFields = [];
    const updateParams = [];

    const allowedFields = [
      'question', 'answer', 'category', 'display_order', 'is_active'
    ];

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

    updateParams.push(faqId);

    await pool.execute(
      `UPDATE faqs SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = ?`,
      updateParams
    );

    // Fetch updated FAQ
    const [updatedFaqs] = await pool.execute(`
      SELECT 
        id,
        question,
        answer,
        category,
        display_order,
        is_active,
        created_at,
        updated_at
      FROM faqs
      WHERE id = ?
    `, [faqId]);

    console.log(`✅ FAQ ${faqId} updated successfully`);

    res.json({
      success: true,
      message: 'FAQ updated successfully',
      data: {
        faq: updatedFaqs[0]
      }
    });

  } catch (error) {
    console.error('❌ Error updating FAQ:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update FAQ',
      error: error.message
    });
  }
});

// PATCH /api/faqs/:id - Update FAQ status
router.patch('/:id', async (req, res) => {
  try {
    console.log(`🔄 PATCH /api/faqs/${req.params.id} - Updating FAQ status`);
    console.log('Request body:', req.body);
    
    const faqId = parseInt(req.params.id);
    const { is_active } = req.body;
    
    if (isNaN(faqId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid FAQ ID'
      });
    }
    
    const [result] = await pool.execute(
      'UPDATE faqs SET is_active = ?, updated_at = NOW() WHERE id = ?',
      [is_active, faqId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }

    console.log(`✅ FAQ ${faqId} status updated successfully (is_active: ${is_active})`);

    res.json({
      success: true,
      message: is_active === 0 ? 'FAQ deactivated successfully' : 'FAQ activated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating FAQ status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update FAQ status',
      error: error.message
    });
  }
});

// DELETE /api/faqs/:id - Delete FAQ
router.delete('/:id', async (req, res) => {
  try {
    console.log(`🗑️ DELETE /api/faqs/${req.params.id} - Deleting FAQ`);
    
    const faqId = parseInt(req.params.id);
    
    if (isNaN(faqId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid FAQ ID'
      });
    }
    
    const [result] = await pool.execute(
      'DELETE FROM faqs WHERE id = ?',
      [faqId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }

    console.log(`✅ FAQ ${faqId} deleted successfully`);

    res.json({
      success: true,
      message: 'FAQ deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting FAQ:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete FAQ',
      error: error.message
    });
  }
});

module.exports = router;