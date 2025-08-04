// models/Admin.js - Fixed Version
const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class Admin {
  static async createAdminsTable() {
    try {
      console.log('👤 Setting up admin table...');
      
      // Check if table exists (simpler query)
      const [tables] = await pool.execute("SHOW TABLES LIKE 'admins'");

      if (tables.length > 0) {
        console.log('✅ Admins table already exists');
        
        // Check if there's at least one admin
        const [admins] = await pool.execute('SELECT COUNT(*) as count FROM admins');
        const adminCount = admins[0].count;
        
        if (adminCount === 0) {
          // Create default admin with your table structure
          const hashedPassword = await bcrypt.hash('admin123', 12);
          await pool.execute(
            `INSERT INTO admins (firstName, lastName, email, password, role, status) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            ['Admin', 'User', 'admin@slashapp.com', hashedPassword, 'super_admin', 'active']
          );
          console.log('✅ Default admin created');
          console.log('📧 Email: admin@slashapp.com');
          console.log('🔑 Password: admin123');
        } else {
          console.log(`✅ Found ${adminCount} existing admin(s)`);
        }
      } else {
        console.log('❌ Admins table does not exist. Please run your SQL files first.');
        console.log('💡 Run: node scripts/setup-database.js');
      }
    } catch (error) {
      console.error('❌ Error setting up admins table:', error.message);
      // Don't throw error, just log it so server can continue
    }
  }

  static async findByEmail(email) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM admins WHERE email = ? AND status = ?', 
        [email, 'active']
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Keep the old method for backward compatibility but use email
  static async findByUsername(username) {
    // Since your table doesn't have username, we'll use email
    return await this.findByEmail(username);
  }

  static async validatePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updateLastLogin(adminId) {
    try {
      await pool.execute(
        'UPDATE admins SET lastLoginAt = NOW() WHERE id = ?',
        [adminId]
      );
    } catch (error) {
      console.error('Error updating last login:', error.message);
      // Don't throw error for this non-critical operation
    }
  }
}

module.exports = Admin;