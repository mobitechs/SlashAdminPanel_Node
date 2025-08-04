// routes/videos.js - Complete App Demo Videos Management API
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// GET /api/videos - Get all App Demo Videos
router.get('/', async (req, res) => {
  try {
    console.log('📥 GET /api/videos - Fetching all App Demo Videos');
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
        video_link,
        sequence,
        is_active,
        created_at,
        updated_at
      FROM app_guidance_videos
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
    query += ` ORDER BY sequence ASC, created_at DESC LIMIT ${limitInt} OFFSET ${offsetInt}`;

    console.log('Final query:', query);
    console.log('Parameters:', params);
    
    // Execute the main query
    const [videos] = await pool.execute(query, params);
    
    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM app_guidance_videos WHERE 1=1`;
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
        COUNT(*) as totalVideos,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as activeVideos
      FROM app_guidance_videos
    `);
    
    console.log(`✅ Found ${videos.length} App Demo Videos out of ${total} total`);
    
    res.json({
      success: true,
      data: {
        videos: videos,
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
    console.error('❌ Error fetching App Demo Videos:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch App Demo Videos',
      error: error.message
    });
  }
});

// GET /api/videos/:id - Get App Demo Video by ID
router.get('/:id', async (req, res) => {
  try {
    console.log(`📥 GET /api/videos/${req.params.id} - Fetching App Demo Video details`);
    
    const videoId = parseInt(req.params.id);
    
    if (isNaN(videoId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid App Demo Video ID'
      });
    }
    
    const [videos] = await pool.execute(`
      SELECT 
        id,
        title,
        description,
        video_link,
        sequence,
        is_active,
        created_at,
        updated_at
      FROM app_guidance_videos
      WHERE id = ?
    `, [videoId]);
    
    if (videos.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'App Demo Video not found'
      });
    }
    
    console.log(`✅ App Demo Video ${videoId} details fetched successfully`);
    
    res.json({
      success: true,
      data: {
        video: videos[0]
      }
    });
  } catch (error) {
    console.error('❌ Error fetching App Demo Video details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch App Demo Video details',
      error: error.message
    });
  }
});

// POST /api/videos - Create new App Demo Video
router.post('/', async (req, res) => {
  try {
    console.log('📝 POST /api/videos - Creating new App Demo Video');
    console.log('Request data:', req.body);
    
    const {
      title,
      description,
      video_link,
      sequence = 0,
      is_active = 1
    } = req.body;

    // Validate required fields
    if (!title || !video_link) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: title, video_link'
      });
    }

    // Validate video link format (basic validation)
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    if (!urlPattern.test(video_link)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid video link format'
      });
    }

    // Insert new App Demo Video
    const [result] = await pool.execute(`
      INSERT INTO app_guidance_videos (
        title, 
        description, 
        video_link, 
        sequence,
        is_active,
        created_at, 
        updated_at
      ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      title.trim(),
      description ? description.trim() : null,
      video_link.trim(),
      parseInt(sequence) || 0,
      is_active
    ]);

    const videoId = result.insertId;
    console.log(`✅ App Demo Video created with ID: ${videoId}`);

    // Fetch the complete created App Demo Video data
    const [createdVideos] = await pool.execute(`
      SELECT 
        id,
        title,
        description,
        video_link,
        sequence,
        is_active,
        created_at,
        updated_at
      FROM app_guidance_videos
      WHERE id = ?
    `, [videoId]);

    console.log(`✅ App Demo Video ${videoId} created successfully`);

    res.status(201).json({
      success: true,
      message: 'App Demo Video created successfully',
      data: {
        video: createdVideos[0]
      }
    });

  } catch (error) {
    console.error('❌ Error creating App Demo Video:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create App Demo Video',
      error: error.message
    });
  }
});

// PUT /api/videos/:id - Update App Demo Video
router.put('/:id', async (req, res) => {
  try {
    console.log(`📝 PUT /api/videos/${req.params.id} - Updating App Demo Video`);
    console.log('Update data:', req.body);
    
    const videoId = parseInt(req.params.id);
    const updateData = req.body;
    
    if (isNaN(videoId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid App Demo Video ID'
      });
    }
    
    // Check if App Demo Video exists
    const [existingVideos] = await pool.execute(
      'SELECT id FROM app_guidance_videos WHERE id = ?',
      [videoId]
    );
    
    if (existingVideos.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'App Demo Video not found'
      });
    }

    // Validate video link if provided
    if (updateData.video_link) {
      const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      if (!urlPattern.test(updateData.video_link)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid video link format'
        });
      }
    }

    // Build update query dynamically
    const updateFields = [];
    const updateParams = [];

    const allowedFields = ['title', 'description', 'video_link', 'sequence', 'is_active'];

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

    updateParams.push(videoId);

    await pool.execute(
      `UPDATE app_guidance_videos SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = ?`,
      updateParams
    );

    // Fetch updated App Demo Video
    const [updatedVideos] = await pool.execute(`
      SELECT 
        id,
        title,
        description,
        video_link,
        sequence,
        is_active,
        created_at,
        updated_at
      FROM app_guidance_videos
      WHERE id = ?
    `, [videoId]);

    console.log(`✅ App Demo Video ${videoId} updated successfully`);

    res.json({
      success: true,
      message: 'App Demo Video updated successfully',
      data: {
        video: updatedVideos[0]
      }
    });

  } catch (error) {
    console.error('❌ Error updating App Demo Video:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update App Demo Video',
      error: error.message
    });
  }
});

// PATCH /api/videos/:id - Update App Demo Video status
router.patch('/:id', async (req, res) => {
  try {
    console.log(`🔄 PATCH /api/videos/${req.params.id} - Updating App Demo Video status`);
    console.log('Request body:', req.body);
    
    const videoId = parseInt(req.params.id);
    const { is_active } = req.body;
    
    if (isNaN(videoId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid App Demo Video ID'
      });
    }
    
    const [result] = await pool.execute(
      'UPDATE app_guidance_videos SET is_active = ?, updated_at = NOW() WHERE id = ?',
      [is_active, videoId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'App Demo Video not found'
      });
    }

    console.log(`✅ App Demo Video ${videoId} status updated successfully (is_active: ${is_active})`);

    res.json({
      success: true,
      message: is_active === 0 ? 'App Demo Video deactivated successfully' : 'App Demo Video activated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating App Demo Video status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update App Demo Video status',
      error: error.message
    });
  }
});

// DELETE /api/videos/:id - Delete App Demo Video
router.delete('/:id', async (req, res) => {
  try {
    console.log(`🗑️ DELETE /api/videos/${req.params.id} - Deleting App Demo Video`);
    
    const videoId = parseInt(req.params.id);
    
    if (isNaN(videoId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid App Demo Video ID'
      });
    }
    
    const [result] = await pool.execute(
      'DELETE FROM app_guidance_videos WHERE id = ?',
      [videoId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'App Demo Video not found'
      });
    }

    console.log(`✅ App Demo Video ${videoId} deleted successfully`);

    res.json({
      success: true,
      message: 'App Demo Video deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting App Demo Video:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete App Demo Video',
      error: error.message
    });
  }
});

module.exports = router;