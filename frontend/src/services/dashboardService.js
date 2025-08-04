import api from './apiService';

export const dashboardService = {
  // Get dashboard overview stats
  getDashboardStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  // Get recent activities
  getRecentActivities: async (limit = 10) => {
    const response = await api.get('/dashboard/activities', {
      params: { limit }
    });
    return response.data;
  },

  // Get chart data for dashboard
  getChartData: async (type = 'revenue', period = 'month') => {
    const response = await api.get('/dashboard/charts', {
      params: { type, period }
    });
    return response.data;
  },

  // Get top performing stores
  getTopStores: async (limit = 5) => {
    const response = await api.get('/dashboard/top-stores', {
      params: { limit }
    });
    return response.data;
  },

  // Get user growth analytics
  getUserGrowthAnalytics: async (period = '6months') => {
    const response = await api.get('/dashboard/user-growth', {
      params: { period }
    });
    return response.data;
  },

  // Get transaction trends
  getTransactionTrends: async (period = '30days') => {
    const response = await api.get('/dashboard/transaction-trends', {
      params: { period }
    });
    return response.data;
  },

  // Get revenue analytics
  getRevenueAnalytics: async (period = 'month') => {
    const response = await api.get('/dashboard/revenue', {
      params: { period }
    });
    return response.data;
  },
};