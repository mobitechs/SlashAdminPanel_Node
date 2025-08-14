// pages/DailyRewardsDetails.js - Campaign Details with Spin Wheel Rewards Management
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Edit, Trash2, Calendar, Clock, Target, Activity,
  Gift, Star, CheckCircle, DollarSign, TrendingUp, 
  Plus, Eye, Edit2, Users, BarChart, Award,
  ArrowLeft, PlayCircle, PauseCircle, Palette, Settings
} from 'lucide-react';
import ErrorState from '../components/common/ErrorState';
import '../styles/AdminStyles.css';

const DailyRewardsDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rewardsLoading, setRewardsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // API Configuration
  const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';
  
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  });

  // Fetch campaign details
  const fetchCampaignDetails = async () => {
    try {
      setError(null);
      console.log(`🔄 Fetching campaign details for ID: ${id}`);
      
      const possibleEndpoints = [
        `${API_BASE_URL}/daily-rewards/campaigns/${id}`,
        `/api/daily-rewards/campaigns/${id}`
      ];

      let lastError = null;
      let campaignData = null;

      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`🔄 Trying campaign details endpoint: ${endpoint}`);
          
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: getHeaders(),
            credentials: 'include'
          });

          if (response.ok) {
            campaignData = await response.json();
            console.log('✅ Campaign details fetched successfully');
            break;
          } else {
            const errorText = await response.text();
            lastError = new Error(`HTTP ${response.status}: ${errorText}`);
          }
        } catch (err) {
          console.warn(`⚠️ Campaign details endpoint ${endpoint} error:`, err.message);
          lastError = err;
          continue;
        }
      }

      if (!campaignData) {
        throw lastError || new Error('Campaign not found');
      }

      if (campaignData.success && campaignData.data) {
        setCampaign(campaignData.data.campaign);
        setRewards(campaignData.data.rewards || []);
      } else {
        throw new Error('Invalid response format');
      }
      
      console.log('✅ Campaign details loaded successfully');

    } catch (error) {
      console.error(`❌ Failed to fetch campaign ${id}:`, error.message);
      setError(error.message);
      setCampaign(null);
      setRewards([]);
    } finally {
      setLoading(false);
    }
  };

  // Load campaign data on component mount
  useEffect(() => {
    if (id) {
      fetchCampaignDetails();
    }
  }, [id]);

  // Helper functions
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
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

  const getStatusIcon = (isActive) => {
    return isActive ? 
      <CheckCircle size={16} className="text-green-500" /> : 
      <PauseCircle size={16} className="text-red-500" />;
  };

  const getStatusColor = (isActive) => {
    return isActive ? 'var(--success-text)' : 'var(--error-text)';
  };

  const getCampaignTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'daily':
        return <Calendar size={18} style={{color: '#3b82f6'}} />;
      case 'weekly':
        return <Clock size={18} style={{color: '#10b981'}} />;
      case 'monthly':
        return <Target size={18} style={{color: '#8b5cf6'}} />;
      default:
        return <Activity size={18} style={{color: '#6b7280'}} />;
    }
  };

  const getRewardTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'cashback':
        return <DollarSign size={14} style={{color: '#10b981'}} />;
      case 'coupon':
        return <Gift size={14} style={{color: '#f59e0b'}} />;
      case 'points':
        return <Star size={14} style={{color: '#8b5cf6'}} />;
      default:
        return <Award size={14} style={{color: '#6b7280'}} />;
    }
  };

  const getRewardTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'cashback':
        return '#10b981';
      case 'coupon':
        return '#f59e0b';
      case 'points':
        return '#8b5cf6';
      default:
        return '#6b7280';
    }
  };

  // Navigation handlers
  const handleEdit = () => {
    navigate(`/daily-rewards/campaigns/${id}/edit`);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      // TODO: Implement delete functionality
      console.log('Delete campaign:', id);
    }
  };

  const handleDeleteReward = async (rewardId, displayText) => {
    if (!window.confirm(`Are you sure you want to delete reward "${displayText}"?`)) {
      return;
    }

    try {
      const endpoints = [
        `${API_BASE_URL}/daily-rewards/rewards/${rewardId}`,
        `/api/daily-rewards/rewards/${rewardId}`
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
        alert('Reward deleted successfully');
        fetchCampaignDetails(); // Refresh data
      } else {
        alert('Failed to delete reward');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete reward');
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading Campaign #{id}...</p>
        </div>
      </div>
    );
  }

  if (error && !campaign) {
    return (
      <div className="page-container">
        <div className="chart-card">
          <ErrorState
            title="Failed to Load Campaign"
            message={error}
            onRetry={fetchCampaignDetails}
            backTo="/daily-rewards"
            backText="Back to Campaigns List"
          />
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="page-container">
        <ErrorState
          title="Campaign not found"
          message={`Campaign #${id} does not exist`}
          showRetry={false}
          backTo="/daily-rewards"
          backText="Back to Campaigns"
          showDebugInfo={false}
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Breadcrumb */}
      <div style={{marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
        <Link 
          to="/daily-rewards" 
          style={{
            display: 'flex', 
            alignItems: 'center', 
            gap: 'var(--spacing-xs)', 
            color: 'var(--text-secondary)', 
            textDecoration: 'none',
            fontSize: '0.875rem'
          }}
        >
          <ArrowLeft size={16} />
          Back to Daily Rewards
        </Link>
        <span style={{color: 'var(--text-disabled)'}}>•</span>
        <span style={{color: 'var(--text-primary)', fontSize: '0.875rem'}}>
          {campaign.title}
        </span>
      </div>

      {/* Header with Campaign Icon, Title, and Action Buttons */}
      <div style={{
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 'var(--spacing-xl)',
        padding: 'var(--spacing-lg)',
        background: 'var(--bg-glass)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-glass)'
      }}>
        <h1 style={{
          fontSize: '1.5rem', 
          fontWeight: '600', 
          color: 'var(--text-primary)',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-sm)'
        }}>
          {getCampaignTypeIcon(campaign.campaign_type)}
          {campaign.title}
          <span style={{
            fontSize: '0.875rem',
            color: 'var(--text-muted)',
            fontWeight: '400',
            marginLeft: 'var(--spacing-sm)'
          }}>
            • ID: {campaign.id}
          </span>
        </h1>
        
        <div style={{display: 'flex', gap: 'var(--spacing-md)'}}>
          <button className="btn btn-secondary" onClick={handleEdit}>
            <Edit size={16} />
            Edit Campaign
          </button>
          <button 
            className="btn btn-secondary"
            onClick={handleDelete}
            style={{background: 'var(--error-bg)', borderColor: 'var(--error-border)', color: 'var(--error-text)'}}
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>

      {/* Campaign Stats */}
      <div className="stats-grid" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 'var(--spacing-xl)'}}>
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Total Rewards</h3>
              <div className="stat-value">{campaign.reward_count || 0}</div>
              <p className="stat-subtitle">Configured rewards</p>
            </div>
            <div className="stat-icon" style={{background: 'var(--gradient-blue)'}}>
              <Gift />
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Total Spins</h3>
              <div className="stat-value">{campaign.total_spins || 0}</div>
              <p className="stat-subtitle">All time spins</p>
            </div>
            <div className="stat-icon" style={{background: 'var(--gradient-orange)'}}>
              <Activity />
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Unique Users</h3>
              <div className="stat-value">{campaign.unique_users || 0}</div>
              <p className="stat-subtitle">Participants</p>
            </div>
            <div className="stat-icon" style={{background: 'var(--gradient-purple)'}}>
              <Users />
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Max Attempts</h3>
              <div className="stat-value">{campaign.max_attempts_per_interval}</div>
              <p className="stat-subtitle">Per {campaign.repeat_interval}</p>
            </div>
            <div className="stat-icon" style={{background: 'var(--gradient-green)'}}>
              <Target />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="chart-card">
        <div style={{display: 'flex', borderBottom: '1px solid var(--border-glass)', marginBottom: 'var(--spacing-lg)'}}>
          <button 
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
            style={{
              padding: 'var(--spacing-md) var(--spacing-lg)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'overview' ? '2px solid var(--text-primary)' : '2px solid transparent',
              color: activeTab === 'overview' ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            <Gift size={16} />
            Campaign Details
          </button>
          <button 
            className={`tab-button ${activeTab === 'rewards' ? 'active' : ''}`}
            onClick={() => setActiveTab('rewards')}
            style={{
              padding: 'var(--spacing-md) var(--spacing-lg)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'rewards' ? '2px solid var(--text-primary)' : '2px solid transparent',
              color: activeTab === 'rewards' ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            <BarChart size={16} />
            Spin Wheel Rewards ({rewards.length})
          </button>
        </div>

        <div style={{padding: 'var(--spacing-lg)'}}>
          {activeTab === 'overview' && (
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-xl)'}}>
              {/* Campaign Information */}
              <div>
                <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                  <Settings size={18} />
                  Campaign Configuration
                </h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    {getCampaignTypeIcon(campaign.campaign_type)}
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Campaign Type</div>
                      <div style={{color: 'var(--text-secondary)', textTransform: 'capitalize', fontWeight: '500'}}>{campaign.campaign_type}</div>
                    </div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <Activity size={16} style={{color: getStatusColor(campaign.is_active)}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Status</div>
                      <div style={{color: getStatusColor(campaign.is_active), display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', fontWeight: '500'}}>
                        {getStatusIcon(campaign.is_active)}
                        <span>{campaign.is_active ? 'Active' : 'Inactive'}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <Target size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Max Attempts</div>
                      <div style={{color: 'var(--text-secondary)', fontWeight: '500'}}>
                        {campaign.max_attempts_per_interval} per {campaign.repeat_interval}
                      </div>
                    </div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <Clock size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Repeat Interval</div>
                      <div style={{color: 'var(--text-secondary)', textTransform: 'capitalize'}}>
                        {campaign.repeat_interval}
                        {campaign.custom_interval_days && (
                          <span> ({campaign.custom_interval_days} days)</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <Calendar size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Created Date</div>
                      <div style={{color: 'var(--text-secondary)'}}>{formatDateTime(campaign.created_at)}</div>
                    </div>
                  </div>
                  {campaign.updated_at && campaign.updated_at !== campaign.created_at && (
                    <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                      <Clock size={16} style={{color: 'var(--text-muted)'}} />
                      <div>
                        <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Last Updated</div>
                        <div style={{color: 'var(--text-secondary)'}}>{formatDateTime(campaign.updated_at)}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Duration Information */}
              <div>
                <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                  <Calendar size={18} />
                  Campaign Duration
                </h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <PlayCircle size={16} style={{color: 'var(--success-text)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Start Date</div>
                      <div style={{color: 'var(--text-secondary)', fontWeight: '500'}}>
                        {campaign.start_date ? formatDate(campaign.start_date) : 'No start date set'}
                      </div>
                    </div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <PauseCircle size={16} style={{color: 'var(--error-text)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>End Date</div>
                      <div style={{color: 'var(--text-secondary)', fontWeight: '500'}}>
                        {campaign.end_date ? formatDate(campaign.end_date) : 'No end date (runs indefinitely)'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {campaign.description && (
                <div style={{gridColumn: '1 / -1'}}>
                  <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)'}}>
                    Description
                  </h3>
                  <div style={{
                    padding: 'var(--spacing-lg)',
                    background: 'var(--bg-glass-light)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-glass)',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.6'
                  }}>
                    {campaign.description}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'rewards' && (
            <div>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)'}}>
                <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0}}>
                  Spin Wheel Rewards ({rewards.length})
                </h3>
                <button 
                  className="btn btn-primary"
                  onClick={() => navigate(`/daily-rewards/rewards/add?campaign_id=${campaign.id}`)}
                >
                  <Plus size={16} />
                  Add Reward
                </button>
              </div>
              
              {rewards.length > 0 ? (
                <div style={{overflowX: 'auto'}}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Display Text</th>
                        <th>Reward Type</th>
                        <th>Value</th>
                        <th>Probability</th>
                        <th>Color</th>
                        <th>Coupon</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rewards.map((reward) => (
                        <tr key={reward.id}>
                          <td>
                            <div style={{fontWeight: '500', color: 'var(--text-primary)'}}>
                              {reward.display_text}
                            </div>
                            <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>
                              ID: {reward.id}
                            </div>
                          </td>
                          <td>
                            <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)'}}>
                              {getRewardTypeIcon(reward.reward_type)}
                              <span style={{textTransform: 'capitalize', color: getRewardTypeColor(reward.reward_type), fontWeight: '500'}}>
                                {reward.reward_type}
                              </span>
                            </div>
                          </td>
                          <td>
                            {reward.reward_value ? (
                              <span style={{fontWeight: '600', color: 'var(--success-text)'}}>
                                {reward.reward_type === 'cashback' ? '₹' : ''}{reward.reward_value}
                                {reward.reward_type === 'points' ? ' pts' : ''}
                              </span>
                            ) : (
                              <span style={{color: 'var(--text-muted)', fontStyle: 'italic'}}>No value</span>
                            )}
                          </td>
                          <td>
                            <div style={{fontWeight: '600', color: 'var(--text-primary)'}}>
                              {reward.probability_weight}%
                            </div>
                          </td>
                          <td>
                            <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                              <div style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                background: reward.display_color || '#3b82f6',
                                border: '1px solid var(--border-glass)'
                              }}></div>
                              <span style={{fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-secondary)'}}>
                                {reward.display_color || '#3b82f6'}
                              </span>
                            </div>
                          </td>
                          <td>
                            {reward.coupon_code ? (
                              <div>
                                <div style={{fontWeight: '500', color: 'var(--text-primary)', fontSize: '0.875rem'}}>
                                  {reward.coupon_code}
                                </div>
                                {reward.coupon_title && (
                                  <div style={{fontSize: '0.75rem', color: 'var(--text-secondary)'}}>
                                    {reward.coupon_title}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span style={{color: 'var(--text-muted)', fontStyle: 'italic'}}>
                                No coupon
                              </span>
                            )}
                          </td>
                          <td>
                            <span className={`status-badge ${reward.is_active ? 'success' : 'error'}`}>
                              {reward.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button 
                                className="action-btn edit"
                                onClick={() => navigate(`/daily-rewards/rewards/${reward.id}/edit`)}
                                title="Edit Reward"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button 
                                className="action-btn delete"
                                onClick={() => handleDeleteReward(reward.id, reward.display_text)}
                                title="Delete Reward"
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
              ) : (
                <div className="empty-state">
                  <Gift className="empty-state-icon" />
                  <h3 className="empty-state-title">No rewards configured</h3>
                  <p className="empty-state-description">
                    Add rewards to this campaign to create a spin wheel experience for users.
                  </p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => navigate(`/daily-rewards/rewards/add?campaign_id=${campaign.id}`)}
                    style={{marginTop: 'var(--spacing-md)'}}
                  >
                    <Plus size={16} />
                    Add First Reward
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyRewardsDetails;