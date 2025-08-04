// routes/surveys.js - Complete Survey Management API with JSON Options Fix
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Helper function to format options for JSON storage
const formatOptionsForStorage = (options) => {
  if (!options || typeof options !== 'string' || !options.trim()) {
    return null;
  }
  
  try {
    // If options is a comma-separated string, convert to JSON array
    const optionsArray = options.split(',').map(opt => opt.trim()).filter(opt => opt);
    return optionsArray.length > 0 ? JSON.stringify(optionsArray) : null;
  } catch (error) {
    console.error('Error formatting options for storage:', error);
    return null;
  }
};

// Helper function to format options for display
const formatOptionsForDisplay = (options) => {
  if (!options) return null;
  
  try {
    // If it's a JSON string, parse it and join with commas
    const parsed = JSON.parse(options);
    if (Array.isArray(parsed)) {
      return parsed.join(', ');
    }
    return options;
  } catch (error) {
    // If it's not JSON, return as is
    return options;
  }
};

// GET /api/surveys - Get all surveys with statistics
router.get('/', async (req, res) => {
  try {
    console.log('📥 GET /api/surveys - Fetching all surveys');
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
    
    // Base query with statistics from survey_responses
    let query = `
      SELECT 
        sf.id,
        sf.title,
        sf.description,
        sf.reward_points,
        sf.is_active,
        sf.created_at,
        sf.updated_at,
        COUNT(DISTINCT sq.id) as total_questions,
        COUNT(DISTINCT sr.user_id) as total_responses,
        COUNT(DISTINCT sr.id) as total_answers
      FROM survey_forms sf
      LEFT JOIN survey_questions sq ON sf.id = sq.survey_form_id
      LEFT JOIN survey_responses sr ON sf.id = sr.survey_form_id
      WHERE 1=1
    `;
    
    const params = [];
    
    // Add search functionality
    if (search && search.trim()) {
      query += ` AND (sf.title LIKE ? OR sf.description LIKE ?)`;
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm);
    }
    
    // Add status filter
    if (status !== undefined && status !== '') {
      switch (status.toLowerCase()) {
        case 'active':
          query += ` AND sf.is_active = 1`;
          break;
        case 'inactive':
          query += ` AND sf.is_active = 0`;
          break;
      }
    }
    
    // Add GROUP BY clause
    query += ` 
      GROUP BY 
        sf.id, sf.title, sf.description, sf.reward_points,
        sf.is_active, sf.created_at, sf.updated_at
    `;
    
    // Add ordering and pagination
    query += ` ORDER BY sf.created_at DESC LIMIT ${limitInt} OFFSET ${offsetInt}`;

    console.log('Final query:', query);
    console.log('Parameters:', params);
    
    // Execute the main query
    const [surveys] = await pool.execute(query, params);
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(DISTINCT sf.id) as total 
      FROM survey_forms sf 
      WHERE 1=1
    `;
    const countParams = [];
    
    if (search && search.trim()) {
      countQuery += ` AND (sf.title LIKE ? OR sf.description LIKE ?)`;
      const searchTerm = `%${search.trim()}%`;
      countParams.push(searchTerm, searchTerm);
    }
    
    if (status !== undefined && status !== '') {
      switch (status.toLowerCase()) {
        case 'active':
          countQuery += ` AND sf.is_active = 1`;
          break;
        case 'inactive':
          countQuery += ` AND sf.is_active = 0`;
          break;
      }
    }
    
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    // Get stats for dashboard
    const [statsResult] = await pool.execute(`
      SELECT 
        COUNT(DISTINCT sf.id) as totalSurveys,
        COUNT(DISTINCT CASE WHEN sf.is_active = 1 THEN sf.id END) as activeSurveys,
        COUNT(DISTINCT sr.user_id) as totalParticipants,
        COALESCE(SUM(sf.reward_points), 0) as totalRewardPoints
      FROM survey_forms sf
      LEFT JOIN survey_responses sr ON sf.id = sr.survey_form_id
    `);
    
    console.log(`✅ Found ${surveys.length} surveys out of ${total} total`);
    
    res.json({
      success: true,
      data: {
        surveys: surveys,
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
    console.error('❌ Error fetching surveys:', error);
    console.error('SQL Error Details:', {
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      sql: error.sql
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch surveys',
      error: error.message,
      debug: {
        code: error.code,
        errno: error.errno,
        sqlMessage: error.sqlMessage
      }
    });
  }
});

// GET /api/surveys/:id - Get survey by ID with questions and responses
router.get('/:id', async (req, res) => {
  try {
    console.log(`📥 GET /api/surveys/${req.params.id} - Fetching survey details`);
    
    const surveyId = parseInt(req.params.id);
    
    if (isNaN(surveyId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid survey ID'
      });
    }
    
    // Get survey details
    const [surveys] = await pool.execute(`
      SELECT 
        sf.id,
        sf.title,
        sf.description,
        sf.reward_points,
        sf.is_active,
        sf.created_at,
        sf.updated_at,
        COUNT(DISTINCT sq.id) as total_questions,
        COUNT(DISTINCT sr.user_id) as total_participants,
        COUNT(DISTINCT sr.id) as total_responses
      FROM survey_forms sf
      LEFT JOIN survey_questions sq ON sf.id = sq.survey_form_id
      LEFT JOIN survey_responses sr ON sf.id = sr.survey_form_id
      WHERE sf.id = ?
      GROUP BY sf.id, sf.title, sf.description, sf.reward_points, sf.is_active, sf.created_at, sf.updated_at
    `, [surveyId]);
    
    if (surveys.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
      });
    }
    
    const survey = surveys[0];
    
    // Get survey questions
    const [questions] = await pool.execute(`
      SELECT 
        id,
        survey_form_id,
        question,
        question_type,
        options,
        is_required,
        display_order,
        created_at
      FROM survey_questions
      WHERE survey_form_id = ?
      ORDER BY display_order ASC, created_at ASC
    `, [surveyId]);
    
    // Format options for display
    const formattedQuestions = questions.map(q => ({
      ...q,
      options: formatOptionsForDisplay(q.options)
    }));
    
    // Get recent responses
    const [recentResponses] = await pool.execute(`
      SELECT 
        sr.id,
        sr.user_id,
        sr.survey_form_id,
        sr.question_id,
        sr.answer,
        sr.created_at,
        u.first_name,
        u.last_name,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        u.email,
        sq.question,
        sq.question_type
      FROM survey_responses sr
      LEFT JOIN users u ON sr.user_id = u.id
      LEFT JOIN survey_questions sq ON sr.question_id = sq.id
      WHERE sr.survey_form_id = ?
      ORDER BY sr.created_at DESC
      LIMIT 100
    `, [surveyId]);
    
    console.log(`✅ Survey ${surveyId} details fetched successfully`);
    console.log(`📊 Found ${formattedQuestions.length} questions and ${recentResponses.length} responses`);
    
    res.json({
      success: true,
      data: {
        survey,
        questions: formattedQuestions,
        recentResponses
      }
    });
  } catch (error) {
    console.error('❌ Error fetching survey details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch survey details',
      error: error.message
    });
  }
});

// POST /api/surveys - Create new survey
router.post('/', async (req, res) => {
  try {
    console.log('📝 POST /api/surveys - Creating new survey');
    console.log('Request data:', req.body);
    
    const {
      title,
      description,
      reward_points,
      is_active = 1,
      questions = []
    } = req.body;

    // Validate required fields
    if (!title || !description || reward_points === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: title, description, reward_points'
      });
    }

    // Validate reward points
    if (reward_points < 0) {
      return res.status(400).json({
        success: false,
        message: 'Reward points cannot be negative'
      });
    }

    // Check if survey with same title already exists
    const [existingSurveys] = await pool.execute(
      'SELECT id, title FROM survey_forms WHERE title = ?',
      [title.trim()]
    );

    if (existingSurveys.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Survey with this title already exists'
      });
    }

    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Insert new survey
      const [result] = await connection.execute(`
        INSERT INTO survey_forms (
          title, 
          description, 
          reward_points,
          is_active,
          created_at, 
          updated_at
        ) VALUES (?, ?, ?, ?, NOW(), NOW())
      `, [
        title.trim(),
        description.trim(),
        parseFloat(reward_points),
        is_active
      ]);

      const surveyId = result.insertId;
      console.log(`✅ Survey created with ID: ${surveyId}`);

      // Insert questions if provided
      if (questions && questions.length > 0) {
        for (let i = 0; i < questions.length; i++) {
          const question = questions[i];
          
          // Handle options properly for JSON column
          const optionsValue = formatOptionsForStorage(question.options);
          
          await connection.execute(`
            INSERT INTO survey_questions (
              survey_form_id,
              question,
              question_type,
              options,
              is_required,
              display_order,
              created_at
            ) VALUES (?, ?, ?, ?, ?, ?, NOW())
          `, [
            surveyId,
            question.question,
            question.question_type || 'text',
            optionsValue,
            question.is_required || 0,
            question.display_order || i + 1
          ]);
        }
        console.log(`✅ Added ${questions.length} questions to survey ${surveyId}`);
      }

      await connection.commit();

      // Fetch the complete created survey data
      const [createdSurveys] = await pool.execute(`
        SELECT 
          sf.id,
          sf.title,
          sf.description,
          sf.reward_points,
          sf.is_active,
          sf.created_at,
          sf.updated_at,
          COUNT(DISTINCT sq.id) as total_questions
        FROM survey_forms sf
        LEFT JOIN survey_questions sq ON sf.id = sq.survey_form_id
        WHERE sf.id = ?
        GROUP BY sf.id, sf.title, sf.description, sf.reward_points, sf.is_active, sf.created_at, sf.updated_at
      `, [surveyId]);

      console.log(`✅ Survey ${surveyId} created successfully`);

      res.status(201).json({
        success: true,
        message: 'Survey created successfully',
        data: {
          survey: createdSurveys[0]
        }
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('❌ Error creating survey:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create survey',
      error: error.message
    });
  }
});

// PUT /api/surveys/:id - Update survey
router.put('/:id', async (req, res) => {
  try {
    console.log(`📝 PUT /api/surveys/${req.params.id} - Updating survey`);
    console.log('Update data:', req.body);
    
    const surveyId = parseInt(req.params.id);
    const updateData = req.body;
    
    if (isNaN(surveyId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid survey ID'
      });
    }
    
    // Check if survey exists
    const [existingSurveys] = await pool.execute(
      'SELECT id FROM survey_forms WHERE id = ?',
      [surveyId]
    );
    
    if (existingSurveys.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
      });
    }

    // Validate reward points if provided
    if (updateData.reward_points !== undefined && updateData.reward_points < 0) {
      return res.status(400).json({
        success: false,
        message: 'Reward points cannot be negative'
      });
    }

    // Check for duplicate survey title if title is being updated
    if (updateData.title) {
      const [duplicateSurveys] = await pool.execute(
        'SELECT id FROM survey_forms WHERE title = ? AND id != ?',
        [updateData.title.trim(), surveyId]
      );
      
      if (duplicateSurveys.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Survey title already exists'
        });
      }
    }

    try {
      // Build update query dynamically
      const updateFields = [];
      const updateParams = [];

      const allowedFields = [
        'title', 'description', 'reward_points', 'is_active'
      ];

      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          updateFields.push(`${field} = ?`);
          let value = updateData[field];
          
          // Special handling for specific fields
          if (field === 'title' || field === 'description') {
            value = value.trim();
          } else if (field === 'reward_points') {
            value = value === '' ? 0 : parseFloat(value);
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

      updateParams.push(surveyId);

      await pool.execute(
        `UPDATE survey_forms SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = ?`,
        updateParams
      );

      // Fetch updated survey
      const [updatedSurveys] = await pool.execute(`
        SELECT 
          sf.id,
          sf.title,
          sf.description,
          sf.reward_points,
          sf.is_active,
          sf.created_at,
          sf.updated_at,
          COUNT(DISTINCT sq.id) as total_questions
        FROM survey_forms sf
        LEFT JOIN survey_questions sq ON sf.id = sq.survey_form_id
        WHERE sf.id = ?
        GROUP BY sf.id, sf.title, sf.description, sf.reward_points, sf.is_active, sf.created_at, sf.updated_at
      `, [surveyId]);

      console.log(`✅ Survey ${surveyId} updated successfully`);

      res.json({
        success: true,
        message: 'Survey updated successfully',
        data: {
          survey: updatedSurveys[0]
        }
      });

    } catch (error) {
      console.error('❌ Error updating survey:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          message: 'Survey title already exists'
        });
      }

      throw error;
    }

  } catch (error) {
    console.error('❌ Error updating survey:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update survey',
      error: error.message
    });
  }
});

// PATCH /api/surveys/:id - Update survey status
router.patch('/:id', async (req, res) => {
  try {
    console.log(`🔄 PATCH /api/surveys/${req.params.id} - Updating survey status`);
    console.log('Request body:', req.body);
    
    const surveyId = parseInt(req.params.id);
    const { is_active } = req.body;
    
    if (isNaN(surveyId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid survey ID'
      });
    }
    
    // Check if survey exists
    const [existingSurveys] = await pool.execute(
      'SELECT id FROM survey_forms WHERE id = ?',
      [surveyId]
    );
    
    if (existingSurveys.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
      });
    }

    // Update survey status
    const [result] = await pool.execute(
      'UPDATE survey_forms SET is_active = ?, updated_at = NOW() WHERE id = ?',
      [is_active, surveyId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
      });
    }

    console.log(`✅ Survey ${surveyId} status updated successfully (is_active: ${is_active})`);

    res.json({
      success: true,
      message: is_active === 0 ? 'Survey deactivated successfully' : 'Survey activated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating survey status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update survey status',
      error: error.message
    });
  }
});

// DELETE /api/surveys/:id - Delete survey (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    console.log(`🗑️ DELETE /api/surveys/${req.params.id} - Deleting survey`);
    
    const surveyId = parseInt(req.params.id);
    
    if (isNaN(surveyId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid survey ID'
      });
    }
    
    // Check if survey exists
    const [existingSurveys] = await pool.execute(
      'SELECT id FROM survey_forms WHERE id = ?',
      [surveyId]
    );
    
    if (existingSurveys.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
      });
    }

    // Check if survey has responses
    const [responseCheck] = await pool.execute(
      'SELECT COUNT(*) as response_count FROM survey_responses WHERE survey_form_id = ?',
      [surveyId]
    );

    if (responseCheck[0].response_count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete survey that has responses. Consider deactivating instead.'
      });
    }

    // Soft delete by setting is_active = 0
    const [result] = await pool.execute(
      'UPDATE survey_forms SET is_active = 0, updated_at = NOW() WHERE id = ?',
      [surveyId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
      });
    }

    console.log(`✅ Survey ${surveyId} deactivated successfully`);

    res.json({
      success: true,
      message: 'Survey deactivated successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting survey:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete survey',
      error: error.message
    });
  }
});

// POST /api/surveys/:id/questions - Add question to survey
router.post('/:id/questions', async (req, res) => {
  try {
    console.log(`📝 POST /api/surveys/${req.params.id}/questions - Adding question`);
    
    const surveyId = parseInt(req.params.id);
    const { question, question_type, options, is_required, display_order } = req.body;
    
    if (isNaN(surveyId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid survey ID'
      });
    }

    if (!question || !question_type) {
      return res.status(400).json({
        success: false,
        message: 'Question and question_type are required'
      });
    }

    // Check if survey exists
    const [existingSurveys] = await pool.execute(
      'SELECT id FROM survey_forms WHERE id = ?',
      [surveyId]
    );
    
    if (existingSurveys.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
      });
    }

    // Get next display order if not provided
    let nextOrder = display_order;
    if (!nextOrder) {
      const [orderResult] = await pool.execute(
        'SELECT COALESCE(MAX(display_order), 0) + 1 as next_order FROM survey_questions WHERE survey_form_id = ?',
        [surveyId]
      );
      nextOrder = orderResult[0].next_order;
    }

    // Handle options properly for JSON column
    const optionsValue = formatOptionsForStorage(options);

    // Insert question
    const [result] = await pool.execute(`
      INSERT INTO survey_questions (
        survey_form_id,
        question,
        question_type,
        options,
        is_required,
        display_order,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())
    `, [
      surveyId,
      question.trim(),
      question_type,
      optionsValue,
      is_required || 0,
      nextOrder
    ]);

    const questionId = result.insertId;

    // Fetch the created question
    const [createdQuestions] = await pool.execute(`
      SELECT 
        id,
        survey_form_id,
        question,
        question_type,
        options,
        is_required,
        display_order,
        created_at
      FROM survey_questions
      WHERE id = ?
    `, [questionId]);

    // Format options for display
    const formattedQuestion = {
      ...createdQuestions[0],
      options: formatOptionsForDisplay(createdQuestions[0].options)
    };

    console.log(`✅ Question ${questionId} added to survey ${surveyId} successfully`);

    res.status(201).json({
      success: true,
      message: 'Question added successfully',
      data: {
        question: formattedQuestion
      }
    });

  } catch (error) {
    console.error('❌ Error adding question:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add question',
      error: error.message
    });
  }
});

// PUT /api/surveys/:surveyId/questions/:questionId - Update question
router.put('/:surveyId/questions/:questionId', async (req, res) => {
  try {
    console.log(`📝 PUT /api/surveys/${req.params.surveyId}/questions/${req.params.questionId} - Updating question`);
    
    const surveyId = parseInt(req.params.surveyId);
    const questionId = parseInt(req.params.questionId);
    const { question, question_type, options, is_required, display_order } = req.body;
    
    if (isNaN(surveyId) || isNaN(questionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid survey ID or question ID'
      });
    }

    if (!question || !question_type) {
      return res.status(400).json({
        success: false,
        message: 'Question and question_type are required'
      });
    }

    // Check if question exists and belongs to the survey
    const [existingQuestions] = await pool.execute(
      'SELECT id FROM survey_questions WHERE id = ? AND survey_form_id = ?',
      [questionId, surveyId]
    );
    
    if (existingQuestions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Handle options properly for JSON column
    const optionsValue = formatOptionsForStorage(options);

    // Update question
    const [result] = await pool.execute(`
      UPDATE survey_questions 
      SET question = ?, question_type = ?, options = ?, is_required = ?, display_order = ?
      WHERE id = ? AND survey_form_id = ?
    `, [
      question.trim(),
      question_type,
      optionsValue,
      is_required || 0,
      display_order || 1,
      questionId,
      surveyId
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Fetch updated question
    const [updatedQuestions] = await pool.execute(`
      SELECT 
        id,
        survey_form_id,
        question,
        question_type,
        options,
        is_required,
        display_order,
        created_at
      FROM survey_questions
      WHERE id = ?
    `, [questionId]);

    // Format options for display
    const formattedQuestion = {
      ...updatedQuestions[0],
      options: formatOptionsForDisplay(updatedQuestions[0].options)
    };

    console.log(`✅ Question ${questionId} updated successfully`);

    res.json({
      success: true,
      message: 'Question updated successfully',
      data: {
        question: formattedQuestion
      }
    });

  } catch (error) {
    console.error('❌ Error updating question:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update question',
      error: error.message
    });
  }
});

// DELETE /api/surveys/:surveyId/questions/:questionId - Delete question
router.delete('/:surveyId/questions/:questionId', async (req, res) => {
  try {
    console.log(`🗑️ DELETE /api/surveys/${req.params.surveyId}/questions/${req.params.questionId} - Deleting question`);
    
    const surveyId = parseInt(req.params.surveyId);
    const questionId = parseInt(req.params.questionId);
    
    if (isNaN(surveyId) || isNaN(questionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid survey ID or question ID'
      });
    }

    // Check if question exists and belongs to the survey
    const [existingQuestions] = await pool.execute(
      'SELECT id FROM survey_questions WHERE id = ? AND survey_form_id = ?',
      [questionId, surveyId]
    );
    
    if (existingQuestions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Check if question has responses
    const [responseCheck] = await pool.execute(
      'SELECT COUNT(*) as response_count FROM survey_responses WHERE question_id = ?',
      [questionId]
    );

    if (responseCheck[0].response_count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete question that has responses.'
      });
    }

    // Delete question
    const [result] = await pool.execute(
      'DELETE FROM survey_questions WHERE id = ? AND survey_form_id = ?',
      [questionId, surveyId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    console.log(`✅ Question ${questionId} deleted successfully`);

    res.json({
      success: true,
      message: 'Question deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting question:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete question',
      error: error.message
    });
  }
});

// GET /api/surveys/:surveyId/questions/:questionId - Get single question
router.get('/:surveyId/questions/:questionId', async (req, res) => {
  try {
    console.log(`📥 GET /api/surveys/${req.params.surveyId}/questions/${req.params.questionId} - Fetching question`);
    
    const surveyId = parseInt(req.params.surveyId);
    const questionId = parseInt(req.params.questionId);
    
    if (isNaN(surveyId) || isNaN(questionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid survey ID or question ID'
      });
    }

    // Get question details
    const [questions] = await pool.execute(`
      SELECT 
        sq.id,
        sq.survey_form_id,
        sq.question,
        sq.question_type,
        sq.options,
        sq.is_required,
        sq.display_order,
        sq.created_at,
        sf.title as survey_title
      FROM survey_questions sq
      JOIN survey_forms sf ON sq.survey_form_id = sf.id
      WHERE sq.id = ? AND sq.survey_form_id = ?
    `, [questionId, surveyId]);
    
    if (questions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Format options for display
    const formattedQuestion = {
      ...questions[0],
      options: formatOptionsForDisplay(questions[0].options)
    };

    console.log(`✅ Question ${questionId} details fetched successfully`);

    res.json({
      success: true,
      data: {
        question: formattedQuestion
      }
    });
  } catch (error) {
    console.error('❌ Error fetching question details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch question details',
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