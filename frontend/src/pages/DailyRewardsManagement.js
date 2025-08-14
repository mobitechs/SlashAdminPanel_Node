// pages/DailyRewardsManagement.js - FIXED to handle your actual data structure
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Gift, Plus, Search, Filter, Eye, Edit2, Trash2, 
  Calendar, Clock, Target, Users, Trophy,
  ChevronLeft, ChevronRight, Activity, BarChart,
  CheckCircle, XCircle, PlayCircle, PauseCircle,
  AlertCircle, RefreshCw
} from 'lucide-react';
import ErrorState from '../components/common/ErrorState';
import '../styles/AdminStyles.css';

const DailyRewardsManagement = () => {
  const navigate = useNavigate();
  
  // State management
  const [allCampaigns, setAllCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);

  // API configuration
  const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  });

  // Fetch all campaigns with improved error handling
  const fetchAllCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Starting to fetch daily rewards campaigns...');
      
      const params = new URLSearchParams({
        limit: '100',
        offset: '0'
      });

      const possibleEndpoints = [
        `${API_BASE_URL}/daily-rewards/campaigns?${params}`,
        `/api/daily-rewards/campaigns?${params}`
      ];

      let lastError = null;
      let campaignData = null;

      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`🔄 Trying daily rewards endpoint: ${endpoint}`);
          
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: getHeaders(),
            credentials: 'include'
          });

          console.log(`📡 Response status: ${response.status}`);

          if (response.ok) {
            const data = await response.json();
            console.log('✅ Daily Rewards API Response:', data);
            
            if (data.success) {
              campaignData = data;
              break;
            } else {
              throw new Error(data.message || 'API returned success=false');
            }
          } else {
            const errorText = await response.text();
            console.warn(`⚠️ Daily rewards endpoint ${endpoint} failed:`, response.status, errorText);
            lastError = new Error(`HTTP ${response.status}: ${errorText}`);
          }
        } catch (err) {
          console.warn(`⚠️ Daily rewards endpoint ${endpoint} error:`, err.message);
          lastError = err;
          continue;
        }
      }

      if (!campaignData) {
        console.error('❌ All daily rewards endpoints failed');
        throw lastError || new Error('All daily rewards API endpoints failed');
      }

      // Process the data
      const processedData = processCampaignsData(campaignData);
      console.log('🔍 Processed campaigns:', processedData.campaigns);
      
      setAllCampaigns(processedData.campaigns || []);
      setError(null);
      
      console.log(`✅ Successfully loaded ${processedData.campaigns?.length || 0} campaigns`);

    } catch (error) {
      console.error('⚠️ Daily Rewards fetch failed:', error);
      setError(error.message);
      setAllCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  // Process campaigns data - FIXED to handle your data structure
  const processCampaignsData = (rawData) => {
    try {
      console.log('🔍 Processing campaigns data:', rawData);
      
      let campaigns = [];
      let stats = { totalCampaigns: 0, activeCampaigns: 0, dailyCampaigns: 0, weeklyCampaigns: 0 };

      if (rawData.success && rawData.data && rawData.data.campaigns) {
        campaigns = rawData.data.campaigns;
        stats = rawData.data.stats || stats;
      } else if (Array.isArray(rawData)) {
        campaigns = rawData;
      } else if (rawData.campaigns) {
        campaigns = rawData.campaigns;
      }

      if (!Array.isArray(campaigns)) {
        console.warn('❌ Campaigns data is not an array:', campaigns);
        campaigns = [];
      }

      // Process each campaign to ensure data consistency
      campaigns = campaigns.map(campaign => ({
        ...campaign,
        // Ensure numeric values are properly converted
        id: parseInt(campaign.id) || 0,
        is_active: parseInt(campaign.is_active) || 0,
        reward_count: parseInt(campaign.reward_count) || 0,
        total_spins: parseInt(campaign.total_spins) || 0,
        max_attempts_per_interval: parseInt(campaign.max_attempts_per_interval) || 1,
        // Ensure string values are properly handled
        title: campaign.title || 'Untitled Campaign',
        campaign_type: campaign.campaign_type || 'unknown',
        description: campaign.description || '',
        repeat_interval: campaign.repeat_interval || campaign.campaign_type || 'daily'
      }));

      console.log(`✅ Processed ${campaigns.length} campaigns:`, campaigns.map(c => ({ 
        id: c.id, 
        title: c.title, 
        type: c.campaign_type, 
        active: c.is_active,
        rewards: c.reward_count,
        spins: c.total_spins 
      })));
      
      return { campaigns, stats };
    } catch (error) {
      console.error('❌ Error processing campaigns data:', error);
      return { campaigns: [], stats: {} };
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchAllCampaigns();
  }, [fetchAllCampaigns]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeFilter, typeFilter]);

  // Get unique campaign types from actual data - FIXED
  const availableCampaignTypes = useMemo(() => {
    const types = [...new Set(allCampaigns.map(c => c.campaign_type))];
    console.log('📊 Available campaign types:', types);
    return types;
  }, [allCampaigns]);

  // Client-side filtering logic - FIXED
  const filteredCampaigns = useMemo(() => {
    console.log('🔍 Filtering campaigns. Total campaigns:', allCampaigns.length);
    let filtered = [...allCampaigns];

    // Apply search filter
    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(campaign => {
        const matches = (
          (campaign.title?.toLowerCase() || '').includes(searchLower) ||
          (campaign.description?.toLowerCase() || '').includes(searchLower) ||
          (campaign.campaign_type?.toLowerCase() || '').includes(searchLower)
        );
        return matches;
      });
      console.log(`🔍 After search filter (${searchTerm}): ${filtered.length} campaigns`);
    }

    // Apply active filter
    if (activeFilter !== '') {
      const activeValue = parseInt(activeFilter);
      filtered = filtered.filter(campaign => {
        return campaign.is_active === activeValue;
      });
      console.log(`🔍 After active filter (${activeFilter}): ${filtered.length} campaigns`);
    }

    // Apply type filter
    if (typeFilter !== '') {
      filtered = filtered.filter(campaign => {
        return campaign.campaign_type === typeFilter;
      });
      console.log(`🔍 After type filter (${typeFilter}): ${filtered.length} campaigns`);
    }

    console.log('✅ Final filtered campaigns:', filtered.length);
    return filtered;
  }, [allCampaigns, searchTerm, activeFilter, typeFilter]);

  // Pagination logic
  const paginatedCampaigns = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filteredCampaigns.slice(startIndex, endIndex);
    console.log(`📄 Paginated campaigns (page ${currentPage}):`, paginated.length);
    return paginated;
  }, [filteredCampaigns, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage);
  const totalCampaigns = filteredCampaigns.length;

  // Calculate stats from current campaigns - FIXED
  const currentStats = useMemo(() => {
    const totalCampaigns = allCampaigns.length;
    const activeCampaigns = allCampaigns.filter(c => c.is_active === 1).length;
    const spinWheelCampaigns = allCampaigns.filter(c => c.campaign_type === 'spin_wheel').length;
    const dailyCampaigns = allCampaigns.filter(c => c.campaign_type === 'daily').length;
    const weeklyCampaigns = allCampaigns.filter(c => c.campaign_type === 'weekly').length;
    const totalRewards = allCampaigns.reduce((sum, c) => sum + (parseInt(c.reward_count) || 0), 0);
    const totalSpins = allCampaigns.reduce((sum, c) => sum + (parseInt(c.total_spins) || 0), 0);
    
    console.log('📊 Calculated stats:', {
      totalCampaigns,
      activeCampaigns,
      spinWheelCampaigns,
      dailyCampaigns,
      weeklyCampaigns,
      totalRewards,
      totalSpins
    });
    
    return {
      totalCampaigns,
      activeCampaigns,
      spinWheelCampaigns,
      dailyCampaigns,
      weeklyCampaigns,
      totalRewards,
      totalSpins
    };
  }, [allCampaigns]);

  // Helper functions
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

  const formatNumber = (value) => {
    const num = parseFloat(value) || 0;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const getStatusIcon = (isActive) => {
    return isActive ? 
      <CheckCircle size={14} style={{color: '#10b981'}} /> : 
      <XCircle size={14} style={{color: '#ef4444'}} />;
  };

  const getStatusBadge = (isActive) => {
    const statusClass = isActive ? 'success' : 'error';
    return (
      <span className={`status-badge ${statusClass}`}>
        {getStatusIcon(isActive)}
        <span style={{ marginLeft: '0.25rem' }}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
      </span>
    );
  };

  const getCampaignTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'spin_wheel':
        return <Target size={14} style={{color: '#3b82f6'}} />;
      case 'daily':
        return <Calendar size={14} style={{color: '#10b981'}} />;
      case 'weekly':
        return <Clock size={14} style={{color: '#f59e0b'}} />;
      case 'monthly':
        return <Trophy size={14} style={{color: '#8b5cf6'}} />;
      default:
        return <Activity size={14} style={{color: '#6b7280'}} />;
    }
  };

  const getCampaignTypeBadge = (type) => {
    const typeColors = {
      spin_wheel: 'info',
      daily: 'success',
      weekly: 'warning',
      monthly: 'info',
      custom: 'default'
    };
    
    const badgeClass = typeColors[type?.toLowerCase()] || 'default';
    
    return (
      <span className={`status-badge ${badgeClass}`}>
        {getCampaignTypeIcon(type)}
        <span style={{ marginLeft: '0.25rem', textTransform: 'capitalize' }}>
          {type === 'spin_wheel' ? 'Spin Wheel' : type}
        </span>
      </span>
    );
  };

  const handleRowClick = (campaignId, event) => {
    if (event.target.closest('.action-buttons')) {
      return;
    }
    navigate(`/daily-rewards/campaigns/${campaignId}`);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleDeleteCampaign = async (campaignId, campaignTitle) => {
    if (!window.confirm(`Are you sure you want to delete campaign "${campaignTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const endpoints = [
        `${API_BASE_URL}/daily-rewards/campaigns/${campaignId}`,
        `/api/daily-rewards/campaigns/${campaignId}`
      ];

      let deleted = false;

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'DELETE',
            headers: getHeaders(),
            credentials: 'include'
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
        alert('Campaign deleted successfully');
        fetchAllCampaigns();
      } else {
        alert('Failed to delete campaign');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete campaign');
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading daily rewards campaigns...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="chart-card">
          <ErrorState
            title="Failed to Load Daily Rewards"
            message={error}
            onRetry={fetchAllCampaigns}
            backTo="/dashboard"
            backText="Back to Dashboard"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Debug Info - Show in development */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          background: 'var(--bg-glass-light)',
          border: '1px solid var(--border-glass)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--spacing-md)',
          marginBottom: 'var(--spacing-lg)',
          fontSize: '0.75rem',
          color: 'var(--text-muted)'
        }}>
          <strong>Debug Info:</strong> Total: {allCampaigns.length} campaigns, 
          Filtered: {filteredCampaigns.length}, 
          Page: {currentPage}/{totalPages},
          Types: {availableCampaignTypes.join(', ')}
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid" style={{marginBottom: 'var(--spacing-lg)'}}>
        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{formatNumber(currentStats.totalCampaigns)}</div>
            <div className="stats-label">Total Campaigns</div>
          </div>
          <div className="stats-icon">
            <Gift />
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{formatNumber(currentStats.activeCampaigns)}</div>
            <div className="stats-label">Active Campaigns</div>
          </div>
          <div className="stats-icon success">
            <PlayCircle />
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{formatNumber(currentStats.totalRewards)}</div>
            <div className="stats-label">Total Rewards</div>
          </div>
          <div className="stats-icon info">
            <Trophy />
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{formatNumber(currentStats.totalSpins)}</div>
            <div className="stats-label">Total Spins</div>
          </div>
          <div className="stats-icon warning">
            <Activity />
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{formatNumber(currentStats.spinWheelCampaigns)}</div>
            <div className="stats-label">Spin Wheel Campaigns</div>
          </div>
          <div className="stats-icon" style={{background: 'linear-gradient(135deg, #3b82f6, #2563eb)'}}>
            <Target />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-container">
        <div className="filters-content">
          <div className="form-group">
            <div className="search-input-container">
              <Search className="search-input-icon" />
              <input
                type="text"
                placeholder="Search campaigns by title, description, or type..."
                className="form-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{paddingLeft: '2.5rem'}}
              />
            </div>
          </div>
          
          <div className="form-group">
            <select
              className="form-select"
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
          </div>
          
          <div className="form-group">
            <select
              className="form-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              {availableCampaignTypes.map(type => (
                <option key={type} value={type}>
                  {type === 'spin_wheel' ? 'Spin Wheel' : type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="table-container">
        <div className="table-header">
          <div className="table-header-left">
            <h3 className="table-title">
              Daily Rewards Campaigns ({totalCampaigns.toLocaleString()})
            </h3>
          </div>
          <div className="table-actions">
            <button 
              className="add-user-btn"
              onClick={() => navigate('/daily-rewards/campaigns/add')}
            >
              <Plus size={16} />
              Add Campaign
            </button>
          </div>
        </div>

        {paginatedCampaigns.length === 0 ? (
          <div className="empty-state">
            <Gift className="empty-state-icon" />
            <h3 className="empty-state-title">
              {allCampaigns.length === 0 ? 'No campaigns found' : 'No matching campaigns'}
            </h3>
            <p className="empty-state-description">
              {searchTerm || activeFilter || typeFilter
                ? 'Try adjusting your search criteria'
                : 'Create your first daily rewards campaign to get started'
              }
            </p>
            {allCampaigns.length === 0 && (
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/daily-rewards/campaigns/add')}
                style={{marginTop: 'var(--spacing-md)'}}
              >
                <Plus size={16} />
                Create First Campaign
              </button>
            )}
          </div>
        ) : (
          <div className="table-scroll-container">
            <table className="data-table">
              <thead className="table-sticky-header">
                <tr>
                  <th style={{width: '200px', padding: 'var(--spacing-lg)'}}>Campaign Details</th>
                  <th style={{width: '120px', padding: 'var(--spacing-lg)'}}>Type</th>
                  <th style={{width: '150px', padding: 'var(--spacing-lg)'}}>Duration</th>
                  <th style={{width: '120px', padding: 'var(--spacing-lg)'}}>Max Attempts</th>
                  <th style={{width: '120px', padding: 'var(--spacing-lg)'}}>Rewards</th>
                  <th style={{width: '120px', padding: 'var(--spacing-lg)'}}>Participation</th>
                  <th style={{width: '100px', padding: 'var(--spacing-lg)'}}>Status</th>
                  <th style={{width: '110px', padding: 'var(--spacing-lg)'}}>Created</th>
                  <th style={{width: '140px', textAlign: 'center', padding: 'var(--spacing-lg)'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCampaigns.map((campaign) => (
                  <tr 
                    key={campaign.id} 
                    style={{height: '64px', cursor: 'pointer'}}
                    onClick={(e) => handleRowClick(campaign.id, e)}
                    className="user-row-clickable"
                  >
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <div style={{fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem'}}>
                        {campaign.title}
                      </div>
                      {campaign.description && (
                        <div style={{fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px'}}>
                          {campaign.description}
                        </div>
                      )}
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>
                        ID: {campaign.id}
                      </div>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      {getCampaignTypeBadge(campaign.campaign_type)}
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <div style={{fontSize: '0.75rem'}}>
                        {campaign.start_date && (
                          <div style={{color: 'var(--text-secondary)', marginBottom: '0.25rem'}}>
                            From: {formatDate(campaign.start_date)}
                          </div>
                        )}
                        {campaign.end_date ? (
                          <div style={{color: 'var(--text-secondary)'}}>
                            To: {formatDate(campaign.end_date)}
                          </div>
                        ) : (
                          <div style={{color: 'var(--text-muted)', fontStyle: 'italic'}}>
                            No end date
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <div style={{fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)'}}>
                        {campaign.max_attempts_per_interval}
                      </div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-secondary)'}}>
                        per {campaign.repeat_interval || 'interval'}
                      </div>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <div style={{fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)'}}>
                        {campaign.reward_count || 0}
                      </div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-secondary)'}}>
                        rewards
                      </div>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <div style={{fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)'}}>
                        {formatNumber(campaign.total_spins || 0)}
                      </div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-secondary)'}}>
                        total spins
                      </div>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      {getStatusBadge(campaign.is_active)}
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <span className="date-cell">{formatDate(campaign.created_at)}</span>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)', textAlign: 'center'}}>
                      <div className="action-buttons">
                        <button 
                          className="action-btn view"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/daily-rewards/campaigns/${campaign.id}`);
                          }}
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          className="action-btn edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/daily-rewards/campaigns/${campaign.id}/edit`);
                          }}
                          title="Edit Campaign"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          className="action-btn delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCampaign(campaign.id, campaign.title);
                          }}
                          title="Delete Campaign"
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination-container">
            <div className="pagination-info">
              <span>
                Showing {Math.min(((currentPage - 1) * itemsPerPage) + 1, totalCampaigns)} to {Math.min(currentPage * itemsPerPage, totalCampaigns)} of {totalCampaigns} campaigns
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
        )}
      </div>

      <div style={{height: '16px'}}></div>
    </div>
  );
};

export default DailyRewardsManagement;