// utils/apiUtils.js - API Utility Functions
import { API_CONFIG } from '../config/apiConfig';

// Generic API request function with error handling and retry
export const apiRequest = async (url, options = {}, retryCount = 0) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...API_CONFIG.getHeaders(),
        ...options.headers
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Retry logic for network errors
    if (retryCount < API_CONFIG.RETRY.attempts && 
        (error.name === 'AbortError' || error.name === 'TypeError')) {
      console.warn(`API request failed, retrying... (${retryCount + 1}/${API_CONFIG.RETRY.attempts})`);
      await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY.delay * (retryCount + 1)));
      return apiRequest(url, options, retryCount + 1);
    }
    
    throw error;
  }
};

// Specific API functions
export const userAPI = {
  // Get all users with pagination and filters
  getUsers: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USERS}${queryString ? `?${queryString}` : ''}`;
    return apiRequest(url);
  },

  // Get user by ID
  getUserById: async (id) => {
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER_BY_ID(id)}`;
    return apiRequest(url);
  },

  // Create new user
  createUser: async (userData) => {
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USERS}`;
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  // Update user
  updateUser: async (id, userData) => {
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER_BY_ID(id)}`;
    return apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  },

  // Update user status
  updateUserStatus: async (id, status) => {
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER_BY_ID(id)}`;
    return apiRequest(url, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  // Delete user
  deleteUser: async (id) => {
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER_BY_ID(id)}`;
    return apiRequest(url, {
      method: 'DELETE'
    });
  },

  // Get user statistics
  getUserStats: async () => {
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER_STATS}`;
    return apiRequest(url);
  },

  // Export users
  exportUsers: async (format = 'csv') => {
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER_EXPORT}?format=${format}`;
    const response = await fetch(url, {
      headers: API_CONFIG.getHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Export failed');
    }
    
    return response.blob();
  }
};