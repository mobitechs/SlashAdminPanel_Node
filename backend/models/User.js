// models/User.js - ULTRA SIMPLE VERSION (NO PARAMETERS)
const { pool } = require('../config/database');

class User {
  static async getAll(filters = {}) {
    try {
      console.log('User.getAll called with filters:', filters);
      
      // SUPER SIMPLE query with NO parameters first
      const simpleQuery = `
        SELECT 
          u.id,
          u.first_name,
          u.last_name,
          u.email,
          u.phone_number,
          u.created_at,
          u.is_email_verified,
          u.is_phone_verified
        FROM users u
        WHERE u.deleted_at IS NULL
        ORDER BY u.created_at DESC
        LIMIT 10
      `;
      
      console.log('Executing simple query...');
      const [rows] = await pool.execute(simpleQuery);
      console.log('Query successful, rows:', rows.length);
      
      // Simple count query
      const [countResult] = await pool.execute('SELECT COUNT(*) as total FROM users WHERE deleted_at IS NULL');
      
      return {
        users: rows,
        total: countResult[0].total,
        pagination: {
          page: 1,
          limit: 10,
          totalPages: Math.ceil(countResult[0].total / 10)
        }
      };
    } catch (error) {
      console.error('User.getAll error:', error);
      throw error;
    }
  }

  static async getAnalytics() {
    try {
      const [stats] = await pool.execute(`
        SELECT 
          COUNT(*) as total_users
        FROM users 
        WHERE deleted_at IS NULL
      `);
      
      return {
        total_users: parseInt(stats[0].total_users) || 0,
        verified_users: 0,
        new_users_30_days: 0,
        new_users_7_days: 0
      };
    } catch (error) {
      console.error('User.getAnalytics error:', error);
      throw error;
    }
  }

static async update(id, userData) {
  try {
    const { pool } = require('../config/database');
    
    // Build dynamic update query
    const fields = [];
    const values = [];
    
    const allowedFields = [
      'first_name', 'last_name', 'email', 'phone_number', 
      'address', 'date_of_birth', 'is_active', 
      'is_email_verified', 'is_phone_verified'
    ];
    
    allowedFields.forEach(field => {
      if (userData[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(userData[field]);
      }
    });
    
    // Handle password separately (hash it if provided)
    if (userData.password) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      fields.push('password = ?');
      values.push(hashedPassword);
    }
    
    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }
    
    // Add updated_at
    fields.push('updated_at = NOW()');
    values.push(id);
    
    const query = `
      UPDATE users 
      SET ${fields.join(', ')} 
      WHERE id = ? AND deleted_at IS NULL
    `;
    
    const [result] = await pool.execute(query, values);
    
    if (result.affectedRows === 0) {
      return null;
    }
    
    // Return updated user
    return await this.getById(id);
  } catch (error) {
    throw error;
  }
}

static async updateStatus(id, isActive) {
  try {
    const { pool } = require('../config/database');
    
    const [result] = await pool.execute(
      'UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ? AND deleted_at IS NULL',
      [isActive ? 1 : 0, id]
    );
    
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
}

static async softDelete(id) {
  try {
    const { pool } = require('../config/database');
    
    const [result] = await pool.execute(
      'UPDATE users SET deleted_at = NOW(), is_active = 0 WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
}

static async create(userData) {
  try {
    const { pool } = require('../config/database');
    
    // Hash password if provided
    let hashedPassword = null;
    if (userData.password) {
      const bcrypt = require('bcryptjs');
      hashedPassword = await bcrypt.hash(userData.password, 10);
    }
    
    const [result] = await pool.execute(`
      INSERT INTO users (
        first_name, last_name, email, phone_number, address, 
        date_of_birth, password, is_active, is_email_verified, 
        is_phone_verified, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      userData.first_name,
      userData.last_name,
      userData.email,
      userData.phone_number || null,
      userData.address || null,
      userData.date_of_birth || null,
      hashedPassword,
      userData.is_active !== undefined ? userData.is_active : 1,
      userData.is_email_verified || 0,
      userData.is_phone_verified || 0
    ]);
    
    // Return the created user
    return await this.getById(result.insertId);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new Error('Email already exists');
    }
    throw error;
  }
}

}


module.exports = User;