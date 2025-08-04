// Basic auth service
export const authService = {
  // Mock login function
  login: async (credentials) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (credentials.username === 'admin@slashapp.com' && credentials.password === 'admin123') {
      return {
        success: true,
        token: 'mock-jwt-token',
        admin: {
          id: 1,
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@slashapp.com',
          role: 'super_admin',
          status: 'active'
        }
      };
    }
    
    return {
      success: false,
      message: 'Invalid credentials'
    };
  },

  // Mock verify token
  verifyToken: async () => {
    return {
      success: true,
      admin: {
        id: 1,
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@slashapp.com',
        role: 'super_admin',
        status: 'active'
      }
    };
  },
};