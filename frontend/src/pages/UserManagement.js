// pages/UserManagement.js - FIXED: Client-side filtering & table scroll + VIP Filter & VIP Dates
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, UserPlus, Search, Filter, Eye, Edit2, Trash2, 
  MoreHorizontal, X, TrendingUp, AlertCircle, Wifi, 
  ChevronLeft, ChevronRight, CreditCard, Activity, Crown, Calendar
} from 'lucide-react';
import ErrorState from '../components/common/ErrorState';
import '../styles/AdminStyles.css';

const UserManagement = () => {
  const navigate = useNavigate();
  
  // State management
  const [allUsers, setAllUsers] = useState([]); // FIXED: Store all users for client-side filtering
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [vipTypeFilter, setVipTypeFilter] = useState('all'); // NEW: VIP type filter
  const [usingStaticData, setUsingStaticData] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15); // FIXED: Increased from 10 to 15 to show more records

  // API configuration
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  });

  // Static fallback data - UPDATED: Added VIP fields and total_transactions
  const staticUsersData = {
    users: [
      {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone_number: '+1-555-123-4567',
        is_active: 1,
        is_vip: 1,
        vip_start_date: '2024-01-01',
        vip_end_date: '2025-12-31',
        available_cashback: 1250.00,
        total_cashback_earned: 2500.00,
        total_transactions: 15,
        created_at: '2024-01-15'
      },
      {
        id: 2,
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@example.com',
        phone_number: '+1-555-234-5678',
        is_active: 1,
        is_vip: 0,
        vip_start_date: null,
        vip_end_date: null,
        available_cashback: 890.50,
        total_cashback_earned: 1780.00,
        total_transactions: 8,
        created_at: '2024-02-20'
      },
      {
        id: 3,
        first_name: 'Mike',
        last_name: 'Johnson',
        email: 'mike.johnson@example.com',
        phone_number: '+1-555-345-6789',
        is_active: 1,
        is_vip: 1,
        vip_start_date: '2024-03-01',
        vip_end_date: '2024-03-31', // Expired VIP
        available_cashback: 2100.75,
        total_cashback_earned: 4200.00,
        total_transactions: 23,
        created_at: '2024-03-10'
      },
      {
        id: 4,
        first_name: 'Sarah',
        last_name: 'Wilson',
        email: 'sarah.wilson@example.com',
        phone_number: '+1-555-456-7890',
        is_active: 1,
        is_vip: 0,
        vip_start_date: null,
        vip_end_date: null,
        available_cashback: 567.25,
        total_cashback_earned: 1134.50,
        total_transactions: 5,
        created_at: '2024-04-05'
      },
      {
        id: 5,
        first_name: 'David',
        last_name: 'Brown',
        email: 'david.brown@example.com',
        phone_number: '+1-555-567-8901',
        is_active: 1,
        is_vip: 1,
        vip_start_date: '2025-01-01',
        vip_end_date: '2025-12-31', // Future VIP
        available_cashback: 1875.00,
        total_cashback_earned: 3750.00,
        total_transactions: 12,
        created_at: '2024-05-12'
      }
    ],
    stats: {
      totalUsers: 5,
      activeUsers: 5,
      vipUsers: 3,
      totalCashback: 6683.50,
      totalEarned: 13364.50,
      totalTransactions: 63
    }
  };

  // FIXED: Fetch all users once and filter client-side
  const fetchAllUsers = useCallback(async () => {
    try {
      setLoading(true);
      
      // Try to fetch from API with a large limit to get all users
      const params = new URLSearchParams({
        limit: '1000', // Get all users
        offset: '0',
        include_wallet: 'true',
        is_active: '1'
      });

      const possibleEndpoints = [
        `${API_BASE_URL}/users?${params}`,
        `${API_BASE_URL}/admin/users?${params}`,
        `/api/users?${params}`,
        `/users?${params}`
      ];

      let lastError = null;
      let userData = null;

      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`🔄 Trying users endpoint: ${endpoint}`);
          
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: getHeaders(),
            credentials: 'include'
          });

          if (response.ok) {
            const data = await response.json();
            console.log('✅ Users API Response:', data);
            userData = data;
            break;
          } else {
            const errorText = await response.text();
            console.warn(`⚠️ Users endpoint ${endpoint} failed:`, response.status, errorText);
            lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        } catch (err) {
          console.warn(`⚠️ Users endpoint ${endpoint} error:`, err.message);
          lastError = err;
          continue;
        }
      }

      if (!userData) {
        throw lastError || new Error('All users endpoints failed');
      }

      // Process and store all users
      const processedData = processUsersData(userData);
      setAllUsers(processedData.users || []);
      setUsingStaticData(false);
      setError(null);
      
      console.log('✅ All users data loaded successfully');

    } catch (error) {
      console.warn('⚠️ Users API failed, using static data:', error.message);
      
      // Use static data as fallback
      setAllUsers(staticUsersData.users);
      setUsingStaticData(true);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  // FIXED: Client-side filtering logic + VIP filter
  const filteredUsers = useMemo(() => {
    let filtered = [...allUsers];

    // Apply search filter
    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(user => {
        return (
          (user.first_name?.toLowerCase() || '').includes(searchLower) ||
          (user.last_name?.toLowerCase() || '').includes(searchLower) ||
          (user.email?.toLowerCase() || '').includes(searchLower) ||
          (user.phone_number || '').includes(searchTerm.trim())
        );
      });
    }

    // NEW: Apply VIP type filter
    if (vipTypeFilter !== 'all') {
      if (vipTypeFilter === 'vip') {
        filtered = filtered.filter(user => parseInt(user.is_vip) === 1);
      } else if (vipTypeFilter === 'non-vip') {
        filtered = filtered.filter(user => parseInt(user.is_vip) === 0);
      }
    }

    return filtered;
  }, [allUsers, searchTerm, vipTypeFilter]);

  // FIXED: Pagination logic using filtered data
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const totalUsers = filteredUsers.length;

  // Process users data
  const processUsersData = (rawData) => {
    let users = [];
    let pagination = { total: 0, totalPages: 1, currentPage: 1, itemsPerPage: 10 };
    let stats = { totalUsers: 0, activeUsers: 0, vipUsers: 0, totalCashback: 0, totalEarned: 0, totalTransactions: 0 };

    try {
      if (rawData.success && rawData.data) {
        users = rawData.data.users || rawData.data || [];
        pagination = rawData.data.pagination || rawData.pagination || pagination;
        stats = rawData.data.stats || rawData.stats || stats;
      } else if (Array.isArray(rawData)) {
        users = rawData;
      } else if (rawData.users) {
        users = rawData.users;
        pagination = rawData.pagination || pagination;
      }

      if (!Array.isArray(users)) {
        users = [];
      }

      if (users.length > 0 && stats.totalUsers === 0) {
        stats.totalUsers = pagination.total || users.length;
        stats.activeUsers = users.filter(u => u.is_active === 1).length;
        stats.vipUsers = users.filter(u => u.is_vip === 1).length;
        stats.totalCashback = users.reduce((sum, u) => sum + (parseFloat(u.available_cashback) || 0), 0);
        stats.totalEarned = users.reduce((sum, u) => sum + (parseFloat(u.total_cashback_earned) || 0), 0);
        // ADDED: Calculate total transactions
        stats.totalTransactions = users.reduce((sum, u) => sum + (parseInt(u.total_transactions) || 0), 0);
      }

      return { users, pagination, stats };
    } catch (error) {
      console.error('Error processing users data:', error);
      return { users: [], pagination, stats };
    }
  };

  // Initial load
  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  // FIXED: Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, vipTypeFilter]);

  // Helper functions
  const formatCurrency = (amount) => {
    const num = parseFloat(amount) || 0;
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatNumber = (value) => {
    const num = parseFloat(value) || 0;
    if (num >= 10000000) return `${(num / 10000000).toFixed(1)}Cr`;
    if (num >= 100000) return `${(num / 100000).toFixed(1)}L`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const getUserInitials = (user) => {
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || '??';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  // NEW: VIP Helper Functions
  const isVipExpired = (expiryDate) => {
    if (!expiryDate) return false;
    try {
      const expiry = new Date(expiryDate);
      const today = new Date();
      return expiry < today;
    } catch {
      return false;
    }
  };

  const isVipUpcoming = (startDate) => {
    if (!startDate) return false;
    try {
      const start = new Date(startDate);
      const today = new Date();
      return start > today;
    } catch {
      return false;
    }
  };

  // Delete user (set is_active = 0)
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to deactivate this user? This will set their status to inactive.')) {
      return;
    }

    try {
      const deleteEndpoints = [
        `${API_BASE_URL}/users/${userId}`,
        `${API_BASE_URL}/admin/users/${userId}`,
        `/api/users/${userId}`
      ];

      let deleted = false;
      for (const endpoint of deleteEndpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'PATCH',
            headers: getHeaders(),
            credentials: 'include',
            body: JSON.stringify({ is_active: 0 })
          });

          if (response.ok) {
            deleted = true;
            break;
          }
        } catch (err) {
          continue;
        }
      }

      if (deleted) {
        // FIXED: Refresh all users data after deletion
        await fetchAllUsers();
        alert('User deactivated successfully');
      } else {
        throw new Error('Deactivation failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to deactivate user. Please try again.');
    }
  };

  // NEW: Handle row click to navigate to user details
  const handleRowClick = (userId, event) => {
    // Don't navigate if clicking on action buttons
    if (event.target.closest('.action-buttons')) {
      return;
    }
    navigate(`/users/${userId}`);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Calculate stats from current users
  const currentStats = useMemo(() => {
    const totalCashback = allUsers.reduce((sum, u) => sum + (parseFloat(u.available_cashback) || 0), 0);
    const totalEarned = allUsers.reduce((sum, u) => sum + (parseFloat(u.total_cashback_earned) || 0), 0);
    const totalTransactions = allUsers.reduce((sum, u) => sum + (parseInt(u.total_transactions) || 0), 0);
    
    return {
      totalUsers: allUsers.length,
      activeUsers: allUsers.filter(u => u.is_active === 1).length,
      vipUsers: allUsers.filter(u => u.is_vip === 1).length,
      totalCashback,
      totalEarned,
      totalTransactions
    };
  }, [allUsers]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  if (error && !usingStaticData) {
    return <ErrorState message={`Failed to load users: ${error}`} />;
  }

  return (
    <div className="page-container">
      {/* NEW: Stats Grid - Added VIP Users stats */}
      <div className="stats-grid" style={{marginBottom: 'var(--spacing-lg)'}}>
        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{formatNumber(currentStats.totalUsers)}</div>
            <div className="stats-label">Total Users</div>
          </div>
          <div className="stats-icon">
            <Users />
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{formatNumber(currentStats.vipUsers)}</div>
            <div className="stats-label">VIP Users</div>
          </div>
          <div className="stats-icon warning">
            <Crown />
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{formatCurrency(currentStats.totalCashback)}</div>
            <div className="stats-label">Available Cashback</div>
          </div>
          <div className="stats-icon success">
            <CreditCard />
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{formatCurrency(currentStats.totalEarned)}</div>
            <div className="stats-label">Total Earned</div>
          </div>
          <div className="stats-icon info">
            <TrendingUp />
          </div>
        </div>

        {/* NEW: Total Transactions Box */}
        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{formatNumber(currentStats.totalTransactions)}</div>
            <div className="stats-label">Total Transactions</div>
          </div>
          <div className="stats-icon warning">
            <Activity />
          </div>
        </div>
      </div>

      {/* FIXED: Table Container with search and VIP filter in header */}
      <div className="table-container">
        <div className="table-header">
          <div className="table-header-left">
            <h3 className="table-title">
              Users ({totalUsers.toLocaleString()})
            </h3>
            <div style={{display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center'}}>
              {/* Search Bar */}
              <div className="table-search">
                <Search className="search-input-icon" />
                <input
                  type="text"
                  placeholder="Search by name, email, phone..."
                  className="table-search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {/* NEW: VIP Type Filter */}
              <div className="filter-dropdown">
                <select
                  value={vipTypeFilter}
                  onChange={(e) => setVipTypeFilter(e.target.value)}
                  className="form-input"
                  style={{
                    minWidth: '140px',
                    padding: '0.5rem 2rem 0.5rem 0.75rem',
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="all">All Users</option>
                  <option value="vip">VIP</option>
                  <option value="non-vip">Non-VIP</option>
                </select>
              </div>
            </div>
          </div>
          <div className="table-actions">
            <button 
              className="add-user-btn"
              onClick={() => navigate('/users/add')}
            >
              <UserPlus size={16} />
              Add New User
            </button>
          </div>
        </div>

        {paginatedUsers.length === 0 ? (
          <div className="empty-state">
            <Users className="empty-state-icon" />
            <h3 className="empty-state-title">No users found</h3>
            <p className="empty-state-description">
              {searchTerm || vipTypeFilter !== 'all'
                ? 'Try adjusting your search criteria or filters'
                : 'No active users found'
              }
            </p>
          </div>
        ) : (
          <div className="table-scroll-container">
            <table className="data-table">
              <thead className="table-sticky-header">
                <tr>
                  <th style={{width: '80px', padding: 'var(--spacing-lg)'}}>ID</th>
                  <th style={{padding: 'var(--spacing-lg)'}}>User Details</th>
                  <th style={{width: '150px', padding: 'var(--spacing-lg)'}}>Phone</th>
                  <th style={{width: '130px', padding: 'var(--spacing-lg)'}}>Available Cashback</th>
                  <th style={{width: '130px', padding: 'var(--spacing-lg)'}}>Total Earned</th>
                  <th style={{width: '110px', padding: 'var(--spacing-lg)'}}>Total Transactions</th>
                  <th style={{width: '120px', padding: 'var(--spacing-lg)'}}>VIP Status</th>
                  <th style={{width: '110px', padding: 'var(--spacing-lg)'}}>Join Date</th>
                  <th style={{width: '140px', textAlign: 'center', padding: 'var(--spacing-lg)'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => (
                  <tr 
                    key={user.id} 
                    style={{height: '64px', cursor: 'pointer'}}
                    onClick={(e) => handleRowClick(user.id, e)}
                    className="user-row-clickable"
                  >
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <span className="font-medium" style={{color: 'var(--text-secondary)'}}>
                        #{user.id}
                      </span>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <div className="user-cell">
                        <div className="user-avatar">
                          {getUserInitials(user)}
                        </div>
                        <div>
                          <div className="user-name">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="user-email">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <span className="font-medium">{user.phone_number}</span>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <span className="cashback-amount success">
                        {formatCurrency(user.available_cashback)}
                      </span>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <span className="cashback-amount info">
                        {formatCurrency(user.total_cashback_earned)}
                      </span>
                    </td>
                    {/* NEW: Total Transactions Column */}
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <span className="transaction-count">
                        {formatNumber(user.total_transactions || 0)}
                      </span>
                    </td>
                    {/* NEW: VIP Status Column (like Contract in Stores) */}
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <div style={{fontSize: '0.75rem', textAlign: 'center'}}>
                        {parseInt(user.is_vip) === 1 ? (
                          user.vip_start_date && user.vip_end_date ? (
                            <div>
                              <div style={{color: 'var(--text-secondary)', marginBottom: '2px'}}>
                                {formatDate(user.vip_start_date)}
                              </div>
                              <div style={{color: 'var(--text-disabled)', fontSize: '0.7rem', marginBottom: '2px'}}>
                                to
                              </div>
                              <div style={{
                                color: isVipExpired(user.vip_end_date) ? 'var(--error-text)' : 
                                       isVipUpcoming(user.vip_start_date) ? 'var(--info-text)' : 'var(--success-text)',
                                background: isVipExpired(user.vip_end_date) ? 'var(--error-bg)' : 
                                           isVipUpcoming(user.vip_start_date) ? 'var(--info-bg)' : 'var(--success-bg)',
                                padding: '2px 4px',
                                borderRadius: '4px',
                                fontWeight: '500',
                                display: 'inline-block'
                              }}>
                                {formatDate(user.vip_end_date)}
                              </div>
                            </div>
                          ) : user.vip_start_date ? (
                            <div style={{color: 'var(--text-secondary)'}}>
                              {formatDate(user.vip_start_date)}
                            </div>
                          ) : user.vip_end_date ? (
                            <div style={{
                              color: isVipExpired(user.vip_end_date) ? 'var(--error-text)' : 'var(--success-text)',
                              background: isVipExpired(user.vip_end_date) ? 'var(--error-bg)' : 'var(--success-bg)',
                              padding: '2px 4px',
                              borderRadius: '4px',
                              fontWeight: '500',
                              display: 'inline-block'
                            }}>
                              {formatDate(user.vip_end_date)}
                            </div>
                          ) : (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                              color: 'white',
                              padding: '4px 8px',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: '500',
                              justifyContent: 'center'
                            }}>
                              <Crown size={12} />
                              <span>VIP</span>
                            </div>
                          )
                        ) : (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            background: 'var(--bg-glass)',
                            color: 'var(--text-secondary)',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            border: '1px solid var(--border-glass)',
                            justifyContent: 'center'
                          }}>
                            <Users size={12} />
                            <span>Regular</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <span className="date-cell">{formatDate(user.created_at)}</span>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)', textAlign: 'center'}}>
                      <div className="action-buttons">
                        <button 
                          className="action-btn view"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/users/${user.id}`);
                          }}
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          className="action-btn edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/users/${user.id}/edit`);
                          }}
                          title="Edit User"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          className="action-btn delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteUser(user.id);
                          }}
                          title="Deactivate User"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* FIXED: Always show pagination */}
        <div className="pagination-container">
          <div className="pagination-info">
            <span>
              Showing {Math.min(((currentPage - 1) * itemsPerPage) + 1, totalUsers)} to {Math.min(currentPage * itemsPerPage, totalUsers)} of {totalUsers} users
            </span>
          </div>
          <div className="pagination-controls">
            <button 
              className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
            </button>
            
            {totalPages > 1 ? (
              // Multiple pages - show page numbers
              [...Array(Math.min(5, totalPages))].map((_, index) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = index + 1;
                } else if (currentPage <= 3) {
                  pageNum = index + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + index;
                } else {
                  pageNum = currentPage - 2 + index;
                }
                
                return (
                  <button 
                    key={pageNum}
                    className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })
            ) : (
              // Single page - show page 1
              <button className="pagination-btn active">
                1
              </button>
            )}
            
            <button 
              className={`pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* FIXED: Reduced bottom spacing */}
      <div style={{height: '16px'}}></div>
    </div>
  );
};

export default UserManagement;