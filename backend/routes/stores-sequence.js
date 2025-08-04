// routes/stores-sequence.js - Complete Top Stores Management API with Drag & Drop
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// GET /api/stores-sequence - Get all Top Stores
router.get('/', async (req, res) => {
  try {
    console.log('📥 GET /api/stores-sequence - Fetching all Top Stores');
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
    
    // Base query with store information
    let query = `
      SELECT 
        ss.id,
        ss.store_id,
        ss.sequence_no,
        ss.is_active,
        ss.created_at,
        ss.updated_at,
        s.name as store_name,
        s.address as store_address,
        s.phone_number as store_phone,
        s.email as store_email
      FROM stores_sequnce ss
      LEFT JOIN stores s ON ss.store_id = s.id
      WHERE 1=1
    `;
    
    const params = [];
    
    // Add search functionality
    if (search && search.trim()) {
      query += ` AND (s.name LIKE ? OR s.address LIKE ?)`;
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm);
    }
    
    // Add status filter
    if (status !== undefined && status !== '') {
      query += ` AND ss.is_active = ?`;
      params.push(parseInt(status));
    }
    
    // Add ordering and pagination
    query += ` ORDER BY ss.sequence_no ASC, ss.created_at DESC LIMIT ${limitInt} OFFSET ${offsetInt}`;

    console.log('Final query:', query);
    console.log('Parameters:', params);
    
    // Execute the main query
    const [storesSequence] = await pool.execute(query, params);
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM stores_sequnce ss
      LEFT JOIN stores s ON ss.store_id = s.id
      WHERE 1=1
    `;
    const countParams = [];
    
    if (search && search.trim()) {
      countQuery += ` AND (s.name LIKE ? OR s.address LIKE ?)`;
      const searchTerm = `%${search.trim()}%`;
      countParams.push(searchTerm, searchTerm);
    }
    
    if (status !== undefined && status !== '') {
      countQuery += ` AND ss.is_active = ?`;
      countParams.push(parseInt(status));
    }
    
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    // Get stats
    const [statsResult] = await pool.execute(`
      SELECT 
        COUNT(*) as totalStoresSequence,
        COUNT(CASE WHEN ss.is_active = 1 THEN 1 END) as activeStoresSequence
      FROM stores_sequnce ss
    `);
    
    console.log(`✅ Found ${storesSequence.length} Top Stores out of ${total} total`);
    
    res.json({
      success: true,
      data: {
        storesSequence: storesSequence,
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
    console.error('❌ Error fetching Top Stores:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Top Stores',
      error: error.message
    });
  }
});

// PUT /api/stores-sequence/bulk-update-sequence - Bulk update sequence order
router.put('/bulk-update-sequence', async (req, res) => {
  try {
    console.log('📝 PUT /api/stores-sequence/bulk-update-sequence - Bulk updating sequence order');
    console.log('Request data:', req.body);
    
    const { sequences } = req.body;
    
    if (!sequences || !Array.isArray(sequences) || sequences.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'sequences array is required and must not be empty'
      });
    }
    
    // Validate each sequence object
    for (const seq of sequences) {
      if (!seq.id || seq.sequence_no === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Each sequence must have id and sequence_no'
        });
      }
    }
    
    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Update each sequence
      for (const seq of sequences) {
        await connection.execute(
          'UPDATE stores_sequnce SET sequence_no = ?, updated_at = NOW() WHERE id = ?',
          [parseInt(seq.sequence_no), parseInt(seq.id)]
        );
      }
      
      // Commit transaction
      await connection.commit();
      
      console.log(`✅ Successfully updated ${sequences.length} store sequences`);
      
      res.json({
        success: true,
        message: `Successfully updated ${sequences.length} store sequences`,
        data: {
          updatedCount: sequences.length
        }
      });
      
    } catch (error) {
      // Rollback transaction on error
      await connection.rollback();
      throw error;
    } finally {
      // Release connection
      connection.release();
    }
    
  } catch (error) {
    console.error('❌ Error bulk updating sequences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update sequences',
      error: error.message
    });
  }
});

// GET /api/stores-sequence/:id - Get Top Store by ID
router.get('/:id', async (req, res) => {
  try {
    console.log(`📥 GET /api/stores-sequence/${req.params.id} - Fetching Top Store details`);
    
    const sequenceId = parseInt(req.params.id);
    
    if (isNaN(sequenceId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Top Store ID'
      });
    }
    
    const [storesSequence] = await pool.execute(`
      SELECT 
        ss.id,
        ss.store_id,
        ss.sequence_no,
        ss.is_active,
        ss.created_at,
        ss.updated_at,
        s.name as store_name,
        s.address as store_address,
        s.phone_number as store_phone,
        s.email as store_email
      FROM stores_sequnce ss
      LEFT JOIN stores s ON ss.store_id = s.id
      WHERE ss.id = ?
    `, [sequenceId]);
    
    if (storesSequence.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Top Store not found'
      });
    }
    
    console.log(`✅ Top Store ${sequenceId} details fetched successfully`);
    
    res.json({
      success: true,
      data: {
        storeSequence: storesSequence[0]
      }
    });
  } catch (error) {
    console.error('❌ Error fetching Top Store details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Top Store details',
      error: error.message
    });
  }
});

// GET /api/stores-sequence/available-stores - Get available stores for dropdown
router.get('/available/stores', async (req, res) => {
  try {
    console.log('📥 GET /api/stores-sequence/available/stores - Fetching available stores');
    
    // Get stores that are not already in stores_sequnce or allow all stores
    const [stores] = await pool.execute(`
      SELECT 
        id,
        name,
        address,
        phone_number,
        email
      FROM stores
      WHERE is_active = 1
      ORDER BY name ASC
    `);
    
    console.log(`✅ Found ${stores.length} available stores`);
    
    res.json({
      success: true,
      data: {
        stores: stores
      }
    });
  } catch (error) {
    console.error('❌ Error fetching available stores:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available stores',
      error: error.message
    });
  }
});

// POST /api/stores-sequence - Create new Top Store
router.post('/', async (req, res) => {
  try {
    console.log('📝 POST /api/stores-sequence - Creating new Top Store');
    console.log('Request data:', req.body);
    
    const {
      store_id,
      sequence_no = 0,
      is_active = 1
    } = req.body;

    // Validate required fields
    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: store_id'
      });
    }

    // Validate store exists
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

    // Check if store is already in sequence
    const [existingSequence] = await pool.execute(
      'SELECT id FROM stores_sequnce WHERE store_id = ?',
      [store_id]
    );
    
    if (existingSequence.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Store is already in Top Stores sequence'
      });
    }

    // If no sequence_no provided, get the next sequence number
    let finalSequenceNo = parseInt(sequence_no);
    if (!finalSequenceNo || finalSequenceNo <= 0) {
      const [maxSequence] = await pool.execute(
        'SELECT MAX(sequence_no) as max_seq FROM stores_sequnce'
      );
      finalSequenceNo = (maxSequence[0].max_seq || 0) + 1;
    }

    // Insert new Top Store
    const [result] = await pool.execute(`
      INSERT INTO stores_sequnce (
        store_id, 
        sequence_no,
        is_active,
        created_at, 
        updated_at
      ) VALUES (?, ?, ?, NOW(), NOW())
    `, [
      store_id,
      finalSequenceNo,
      is_active
    ]);

    const sequenceId = result.insertId;
    console.log(`✅ Top Store created with ID: ${sequenceId}`);

    // Fetch the complete created Top Store data
    const [createdStoresSequence] = await pool.execute(`
      SELECT 
        ss.id,
        ss.store_id,
        ss.sequence_no,
        ss.is_active,
        ss.created_at,
        ss.updated_at,
        s.name as store_name,
        s.address as store_address,
        s.phone_number as store_phone,
        s.email as store_email
      FROM stores_sequnce ss
      LEFT JOIN stores s ON ss.store_id = s.id
      WHERE ss.id = ?
    `, [sequenceId]);

    console.log(`✅ Top Store ${sequenceId} created successfully`);

    res.status(201).json({
      success: true,
      message: 'Top Store created successfully',
      data: {
        storeSequence: createdStoresSequence[0]
      }
    });

  } catch (error) {
    console.error('❌ Error creating Top Store:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create Top Store',
      error: error.message
    });
  }
});

// PUT /api/stores-sequence/:id - Update Top Store
router.put('/:id', async (req, res) => {
  try {
    console.log(`📝 PUT /api/stores-sequence/${req.params.id} - Updating Top Store`);
    console.log('Update data:', req.body);
    
    const sequenceId = parseInt(req.params.id);
    const updateData = req.body;
    
    if (isNaN(sequenceId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Top Store ID'
      });
    }
    
    // Check if Top Store exists
    const [existingSequence] = await pool.execute(
      'SELECT id, store_id FROM stores_sequnce WHERE id = ?',
      [sequenceId]
    );
    
    if (existingSequence.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Top Store not found'
      });
    }

    // Validate store_id if provided
    if (updateData.store_id && updateData.store_id !== existingSequence[0].store_id) {
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

      // Check if new store is already in sequence
      const [duplicateSequence] = await pool.execute(
        'SELECT id FROM stores_sequnce WHERE store_id = ? AND id != ?',
        [updateData.store_id, sequenceId]
      );
      
      if (duplicateSequence.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Store is already in Top Stores sequence'
        });
      }
    }

    // Build update query dynamically
    const updateFields = [];
    const updateParams = [];

    const allowedFields = ['store_id', 'sequence_no', 'is_active'];

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

    updateParams.push(sequenceId);

    await pool.execute(
      `UPDATE stores_sequnce SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = ?`,
      updateParams
    );

    // Fetch updated Top Store
    const [updatedStoresSequence] = await pool.execute(`
      SELECT 
        ss.id,
        ss.store_id,
        ss.sequence_no,
        ss.is_active,
        ss.created_at,
        ss.updated_at,
        s.name as store_name,
        s.address as store_address,
        s.phone_number as store_phone,
        s.email as store_email
      FROM stores_sequnce ss
      LEFT JOIN stores s ON ss.store_id = s.id
      WHERE ss.id = ?
    `, [sequenceId]);

    console.log(`✅ Top Store ${sequenceId} updated successfully`);

    res.json({
      success: true,
      message: 'Top Store updated successfully',
      data: {
        storeSequence: updatedStoresSequence[0]
      }
    });

  } catch (error) {
    console.error('❌ Error updating Top Store:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update Top Store',
      error: error.message
    });
  }
});

// PATCH /api/stores-sequence/:id - Update Top Store status
router.patch('/:id', async (req, res) => {
  try {
    console.log(`🔄 PATCH /api/stores-sequence/${req.params.id} - Updating Top Store status`);
    console.log('Request body:', req.body);
    
    const sequenceId = parseInt(req.params.id);
    const { is_active } = req.body;
    
    if (isNaN(sequenceId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Top Store ID'
      });
    }
    
    const [result] = await pool.execute(
      'UPDATE stores_sequnce SET is_active = ?, updated_at = NOW() WHERE id = ?',
      [is_active, sequenceId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Top Store not found'
      });
    }

    console.log(`✅ Top Store ${sequenceId} status updated successfully (is_active: ${is_active})`);

    res.json({
      success: true,
      message: is_active === 0 ? 'Top Store deactivated successfully' : 'Top Store activated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating Top Store status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update Top Store status',
      error: error.message
    });
  }
});

// DELETE /api/stores-sequence/:id - Delete Top Store
router.delete('/:id', async (req, res) => {
  try {
    console.log(`🗑️ DELETE /api/stores-sequence/${req.params.id} - Deleting Top Store`);
    
    const sequenceId = parseInt(req.params.id);
    
    if (isNaN(sequenceId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Top Store ID'
      });
    }
    
    const [result] = await pool.execute(
      'DELETE FROM stores_sequnce WHERE id = ?',
      [sequenceId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Top Store not found'
      });
    }

    console.log(`✅ Top Store ${sequenceId} deleted successfully`);

    res.json({
      success: true,
      message: 'Top Store deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting Top Store:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete Top Store',
      error: error.message
    });
  }
});

module.exports = router;