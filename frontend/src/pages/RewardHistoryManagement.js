// pages/RewardHistoryManagement.js - FIXED VERSION
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  History, Search, Filter, Eye, MoreHorizontal, X, 
  TrendingUp, AlertCircle, Wifi, ChevronLeft, ChevronRight, 
  Award, Activity, Clock, Target, Users, DollarSign,
  Calendar, User, Store, Receipt
} from 'lucide-react';
import ErrorState from '../components/common/ErrorState';
import '../styles/AdminStyles.css';

const RewardHistoryManagement = () => {
  const navigate = useNavigate();
  
  // State management
  const [allHistory, setAllHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [creditDebitFilter, setCreditDebitFilter] = useState('');
  const [rewardTypeFilter, setRewardTypeFilter] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);

  // API configuration
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  });

  // Fetch all reward history once and filter client-side
  const fetchAllRewardHistory = useCallback(async () => {
    try {
      setLoading(true);
      
      // Try to fetch from API with a large limit to get all history
      const params = new URLSearchParams({
        limit: '1000',
        offset: '0'
      });

      const possibleEndpoints = [
        `${API_BASE_URL}/reward-history?${params}`,
        `${API_BASE_URL}/admin/reward-history?${params}`,
        `/api/reward-history?${params}`,
        `/reward-history?${params}`
      ];

      let lastError = null;
      let historyData = null;

      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`🔄 Trying reward history endpoint: ${endpoint}`);
          
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: getHeaders(),
            credentials: 'include'
          });

          if (response.ok) {
            const data = await response.json();
            console.log('✅ Reward History API Response:', data);
            historyData = data;
            break;
          } else {
            const errorText = await response.text();
            console.warn(`⚠️ Reward history endpoint ${endpoint} failed:`, response.status, errorText);
            lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        } catch (err) {
          console.warn(`⚠️ Reward history endpoint ${endpoint} error:`, err.message);
          lastError = err;
          continue;
        }
      }

      if (!historyData) {
        throw lastError || new Error('All reward history endpoints failed');
      }

      // Process and store all history
      const processedData = processHistoryData(historyData);
      setAllHistory(processedData.history || []);
      setError(null);
      
      console.log('✅ All reward history data loaded successfully');

    } catch (error) {
      console.warn('⚠️ Reward History API failed:', error.message);
      
      // Set empty data instead of static data
      setAllHistory([]);
      setError(`Failed to load reward history: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  // Client-side filtering logic
  const filteredHistory = useMemo(() => {
    let filtered = [...allHistory];

    // Apply search filter
    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(item => {
        return (
          (item.user_name?.toLowerCase() || '').includes(searchLower) ||
          (item.user_email?.toLowerCase() || '').includes(searchLower) ||
          (item.reward_name?.toLowerCase() || '').includes(searchLower) ||
          (item.store_name?.toLowerCase() || '').includes(searchLower) ||
          (item.transaction_number?.toLowerCase() || '').includes(searchLower) ||
          (item.description?.toLowerCase() || '').includes(searchLower)
        );
      });
    }

    // Apply credit/debit filter
    if (creditDebitFilter) {
      filtered = filtered.filter(item => item.credit_debit === creditDebitFilter);
    }

    // Apply reward type filter - Use reward_name
    if (rewardTypeFilter) {
      filtered = filtered.filter(item => item.reward_name === rewardTypeFilter);
    }

    // Apply date range filter
    if (dateRangeFilter) {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateRangeFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          return filtered;
      }
      
      filtered = filtered.filter(item => new Date(item.created_at) >= filterDate);
    }

    return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [allHistory, searchTerm, creditDebitFilter, rewardTypeFilter, dateRangeFilter]);

  // Pagination logic using filtered data
  const paginatedHistory = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredHistory.slice(startIndex, endIndex);
  }, [filteredHistory, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const totalHistory = filteredHistory.length;

  // Process history data
  const processHistoryData = (rawData) => {
    let history = [];
    let pagination = { total: 0, totalPages: 1, currentPage: 1, itemsPerPage: 10 };
    let stats = { totalHistory: 0, totalCredits: 0, totalDebits: 0, uniqueUsers: 0 };

    try {
      if (rawData.success && rawData.data) {
        history = rawData.data.history || rawData.data || [];
        pagination = rawData.data.pagination || rawData.pagination || pagination;
        stats = rawData.data.stats || rawData.stats || stats;
      } else if (Array.isArray(rawData)) {
        history = rawData;
      } else if (rawData.history) {
        history = rawData.history;
        pagination = rawData.pagination || pagination;
      }

      if (!Array.isArray(history)) {
        history = [];
      }

      // Calculate stats if not provided
      if (history.length > 0 && stats.totalHistory === 0) {
        stats.totalHistory = history.length;
        stats.totalCredits = history
          .filter(h => h.credit_debit === 'credit')
          .reduce((sum, h) => sum + (parseFloat(h.amount) || 0), 0);
        stats.totalDebits = history
          .filter(h => h.credit_debit === 'debit')
          .reduce((sum, h) => sum + (parseFloat(h.amount) || 0), 0);
        stats.uniqueUsers = new Set(history.map(h => h.user_id)).size;
      }

      return { history, pagination, stats };
    } catch (error) {
      console.error('Error processing history data:', error);
      return { history: [], pagination, stats };
    }
  };

  // Initial load
  useEffect(() => {
    fetchAllRewardHistory();
  }, [fetchAllRewardHistory]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, creditDebitFilter, rewardTypeFilter, dateRangeFilter]);

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

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  // FIXED: Function to get reward type display name
  const getRewardTypeDisplay = (history) => {
    // Use reward_name from the JOIN with reward_types table
    if (history.reward_name) {
      return history.reward_name;
    }
    
    // Fallback for cases where JOIN didn't work or reward_name is null
    return `Reward ID: ${history.reward_type}`;
  };

  const getUserInitials = (history) => {
    if (history.user_name) {
      const names = history.user_name.split(' ');
      return names.map(name => name.charAt(0)).join('').toUpperCase();
    }
    return history.user_email?.substring(0, 2).toUpperCase() || '??';
  };

  // Handle row click to navigate to history details
  const handleRowClick = (historyId, event) => {
    if (event.target.closest('.action-buttons')) {
      return;
    }
    navigate(`/reward-history/${historyId}`);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Calculate stats from current history
  const currentStats = useMemo(() => {
    const totalCredits = allHistory
      .filter(h => h.credit_debit === 'credit')
      .reduce((sum, h) => sum + (parseFloat(h.amount) || 0), 0);
    
    const totalDebits = allHistory
      .filter(h => h.credit_debit === 'debit')
      .reduce((sum, h) => sum + (parseFloat(h.amount) || 0), 0);
    
    const uniqueUsers = new Set(allHistory.map(h => h.user_id)).size;
    
    return {
      totalHistory: allHistory.length,
      totalCredits,
      totalDebits,
      uniqueUsers
    };
  }, [allHistory]);

  // Get unique values for filters - Use reward_name from JOIN
  const uniqueRewardTypes = useMemo(() => {
    const types = [...new Set(allHistory
      .map(h => h.reward_name)
      .filter(Boolean)
    )];
    return types.sort();
  }, [allHistory]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading reward history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={`Failed to load reward history: ${error}`} />;
  }

  return (
    <div className="page-container">
      {/* Stats Grid */}
      <div className="stats-grid" style={{marginBottom: 'var(--spacing-lg)'}}>
        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{formatNumber(currentStats.totalHistory)}</div>
            <div className="stats-label">Total Records</div>
          </div>
          <div className="stats-icon">
            <History />
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{formatCurrency(currentStats.totalCredits)}</div>
            <div className="stats-label">Total Credits</div>
          </div>
          <div className="stats-icon success">
            <TrendingUp />
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{formatCurrency(currentStats.totalDebits)}</div>
            <div className="stats-label">Total Debits</div>
          </div>
          <div className="stats-icon error">
            <Activity />
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{formatNumber(currentStats.uniqueUsers)}</div>
            <div className="stats-label">Unique Users</div>
          </div>
          <div className="stats-icon info">
            <Users />
          </div>
        </div>
      </div>

      {/* Table Container with filters and search */}
      <div className="table-container">
        <div className="table-header">
          <div className="table-header-left">
            <h3 className="table-title">
              Reward History ({totalHistory.toLocaleString()})
            </h3>
            <div style={{display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center'}}>
              <div className="table-search">
                <Search className="search-input-icon" />
                <input
                  type="text"
                  placeholder="Search by user, store, transaction..."
                  className="table-search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {/* Filters */}
              <select 
                className="filter-select"
                value={creditDebitFilter}
                onChange={(e) => setCreditDebitFilter(e.target.value)}
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.875rem'
                }}
              >
                <option value="">All Types</option>
                <option value="credit">Credits</option>
                <option value="debit">Debits</option>
              </select>

              <select 
                className="filter-select"
                value={rewardTypeFilter}
                onChange={(e) => setRewardTypeFilter(e.target.value)}
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.875rem'
                }}
              >
                <option value="">All Rewards</option>
                {uniqueRewardTypes.map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              <select 
                className="filter-select"
                value={dateRangeFilter}
                onChange={(e) => setDateRangeFilter(e.target.value)}
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.875rem'
                }}
              >
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="year">Last Year</option>
              </select>
            </div>
          </div>
          <div className="table-actions">
            {/* Clear filters if any are active */}
            {(searchTerm || creditDebitFilter || rewardTypeFilter || dateRangeFilter) && (
              <button 
                className="clear-filters-btn"
                onClick={() => {
                  setSearchTerm('');
                  setCreditDebitFilter('');
                  setRewardTypeFilter('');
                  setDateRangeFilter('');
                }}
              >
                <X size={16} />
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {paginatedHistory.length === 0 ? (
          <div className="empty-state">
            <History className="empty-state-icon" />
            <h3 className="empty-state-title">No reward history found</h3>
            <p className="empty-state-description">
              {searchTerm || creditDebitFilter || rewardTypeFilter || dateRangeFilter
                ? 'Try adjusting your search criteria'
                : 'No reward history records found'
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
                  <th style={{width: '140px', padding: 'var(--spacing-lg)'}}>Reward Type</th>
                  <th style={{width: '120px', padding: 'var(--spacing-lg)'}}>Amount</th>
                  <th style={{padding: 'var(--spacing-lg)'}}>Transaction Details</th>
                  <th style={{padding: 'var(--spacing-lg)'}}>Store</th>
                  <th style={{width: '100px', padding: 'var(--spacing-lg)'}}>Type</th>
                  <th style={{width: '140px', padding: 'var(--spacing-lg)'}}>Date</th>
                  <th style={{width: '100px', textAlign: 'center', padding: 'var(--spacing-lg)'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedHistory.map((history) => (
                  <tr 
                    key={history.id} 
                    style={{height: '64px', cursor: 'pointer'}}
                    onClick={(e) => handleRowClick(history.id, e)}
                    className="user-row-clickable"
                  >
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <span className="font-medium" style={{color: 'var(--text-secondary)'}}>
                        #{history.id}
                      </span>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <div className="user-cell">
                        <div className="user-avatar">
                          {getUserInitials(history)}
                        </div>
                        <div>
                          <div className="user-name">
                            {history.user_name || 'Unknown User'}
                          </div>
                          <div className="user-email">{history.user_email || 'N/A'}</div>
                          {history.user_phone && (
                            <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>
                              {history.user_phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <span className="role-badge">
                        {/* FIXED: Pass the entire history object, not just reward_type */}
                        {getRewardTypeDisplay(history)}
                      </span>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <span 
                        className="font-medium" 
                        style={{
                          color: history.credit_debit === 'credit' 
                            ? 'var(--success-text)' 
                            : 'var(--error-text)'
                        }}
                      >
                        {history.credit_debit === 'credit' ? '+' : '-'}
                        {formatCurrency(history.amount)}
                      </span>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      {history.transaction_number ? (
                        <div>
                          <div style={{fontWeight: '500', color: 'var(--text-primary)'}}>
                            {history.transaction_number}
                          </div>
                          {history.bill_amount && (
                            <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>
                              Bill: {formatCurrency(history.bill_amount)}
                            </div>
                          )}
                          {history.final_amount && (
                            <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>
                              Final: {formatCurrency(history.final_amount)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{color: 'var(--text-muted)', fontStyle: 'italic'}}>
                          Non-transaction reward
                        </span>
                      )}
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <div>
                        <div style={{fontWeight: '500', color: 'var(--text-primary)'}}>
                          {history.store_name || 'N/A'}
                        </div>
                        {history.store_phone && (
                          <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>
                            {history.store_phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <span className={`status-badge ${history.credit_debit}`}>
                        {history.credit_debit}
                      </span>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <span className="date-cell">{formatDateTime(history.created_at)}</span>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)', textAlign: 'center'}}>
                      <div className="action-buttons">
                        <button 
                          className="action-btn view"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/reward-history/${history.id}`);
                          }}
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="pagination-container">
          <div className="pagination-info">
            <span>
              Showing {Math.min(((currentPage - 1) * itemsPerPage) + 1, totalHistory)} to {Math.min(currentPage * itemsPerPage, totalHistory)} of {totalHistory} records
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

      <div style={{height: '16px'}}></div>
    </div>
  );
};

export default RewardHistoryManagement;