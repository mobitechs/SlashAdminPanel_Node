// pages/RewardDetails.js - Reward Details Page
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Edit, Trash2, Tag, Calendar, Clock,
  Gift, Shield, Target, CheckCircle, Award, Star, 
  Activity, Home, ChevronRight, Eye, Users, TrendingUp
} from 'lucide-react';
import ErrorState from '../components/common/ErrorState';
import '../styles/AdminStyles.css';

const RewardDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reward, setReward] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // State for showing full lists
  const [showAllHistory, setShowAllHistory] = useState(false);

  // API Configuration
  const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';
  
  const getAuthToken = () => {
    return localStorage.getItem('token') || 
           localStorage.getItem('authToken') || 
           localStorage.getItem('accessToken') ||
           sessionStorage.getItem('token') ||
           sessionStorage.getItem('authToken');
  };

  const getHeaders = () => {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  };

  // Fetch reward details
  const fetchRewardDetails = async () => {
    try {
      setError(null);
      console.log(`🔄 Fetching reward details for ID: ${id}`);
      
      const possibleEndpoints = [
        `${API_BASE_URL}/rewards/${id}`,
        `/api/rewards/${id}`,
        `/rewards/${id}`
      ];

      let lastError = null;
      let rewardData = null;

      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`🔄 Trying reward details endpoint: ${endpoint}`);
          
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: getHeaders(),
            credentials: 'include'
          });

          console.log(`📡 Reward details response status: ${response.status}`);

          if (response.ok) {
            const data = await response.json();
            console.log('✅ Reward Details API Response:', JSON.stringify(data, null, 2));
            rewardData = data;
            break;
          } else if (response.status === 404) {
            throw new Error(`Reward with ID ${id} not found`);
          } else {
            const errorText = await response.text();
            console.warn(`⚠️ Reward details endpoint ${endpoint} failed:`, response.status, errorText);
            lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        } catch (err) {
          console.warn(`⚠️ Reward details endpoint ${endpoint} error:`, err.message);
          lastError = err;
          
          if (err.message.includes('not found') || err.message.includes('404')) {
            throw err;
          }
          continue;
        }
      }

      if (!rewardData) {
        throw lastError || new Error(`Failed to fetch reward data for ID: ${id}. Please check if the reward exists.`);
      }

      const processedReward = processRewardData(rewardData);
      if (!processedReward.id) {
        throw new Error(`Invalid reward data received for ID: ${id}`);
      }
      
      setReward(processedReward);
      console.log('✅ Reward details loaded successfully:', processedReward);

    } catch (error) {
      console.error(`❌ Failed to fetch reward ${id}:`, error.message);
      setError(error.message);
      setReward(null);
    } finally {
      setLoading(false);
    }
  };

  // Process reward data from API response
  const processRewardData = (rawData) => {
    try {
      console.log('🔍 Processing raw API data:', rawData);
      
      let rewardData = null;
      let recentHistory = [];
      
      // Handle backend structure: { success: true, data: { reward: {...}, recentHistory: [...] } }
      if (rawData.success && rawData.data) {
        rewardData = rawData.data.reward || rawData.data;
        
        // Get recent history from the correct location
        recentHistory = rawData.data.recentHistory || 
                       rawData.data.history || 
                       rawData.recentHistory || 
                       rawData.history || 
                       [];
      } else if (rawData.reward) {
        rewardData = rawData.reward;
        recentHistory = rawData.recentHistory || rawData.history || [];
      } else if (rawData.id) {
        rewardData = rawData;
        recentHistory = rawData.recentHistory || rawData.history || [];
      } else {
        console.error('❌ Unrecognized API response structure:', rawData);
        throw new Error('Invalid API response format - no reward data found');
      }

      console.log('🔍 Extracted reward data:', rewardData);
      console.log('🔍 Extracted recent history:', recentHistory);

      if (!rewardData) {
        throw new Error('Reward data is null or undefined');
      }

      if (!rewardData.id) {
        console.error('❌ Reward data missing ID field:', rewardData);
        throw new Error('Reward data missing required ID field');
      }

      if (rewardData.id != id) {
        throw new Error(`Reward ID mismatch: expected ${id}, got ${rewardData.id}`);
      }

      // Attach history data to reward
      rewardData.recentHistory = Array.isArray(recentHistory) ? recentHistory : [];

      console.log('✅ Final processed reward data:');
      console.log('📊 Recent history found:', rewardData.recentHistory.length);
      console.log('📝 First history:', rewardData.recentHistory[0]);
      
      return rewardData;
    } catch (error) {
      console.error('❌ Error processing reward data:', error);
      console.error('Raw data that caused error:', rawData);
      throw error;
    }
  };

  useEffect(() => {
    fetchRewardDetails();
  }, [id]);

  // Functions to get limited lists
  const getDisplayedHistory = () => {
    if (!reward?.recentHistory || !Array.isArray(reward.recentHistory)) {
      console.log('🔍 No recent history found or not an array:', reward?.recentHistory);
      return [];
    }
    console.log(`🔍 Displaying ${showAllHistory ? 'all' : 'top 10'} of ${reward.recentHistory.length} history entries`);
    return showAllHistory ? reward.recentHistory : reward.recentHistory.slice(0, 10);
  };

  // Helper functions
  const formatCurrency = (amount) => {
    const num = parseFloat(amount) || 0;
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

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

  const getRewardStatus = (reward) => {
    if (!reward.is_active) return { status: 'Inactive', color: 'error' };
    return { status: 'Active', color: 'success' };
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

  const handleDeleteReward = async () => {
    if (!window.confirm('Are you sure you want to deactivate this reward? This will set its status to inactive.')) {
      return;
    }

    try {
      const deleteEndpoints = [
        `${API_BASE_URL}/rewards/${id}`,
        `${API_BASE_URL}/admin/rewards/${id}`,
        `/api/rewards/${id}`
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
        alert('Reward deactivated successfully');
        navigate('/rewards');
      } else {
        throw new Error('Deactivation failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to deactivate reward. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading Reward #{id}...</p>
        </div>
      </div>
    );
  }

  // Show error state if API failed and no reward data
  if (error && !reward) {
    return (
      <div className="page-container">
        <div className="chart-card">
          <ErrorState
            title="Failed to Load Reward"
            message={error}
            onRetry={fetchRewardDetails}
            backTo="/rewards"
            backText="Back to Rewards List"
            debugInfo={{
              "Reward ID": id,
              "API Base URL": API_BASE_URL,
              "Expected Endpoint": `${API_BASE_URL}/rewards/${id}`,
              "Error": error
            }}
          />
        </div>
      </div>
    );
  }

  if (!reward) {
    return (
      <div className="page-container">
        <ErrorState
          title="Reward not found"
          message={`Reward #${id} does not exist in the database`}
          showRetry={false}
          backTo="/rewards"
          backText="Back to Rewards"
          showDebugInfo={false}
        />
      </div>
    );
  }

  const status = getRewardStatus(reward);

  return (
    <div className="page-container">
      {/* Header with Reward Info and Action Buttons */}
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
          <Gift size={24} style={{color: 'var(--text-muted)'}} />
          #{reward.id} {reward.reward_name}
        </h1>
        
        <div style={{display: 'flex', gap: 'var(--spacing-md)'}}>
          <Link to={`/rewards/${reward.id}/edit`} className="btn btn-secondary">
            <Edit size={16} />
            Edit Reward
          </Link>
          <button 
            className="btn btn-secondary"
            onClick={handleDeleteReward}
            style={{background: 'var(--error-bg)', borderColor: 'var(--error-border)', color: 'var(--error-text)'}}
          >
            <Trash2 size={16} />
            Deactivate
          </button>
        </div>
      </div>

      {/* Reward Stats */}
      <div className="stats-grid" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 'var(--spacing-xl)'}}>
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Normal Users Value</h3>
              <div className="stat-value">{formatCurrency(reward.normal_users_reward_value)}</div>
              <p className="stat-subtitle">Standard reward</p>
            </div>
            <div className="stat-icon" style={{background: 'var(--gradient-green)'}}>
              <Target />
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>VIP Users Value</h3>
              <div className="stat-value">{reward.vip_users_reward_value ? formatCurrency(reward.vip_users_reward_value) : 'N/A'}</div>
              <p className="stat-subtitle">Premium reward</p>
            </div>
            <div className="stat-icon" style={{background: 'var(--gradient-purple)'}}>
              <Star />
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Total Distributed</h3>
              <div className="stat-value">{reward.total_awarded || 0}</div>
              <p className="stat-subtitle">Times distributed</p>
            </div>
            <div className="stat-icon" style={{background: 'var(--gradient-blue)'}}>
              <Activity />
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Total Credits</h3>
              <div className="stat-value">{formatCurrency(reward.total_credits)}</div>
              <p className="stat-subtitle">Total value given</p>
            </div>
            <div className="stat-icon" style={{background: 'var(--gradient-orange)'}}>
              <Award />
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
            Overview
          </button>
          <button 
            className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
            style={{
              padding: 'var(--spacing-md) var(--spacing-lg)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'history' ? '2px solid var(--text-primary)' : '2px solid transparent',
              color: activeTab === 'history' ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            <Activity size={16} />
            Distribution History ({(reward.recentHistory && reward.recentHistory.length) || 0})
          </button>
        </div>

        <div style={{padding: 'var(--spacing-lg)'}}>
          {activeTab === 'overview' && (
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-xl)'}}>
              {/* Reward Information */}
              <div>
                <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                  <Tag size={18} />
                  Reward Information
                </h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <Gift size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Reward Name</div>
                      <div style={{color: 'var(--text-secondary)', fontWeight: '600'}}>{reward.reward_name}</div>
                    </div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <Tag size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Reward Type</div>
                      <div style={{color: 'var(--text-secondary)'}}>{getRewardTypeDisplay(reward.reward_type)}</div>
                    </div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <Shield size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Status</div>
                      <div style={{color: status.color === 'success' ? 'var(--success-text)' : 'var(--error-text)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)'}}>
                        <CheckCircle size={14} />
                        {status.status}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reward Values */}
              <div>
                <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                  <Award size={18} />
                  Reward Values
                </h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <Target size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Normal Users</div>
                      <div style={{color: 'var(--success-text)', fontWeight: '600'}}>{formatCurrency(reward.normal_users_reward_value)}</div>
                    </div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <Star size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>VIP Users</div>
                      <div style={{color: 'var(--warning-text)', fontWeight: '600'}}>
                        {reward.vip_users_reward_value ? formatCurrency(reward.vip_users_reward_value) : 'Same as Normal Users'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div>
                <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                  <Activity size={18} />
                  Usage Statistics
                </h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <TrendingUp size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Total Distributed</div>
                      <div style={{color: 'var(--text-secondary)', fontWeight: '600'}}>{reward.total_awarded || 0} times</div>
                    </div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <Award size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Total Credits Given</div>
                      <div style={{color: 'var(--success-text)', fontWeight: '600'}}>{formatCurrency(reward.total_credits)}</div>
                    </div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <Calendar size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Created On</div>
                      <div style={{color: 'var(--text-secondary)'}}>{formatDate(reward.created_at)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)'}}>
                <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0}}>
                  Distribution History
                </h3>
                {reward.recentHistory && reward.recentHistory.length > 10 && !showAllHistory && (
                  <span style={{fontSize: '0.875rem', color: 'var(--text-muted)'}}>
                    Showing {Math.min(10, reward.recentHistory.length)} of {reward.recentHistory.length} distributions
                  </span>
                )}
              </div>
              
              {getDisplayedHistory().length > 0 ? (
                <>
                  <div style={{overflowX: 'auto'}}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Transaction</th>
                          <th>Amount</th>
                          <th>Description</th>
                          <th>Store</th>
                          <th>Credit/Debit</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getDisplayedHistory().map((history) => (
                          <tr key={history.id}>
                            <td>{history.user_name || 'N/A'}</td>
                            <td style={{fontWeight: '500'}}>{history.transaction_number || 'N/A'}</td>
                            <td style={{color: history.credit_debit === 'credit' ? 'var(--success-text)' : 'var(--error-text)'}}>
                              {history.credit_debit === 'credit' ? '+' : '-'}{formatCurrency(history.amount)}
                            </td>
                            <td>{history.description || 'N/A'}</td>
                            <td>{history.store_name || 'N/A'}</td>
                            <td>
                              <span className={`status-badge ${history.credit_debit}`}>
                                {history.credit_debit}
                              </span>
                            </td>
                            <td className="date-cell">{formatDateTime(history.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* See More/Show Less Button for History */}
                  {reward.recentHistory && reward.recentHistory.length > 10 && (
                    <div style={{textAlign: 'center', marginTop: 'var(--spacing-lg)'}}>
                      <button 
                        className="btn btn-secondary"
                        onClick={() => setShowAllHistory(!showAllHistory)}
                        style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', margin: '0 auto'}}
                      >
                        {showAllHistory ? (
                          <>
                            <Eye size={16} />
                            Show Less
                          </>
                        ) : (
                          <>
                            <ChevronRight size={16} />
                            See More ({reward.recentHistory.length - 10} more)
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <ErrorState
                  title="No distribution history found"
                  message="This reward hasn't been distributed yet."
                  showRetry={false}
                  showBackButton={false}
                  showDebugInfo={false}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RewardDetails;