const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
require('dotenv').config();

const authController = {
  // Login admin
  async login(req, res) {
    try {
      const { username, password } = req.body; // We'll treat username as email

      console.log('Login attempt for email:', username);

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      // Find admin by email (using username field as email)
      const admin = await Admin.findByEmail(username);
      if (!admin) {
        console.log('Admin not found for email:', username);
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Validate password
      const isPasswordValid = await Admin.validatePassword(password, admin.password);
      if (!isPasswordValid) {
        console.log('Invalid password for email:', username);
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          adminId: admin.id, 
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          role: admin.role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      console.log('Login successful for email:', username);

      res.json({
        success: true,
        message: 'Login successful',
        token,
        admin: {
          id: admin.id,
          firstName: admin.firstName,
          lastName: admin.lastName,
          email: admin.email,
          role: admin.role,
          status: admin.status
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Verify token
  async verifyToken(req, res) {
    res.json({
      success: true,
      message: 'Token is valid',
      admin: req.admin
    });
  }
};

module.exports = authController;