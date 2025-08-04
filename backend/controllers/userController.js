const User = require('../models/User');

const userController = {
  // Get all users with pagination and search
  async getUsers(req, res) {
    try {
      const { search = '', page = 1, limit = 10 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      console.log(`Getting users - Page: ${page}, Limit: ${limit}, Search: ${search}`);

      const users = await User.findAll(search, limit, offset);
      const totalUsers = await User.countAll(search);
      const totalPages = Math.ceil(totalUsers / parseInt(limit));

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalUsers,
            hasNext: parseInt(page) < totalPages,
            hasPrev: parseInt(page) > 1
          }
        }
      });

    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching users'
      });
    }
  },

  // Get single user
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      console.log(`Getting user by ID: ${id}`);

      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user
      });

    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching user'
      });
    }
  },

  // Create new user
  async createUser(req, res) {
    try {
      const { phone_number, first_name, last_name, email } = req.body;

      console.log('Creating user:', { phone_number, first_name, last_name, email });

      // Validation
      if (!phone_number || !first_name || !last_name || !email) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required: phone_number, first_name, last_name, email'
        });
      }

      // Check if user already exists by email
      const existingUserByEmail = await User.findByEmail(email);
      if (existingUserByEmail) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      // Check if user already exists by phone
      const existingUserByPhone = await User.findByPhone(phone_number);
      if (existingUserByPhone) {
        return res.status(400).json({
          success: false,
          message: 'User with this phone number already exists'
        });
      }

      // Generate referral code
      const referral_code = await User.generateReferralCode();

      // Create user
      const userId = await User.create({
        phone_number,
        first_name,
        last_name,
        email,
        referral_code
      });

      const newUser = await User.findById(userId);

      console.log('User created successfully:', newUser);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: newUser
      });

    } catch (error) {
      console.error('Create user error:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          message: 'Phone number or email already exists'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error creating user'
      });
    }
  },

  // Update user
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { phone_number, first_name, last_name, email, is_email_verified, is_phone_verified } = req.body;

      console.log(`Updating user ${id}:`, { phone_number, first_name, last_name, email, is_email_verified, is_phone_verified });

      // Check if user exists
      const existingUser = await User.findById(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if email is being changed and if new email already exists
      if (email !== existingUser.email) {
        const existingUserByEmail = await User.findByEmail(email);
        if (existingUserByEmail && existingUserByEmail.id !== parseInt(id)) {
          return res.status(400).json({
            success: false,
            message: 'Another user with this email already exists'
          });
        }
      }

      // Check if phone is being changed and if new phone already exists
      if (phone_number !== existingUser.phone_number) {
        const existingUserByPhone = await User.findByPhone(phone_number);
        if (existingUserByPhone && existingUserByPhone.id !== parseInt(id)) {
          return res.status(400).json({
            success: false,
            message: 'Another user with this phone number already exists'
          });
        }
      }

      // Update user
      await User.update(id, {
        phone_number,
        first_name,
        last_name,
        email,
        is_email_verified: is_email_verified ? 1 : 0,
        is_phone_verified: is_phone_verified ? 1 : 0
      });

      const updatedUser = await User.findById(id);

      console.log('User updated successfully:', updatedUser);

      res.json({
        success: true,
        message: 'User updated successfully',
        data: updatedUser
      });

    } catch (error) {
      console.error('Update user error:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          message: 'Phone number or email already exists'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error updating user'
      });
    }
  },

  // Delete user (soft delete)
  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      console.log(`Deleting user: ${id}`);

      // Check if user exists
      const existingUser = await User.findById(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Soft delete user
      await User.delete(id);

      console.log(`User ${id} deleted successfully`);

      res.json({
        success: true,
        message: 'User deleted successfully'
      });

    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting user'
      });
    }
  },

  // Export users to CSV
  async exportUsers(req, res) {
    try {
      const { search = '' } = req.query;
      
      console.log(`Exporting users with search: ${search}`);

      const users = await User.findAll(search, 10000, 0); // Get all matching users

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No users found to export'
        });
      }

      // Convert to CSV format
      const csvHeader = 'ID,Phone Number,First Name,Last Name,Email,Referral Code,Email Verified,Phone Verified,Created At\n';
      
      const csvRows = users.map(user => {
        return [
          user.id,
          user.phone_number,
          `"${user.first_name}"`,
          `"${user.last_name}"`,
          user.email,
          user.referral_code,
          user.is_email_verified ? 'Yes' : 'No',
          user.is_phone_verified ? 'Yes' : 'No',
          new Date(user.created_at).toISOString().split('T')[0]
        ].join(',');
      }).join('\n');

      const csv = csvHeader + csvRows;

      res.setHeader('Content-disposition', 'attachment; filename=users.csv');
      res.set('Content-Type', 'text/csv');
      res.send(csv);

      console.log(`Exported ${users.length} users to CSV`);

    } catch (error) {
      console.error('Export users error:', error);
      res.status(500).json({
        success: false,
        message: 'Error exporting users'
      });
    }
  },

  // Get user statistics for dashboard
  async getUserStats(req, res) {
    try {
      console.log('Getting user statistics');

      const stats = await User.getStats();

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching user statistics'
      });
    }
  }
};

module.exports = userController;