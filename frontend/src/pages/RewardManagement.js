// pages/RewardManagement.js - Rewards Management List Page
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Gift, Plus, Search, Filter, Eye, Edit2, Trash2, 
  MoreHorizontal, X, TrendingUp, AlertCircle, Wifi, 
  ChevronLeft, ChevronRight, Award, Activity, Clock, Target
} from 'lucide-react';
import ErrorState from '../components/common/ErrorState';
import '../styles/AdminStyles.css';

const RewardManagement = () => {
  const navigate = useNavigate();
  
  // State management
  const [allRewards, setAllRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);

  // API configuration
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  });

  // Fetch all rewards once and filter client-side
  const fetchAllRewards = useCallback(async () => {
    try {
      setLoading(true);
      
      // Try to fetch from API with a large limit to get all rewards
      const params = new URLSearchParams({
        limit: '1000',
        offset: '0'
      });

      const possibleEndpoints = [
        `${API_BASE_URL}/rewards?${params}`,
        `${API_BASE_URL}/admin/rewards?${params}`,
        `/api/rewards?${params}`,
        `/rewards?${params}`
      ];

      let lastError = null;
      let rewardData = null;

      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`🔄 Trying rewards endpoint: ${endpoint}`);
          
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: getHeaders(),
            credentials: 'include'
          });

          if (response.ok) {
            const data = await response.json();
            console.log('✅ Rewards API Response:', data);
            rewardData = data;
            break;
          } else {
            const errorText = await response.text();
            console.warn(`⚠️ Rewards endpoint ${endpoint} failed:`, response.status, errorText);
            lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        } catch (err) {
          console.warn(`⚠️ Rewards endpoint ${endpoint} error:`, err.message);
          lastError = err;
          continue;
        }
      }

      if (!rewardData) {
        throw lastError || new Error('All rewards endpoints failed');
      }

      // Process and store all rewards
      const processedData = processRewardsData(rewardData);
      setAllRewards(processedData.rewards || []);
      setError(null);
      
      console.log('✅ All rewards data loaded successfully');

    } catch (error) {
      console.warn('⚠️ Rewards API failed:', error.message);
      
      // Set empty data instead of static data
      setAllRewards([]);
      setError(`Failed to load rewards: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  // Client-side filtering logic
  const filteredRewards = useMemo(() => {
    let filtered = [...allRewards];

    // Apply search filter
    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(reward => {
        return (
          (reward.reward_name?.toLowerCase() || '').includes(searchLower) ||
          (reward.reward_type?.toLowerCase() || '').includes(searchLower)
        );
      });
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(reward => {
        switch (statusFilter) {
          case 'active':
            return reward.is_active === 1;
          case 'inactive':
            return reward.is_active === 0;
          default:
            return true;
        }
      });
    }

    // Apply type filter
    if (typeFilter) {
      filtered = filtered.filter(reward => {
        return reward.reward_type === typeFilter;
      });
    }

    return filtered;
  }, [allRewards, searchTerm, statusFilter, typeFilter]);

  // Pagination logic using filtered data
  const paginatedRewards = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredRewards.slice(startIndex, endIndex);
  }, [filteredRewards, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredRewards.length / itemsPerPage);
  const totalRewards = filteredRewards.length;

  // Process rewards data
  const processRewardsData = (rawData) => {
    let rewards = [];
    let pagination = { total: 0, totalPages: 1, currentPage: 1, itemsPerPage: 10 };
    let stats = { totalRewards: 0, activeRewards: 0, totalAwarded: 0, totalCredits: 0 };

    try {
      if (rawData.success && rawData.data) {
        rewards = rawData.data.rewards || rawData.data || [];
        pagination = rawData.data.pagination || rawData.pagination || pagination;
        stats = rawData.data.stats || rawData.stats || stats;
      } else if (Array.isArray(rawData)) {
        rewards = rawData;
      } else if (rawData.rewards) {
        rewards = rawData.rewards;
        pagination = rawData.pagination || pagination;
      }

      if (!Array.isArray(rewards)) {
        rewards = [];
      }

      if (rewards.length > 0 && stats.totalRewards === 0) {
        stats.totalRewards = pagination.total || rewards.length;
        stats.activeRewards = rewards.filter(r => r.is_active === 1).length;
        stats.totalAwarded = rewards.reduce((sum, r) => sum + (parseInt(r.total_awarded) || 0), 0);
        stats.totalCredits = rewards.reduce((sum, r) => sum + (parseFloat(r.total_credits) || 0), 0);
      }

      return { rewards, pagination, stats };
    } catch (error) {
      console.error('Error processing rewards data:', error);
      return { rewards: [], pagination, stats };
    }
  };

  // Initial load
  useEffect(() => {
    fetchAllRewards();
  }, [fetchAllRewards]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter]);

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

  const getRewardInitials = (reward) => {
    return reward.reward_name?.substring(0, 2).toUpperCase() || '??';
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

  const getRewardStatus = (reward) => {
    if (!reward.is_active) return { status: 'inactive', color: 'error' };
    return { status: 'active', color: 'success' };
  };

  const getRewardTypeDisplay = (rewardType) => {
    const typeMap = {
      'signup': 'Sign Up Bonus',
      'profile_completion': 'Profile Bonus',
      'cashback': 'Cashback',
      'referral': 'Referral Bonus',
      'spin_win': 'Lucky Draw',
      'survey': 'Survey Reward',
      'other': 'Other'
    };
    return typeMap[rewardType] || rewardType;
  };

  // Delete reward (set is_active = 0)
  const handleDeleteReward = async (rewardId) => {
    if (!window.confirm('Are you sure you want to deactivate this reward? This will set its status to inactive.')) {
      return;
    }

    try {
      const deleteEndpoints = [
        `${API_BASE_URL}/rewards/${rewardId}`,
        `${API_BASE_URL}/admin/rewards/${rewardId}`,
        `/api/rewards/${rewardId}`
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
        await fetchAllRewards();
        alert('Reward deactivated successfully');
      } else {
        throw new Error('Deactivation failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to deactivate reward. Please try again.');
    }
  };

  // Handle row click to navigate to reward details
  const handleRowClick = (rewardId, event) => {
    if (event.target.closest('.action-buttons')) {
      return;
    }
    navigate(`/rewards/${rewardId}`);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Calculate stats from current rewards
  const currentStats = useMemo(() => {
    const activeRewards = allRewards.filter(r => r.is_active === 1).length;
    const totalAwarded = allRewards.reduce((sum, r) => sum + (parseInt(r.total_awarded) || 0), 0);
    const totalCredits = allRewards.reduce((sum, r) => sum + (parseFloat(r.total_credits) || 0), 0);
    
    return {
      totalRewards: allRewards.length,
      activeRewards,
      totalAwarded,
      totalCredits
    };
  }, [allRewards]);

  // Get unique reward types for filter
  const uniqueRewardTypes = useMemo(() => {
    const types = [...new Set(allRewards.map(r => r.reward_type).filter(Boolean))];
    return types.sort();
  }, [allRewards]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading rewards...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={`Failed to load rewards: ${error}`} />;
  }

  return (
    <div className="page-container">
      {/* Stats Grid */}
      <div className="stats-grid" style={{marginBottom: 'var(--spacing-lg)'}}>
        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{formatNumber(currentStats.totalRewards)}</div>
            <div className="stats-label">Total Rewards</div>
          </div>
          <div className="stats-icon">
            <Gift />
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{formatNumber(currentStats.activeRewards)}</div>
            <div className="stats-label">Active Rewards</div>
          </div>
          <div className="stats-icon success">
            <Target />
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{formatNumber(currentStats.totalAwarded)}</div>
            <div className="stats-label">Total Distributed</div>
          </div>
          <div className="stats-icon info">
            <Activity />
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{formatCurrency(currentStats.totalCredits)}</div>
            <div className="stats-label">Total Credits</div>
          </div>
          <div className="stats-icon warning">
            <Award />
          </div>
        </div>
      </div>

      {/* Table Container with filters and search */}
      <div className="table-container">
        <div className="table-header">
          <div className="table-header-left">
            <h3 className="table-title">
              Rewards ({totalRewards.toLocaleString()})
            </h3>
            <div style={{display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center'}}>
              <div className="table-search">
                <Search className="search-input-icon" />
                <input
                  type="text"
                  placeholder="Search by name, type..."
                  className="table-search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <select 
                className="filter-select"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.875rem'
                }}
              >
                <option value="" style={{backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)'}}>All Types</option>
                {uniqueRewardTypes.map(type => (
                  <option 
                    key={type} 
                    value={type}
                    style={{backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)'}}
                  >
                    {getRewardTypeDisplay(type)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="table-actions">
            
            
            <button 
              className="add-user-btn"
              onClick={() => navigate('/rewards/add')}
            >
              <Plus size={16} />
              Add New Reward
            </button>
          </div>
        </div>

        {paginatedRewards.length === 0 ? (
          <div className="empty-state">
            <Gift className="empty-state-icon" />
            <h3 className="empty-state-title">No rewards found</h3>
            <p className="empty-state-description">
              {searchTerm || statusFilter || typeFilter
                ? 'Try adjusting your search criteria'
                : 'No rewards found'
              }
            </p>
          </div>
        ) : (
          <div className="table-scroll-container">
            <table className="data-table">
              <thead className="table-sticky-header">
                <tr>
                  <th style={{width: '80px', padding: 'var(--spacing-lg)'}}>ID</th>
                  <th style={{padding: 'var(--spacing-lg)'}}>Reward Details</th>
                  <th style={{width: '120px', padding: 'var(--spacing-lg)'}}>Type</th>
                  <th style={{width: '120px', padding: 'var(--spacing-lg)'}}>Normal Value</th>
                  <th style={{width: '120px', padding: 'var(--spacing-lg)'}}>VIP Value</th>
                  <th style={{width: '100px', padding: 'var(--spacing-lg)'}}>Distributed</th>
                  <th style={{width: '100px', padding: 'var(--spacing-lg)'}}>Status</th>
                  <th style={{width: '110px', padding: 'var(--spacing-lg)'}}>Created</th>
                  <th style={{width: '140px', textAlign: 'center', padding: 'var(--spacing-lg)'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRewards.map((reward) => {
                  const status = getRewardStatus(reward);
                  return (
                    <tr 
                      key={reward.id} 
                      style={{height: '64px', cursor: 'pointer'}}
                      onClick={(e) => handleRowClick(reward.id, e)}
                      className="user-row-clickable"
                    >
                      <td style={{padding: 'var(--spacing-lg)'}}>
                        <span className="font-medium" style={{color: 'var(--text-secondary)'}}>
                          #{reward.id}
                        </span>
                      </td>
                      <td style={{padding: 'var(--spacing-lg)'}}>
                        <div className="user-cell">
                          <div className="user-avatar">
                            {getRewardInitials(reward)}
                          </div>
                          <div>
                            <div className="user-name">
                              {reward.reward_name}
                            </div>
                            <div className="user-email">{getRewardTypeDisplay(reward.reward_type)}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{padding: 'var(--spacing-lg)'}}>
                        <span className="role-badge">
                          {getRewardTypeDisplay(reward.reward_type)}
                        </span>
                      </td>
                      <td style={{padding: 'var(--spacing-lg)'}}>
                        <span className="font-medium" style={{color: 'var(--success-text)'}}>
                          {formatCurrency(reward.normal_users_reward_value)}
                        </span>
                      </td>
                      <td style={{padding: 'var(--spacing-lg)'}}>
                        <span className="font-medium" style={{color: 'var(--warning-text)'}}>
                          {reward.vip_users_reward_value ? formatCurrency(reward.vip_users_reward_value) : 'N/A'}
                        </span>
                      </td>
                      <td style={{padding: 'var(--spacing-lg)'}}>
                        <span className="transaction-count">
                          {reward.total_awarded || 0}
                        </span>
                      </td>
                      <td style={{padding: 'var(--spacing-lg)'}}>
                        <span className={`status-badge ${status.color}`}>
                          {status.status}
                        </span>
                      </td>
                      <td style={{padding: 'var(--spacing-lg)'}}>
                        <span className="date-cell">{formatDate(reward.created_at)}</span>
                      </td>
                      <td style={{padding: 'var(--spacing-lg)', textAlign: 'center'}}>
                        <div className="action-buttons">
                          <button 
                            className="action-btn view"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/rewards/${reward.id}`);
                            }}
                            title="View Details"
                          >
                            <Eye size={14} />
                          </button>
                          <button 
                            className="action-btn edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/rewards/${reward.id}/edit`);
                            }}
                            title="Edit Reward"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            className="action-btn delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteReward(reward.id);
                            }}
                            title="Deactivate Reward"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="pagination-container">
          <div className="pagination-info">
            <span>
              Showing {Math.min(((currentPage - 1) * itemsPerPage) + 1, totalRewards)} to {Math.min(currentPage * itemsPerPage, totalRewards)} of {totalRewards} rewards
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

export default RewardManagement;