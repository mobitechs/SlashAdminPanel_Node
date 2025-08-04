// pages/UserDetails.js - FIXED: Real data only, proper data processing + Referrals Tab + VIP Display
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Edit, Trash2, Mail, Phone, MapPin, Calendar,
  User, Shield, Clock, CheckCircle, DollarSign, TrendingUp, Wallet,
  CreditCard, Gift, Activity, Home, ChevronRight, Eye, Users, Crown
} from 'lucide-react';
import ErrorState from '../components/common/ErrorState';
import '../styles/AdminStyles.css';

const UserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // State for showing full lists
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [showAllRewards, setShowAllRewards] = useState(false);
  const [showAllReferrals, setShowAllReferrals] = useState(false);

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

  // Fetch user details
  const fetchUserDetails = async () => {
    try {
      setError(null);
      console.log(`🔄 Fetching user details for ID: ${id}`);
      
      const possibleEndpoints = [
        `${API_BASE_URL}/users/${id}`,
        `/api/users/${id}`,
        `/users/${id}`
      ];

      let lastError = null;
      let userData = null;

      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`🔄 Trying user details endpoint: ${endpoint}`);
          
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: getHeaders(),
            credentials: 'include'
          });

          console.log(`📡 User details response status: ${response.status}`);

          if (response.ok) {
            const data = await response.json();
            console.log('✅ User Details API Response:', JSON.stringify(data, null, 2));
            userData = data;
            break;
          } else if (response.status === 404) {
            throw new Error(`User with ID ${id} not found`);
          } else {
            const errorText = await response.text();
            console.warn(`⚠️ User details endpoint ${endpoint} failed:`, response.status, errorText);
            lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        } catch (err) {
          console.warn(`⚠️ User details endpoint ${endpoint} error:`, err.message);
          lastError = err;
          
          if (err.message.includes('not found') || err.message.includes('404')) {
            throw err;
          }
          continue;
        }
      }

      if (!userData) {
        throw lastError || new Error(`Failed to fetch user data for ID: ${id}. Please check if the user exists.`);
      }

      const processedUser = processUserData(userData);
      if (!processedUser.id) {
        throw new Error(`Invalid user data received for ID: ${id}`);
      }
      
      setUser(processedUser);
      console.log('✅ User details loaded successfully:', processedUser);

    } catch (error) {
      console.error(`❌ Failed to fetch user ${id}:`, error.message);
      setError(error.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch referrals for the current user
  const fetchReferrals = async () => {
    try {
      console.log(`🔄 Fetching referrals for user ID: ${id}`);
      
      const possibleEndpoints = [
        `${API_BASE_URL}/users/${id}/referrals`,
        `/api/users/${id}/referrals`,
        `${API_BASE_URL}/referrals?referrer_user_id=${id}`,
        `/api/referrals?referrer_user_id=${id}`
      ];

      let referralsData = [];

      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`🔄 Trying referrals endpoint: ${endpoint}`);
          
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: getHeaders(),
            credentials: 'include'
          });

          if (response.ok) {
            const data = await response.json();
            console.log('✅ Referrals API Response:', JSON.stringify(data, null, 2));
            
            // FIXED: Process referrals data based on your backend response structure
            if (data.success && data.data && data.data.referrals) {
              referralsData = Array.isArray(data.data.referrals) ? data.data.referrals : [];
              console.log(`✅ Successfully extracted ${referralsData.length} referrals from API response`);
            } else if (data.success && Array.isArray(data.data)) {
              referralsData = data.data;
            } else if (Array.isArray(data)) {
              referralsData = data;
            } else {
              console.warn('⚠️ Unexpected referrals API response structure:', data);
            }
            break;
          } else {
            console.warn(`⚠️ Referrals endpoint ${endpoint} failed with status:`, response.status);
          }
        } catch (err) {
          console.warn(`⚠️ Referrals endpoint ${endpoint} error:`, err.message);
          continue;
        }
      }

      console.log(`✅ Final referrals data:`, referralsData);
      console.log(`✅ Found ${referralsData.length} referrals`);
      return referralsData;

    } catch (error) {
      console.error('❌ Error fetching referrals:', error);
      return []; // Return empty array on error
    }
  };

        // FIXED: Process user data from API response - handle your exact backend structure
  const processUserData = (rawData) => {
    try {
      console.log('🔍 Processing raw API data:', rawData);
      
      let userData = null;
      let transactions = [];
      let rewards = [];
      
      // Handle your backend structure: { success: true, data: { user: {...}, recentTransactions: [...], rewards: [...] } }
      if (rawData.success && rawData.data) {
        userData = rawData.data.user || rawData.data;
        
        // FIXED: Get transactions from the correct location
        transactions = rawData.data.recentTransactions || 
                      rawData.data.transactions || 
                      rawData.recentTransactions || 
                      rawData.transactions || 
                      [];
                      
        // FIXED: Get rewards from the correct location
        rewards = rawData.data.rewards || 
                 rawData.rewards || 
                 [];
      } else if (rawData.user) {
        userData = rawData.user;
        transactions = rawData.recentTransactions || rawData.transactions || [];
        rewards = rawData.rewards || [];
      } else if (rawData.id) {
        userData = rawData;
        transactions = rawData.recentTransactions || rawData.transactions || [];
        rewards = rawData.rewards || [];
      } else {
        console.error('❌ Unrecognized API response structure:', rawData);
        throw new Error('Invalid API response format - no user data found');
      }

      console.log('🔍 Extracted user data:', userData);
      console.log('🔍 Extracted transactions:', transactions);
      console.log('🔍 Extracted rewards:', rewards);

      if (!userData) {
        throw new Error('User data is null or undefined');
      }

      if (!userData.id) {
        console.error('❌ User data missing ID field:', userData);
        throw new Error('User data missing required ID field');
      }

      if (userData.id != id) {
        throw new Error(`User ID mismatch: expected ${id}, got ${userData.id}`);
      }

      // FIXED: Attach transactions and rewards to user data
      userData.transactions = Array.isArray(transactions) ? transactions : [];
      userData.rewards = Array.isArray(rewards) ? rewards : [];

      console.log('✅ Final processed user data:');
      console.log('📊 Transactions found:', userData.transactions.length);
      console.log('🎁 Rewards found:', userData.rewards.length);
      console.log('📝 First transaction:', userData.transactions[0]);
      console.log('🎁 First reward:', userData.rewards[0]);
      
      return userData;
    } catch (error) {
      console.error('❌ Error processing user data:', error);
      console.error('Raw data that caused error:', rawData);
      throw error;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchUserDetails();
      
      // Fetch referrals after user details are loaded
      if (user && user.id) {
        const referrals = await fetchReferrals();
        setUser(prevUser => ({
          ...prevUser,
          referrals: referrals
        }));
      }
    };

    loadData();
  }, [id]);

  // Fetch referrals when user data is loaded
  useEffect(() => {
    if (user && user.id && !user.referrals) {
      fetchReferrals().then(referrals => {
        setUser(prevUser => ({
          ...prevUser,
          referrals: referrals
        }));
      });
    }
  }, [user]);

  // Functions to get limited lists
  const getDisplayedTransactions = () => {
    if (!user?.transactions || !Array.isArray(user.transactions)) {
      console.log('🔍 No transactions found or not an array:', user?.transactions);
      return [];
    }
    console.log(`🔍 Displaying ${showAllTransactions ? 'all' : 'top 5'} of ${user.transactions.length} transactions`);
    return showAllTransactions ? user.transactions : user.transactions.slice(0, 5);
  };

  const getDisplayedRewards = () => {
    if (!user?.rewards || !Array.isArray(user.rewards)) {
      console.log('🔍 No rewards found or not an array:', user?.rewards);
      return [];
    }
    console.log(`🔍 Displaying ${showAllRewards ? 'all' : 'top 5'} of ${user.rewards.length} rewards`);
    return showAllRewards ? user.rewards : user.rewards.slice(0, 5);
  };

  const getDisplayedReferrals = () => {
    if (!user?.referrals || !Array.isArray(user.referrals)) {
      console.log('🔍 No referrals found or not an array:', user?.referrals);
      return [];
    }
    console.log(`🔍 Displaying ${showAllReferrals ? 'all' : 'top 5'} of ${user.referrals.length} referrals`);
    return showAllReferrals ? user.referrals : user.referrals.slice(0, 5);
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

  // NEW: VIP Status Helper
  const getVipStatus = () => {
    if (!user?.is_vip || user.is_vip === 0) {
      return { isVip: false, status: 'Regular User', color: 'var(--text-muted)' };
    }

    const now = new Date();
    const startDate = user.vip_start_date ? new Date(user.vip_start_date) : null;
    const endDate = user.vip_end_date ? new Date(user.vip_end_date) : null;

    if (!startDate || !endDate) {
      return { isVip: true, status: 'VIP (No dates set)', color: 'var(--warning-text)' };
    }

    if (now < startDate) {
      return { isVip: true, status: 'VIP (Upcoming)', color: 'var(--info-text)' };
    } else if (now > endDate) {
      return { isVip: true, status: 'VIP (Expired)', color: 'var(--error-text)' };
    } else {
      return { isVip: true, status: 'VIP (Active)', color: 'var(--success-text)' };
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'transaction_made':
        return 'var(--success-text)';
      case 'signed_up':
        return 'var(--warning-text)';
      case 'link_sent':
        return 'var(--text-muted)';
      default:
        return 'var(--text-secondary)';
    }
  };

  const getStatusDisplayText = (status) => {
    switch (status) {
      case 'transaction_made':
        return 'Completed';
      case 'signed_up':
        return 'Signed Up';
      case 'link_sent':
        return 'Pending';
      default:
        return status;
    }
  };

  const handleDeleteUser = async () => {
    if (!window.confirm('Are you sure you want to deactivate this user? This will set their status to inactive.')) {
      return;
    }

    try {
      const deleteEndpoints = [
        `${API_BASE_URL}/users/${id}`,
        `${API_BASE_URL}/admin/users/${id}`,
        `/api/users/${id}`
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
        alert('User deactivated successfully');
        navigate('/users');
      } else {
        throw new Error('Deactivation failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to deactivate user. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading User #{id}...</p>
        </div>
      </div>
    );
  }

  // Show error state if API failed and no user data
  if (error && !user) {
    return (
      <div className="page-container">
        <div className="chart-card">
          <ErrorState
            title="Failed to Load User"
            message={error}
            onRetry={fetchUserDetails}
            backTo="/users"
            backText="Back to Users List"
            debugInfo={{
              "User ID": id,
              "API Base URL": API_BASE_URL,
              "Expected Endpoint": `${API_BASE_URL}/users/${id}`,
              "Error": error
            }}
          />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-container">
        <ErrorState
          title="User not found"
          message={`User #${id} does not exist in the database`}
          showRetry={false}
          backTo="/users"
          backText="Back to Users"
          showDebugInfo={false}
        />
      </div>
    );
  }

  const vipStatus = getVipStatus();

  return (
    <div className="page-container">
      {/* Header with Profile Icon, User ID, Name, VIP Status, and Action Buttons */}
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
        <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
          <h1 style={{
            fontSize: '1.5rem', 
            fontWeight: '600', 
            color: 'var(--text-primary)',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)'
          }}>
            <User size={24} style={{color: 'var(--text-muted)'}} />
            #{user.id} {user.first_name} {user.last_name}
          </h1>
          
          {/* NEW: VIP Status Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-xs)',
            background: vipStatus.isVip ? 'rgba(255, 215, 0, 0.1)' : 'var(--bg-glass-light)',
            border: `1px solid ${vipStatus.isVip ? 'rgba(255, 215, 0, 0.3)' : 'var(--border-glass)'}`,
            borderRadius: 'var(--radius-md)',
            padding: 'var(--spacing-xs) var(--spacing-sm)',
          }}>
            <Crown size={16} style={{color: vipStatus.isVip ? '#FFD700' : 'var(--text-muted)'}} />
            <span style={{
              fontSize: '0.75rem',
              fontWeight: '500',
              color: vipStatus.color
            }}>
              {vipStatus.status}
            </span>
          </div>
        </div>
        
        <div style={{display: 'flex', gap: 'var(--spacing-md)'}}>
          <Link to={`/users/${user.id}/edit`} className="btn btn-secondary">
            <Edit size={16} />
            Edit User
          </Link>
          <button 
            className="btn btn-secondary"
            onClick={handleDeleteUser}
            style={{background: 'var(--error-bg)', borderColor: 'var(--error-border)', color: 'var(--error-text)'}}
          >
            <Trash2 size={16} />
            Deactivate
          </button>
        </div>
      </div>

      {/* Wallet Stats */}
      <div className="stats-grid" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 'var(--spacing-xl)'}}>
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Available Cashback</h3>
              <div className="stat-value">{formatCurrency(user.available_cashback)}</div>
              <p className="stat-subtitle">Current balance</p>
            </div>
            <div className="stat-icon" style={{background: 'var(--gradient-green)'}}>
              <Wallet />
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Total Earned</h3>
              <div className="stat-value">{formatCurrency(user.total_cashback_earned)}</div>
              <p className="stat-subtitle">Lifetime earnings</p>
            </div>
            <div className="stat-icon" style={{background: 'var(--gradient-blue)'}}>
              <TrendingUp />
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Cashback Used</h3>
              <div className="stat-value">{formatCurrency(user.total_cashback_redeemed)}</div>
              <p className="stat-subtitle">Redeemed amount</p>
            </div>
            <div className="stat-icon" style={{background: 'var(--gradient-orange)'}}>
              <CreditCard />
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Coupons Used</h3>
              <div className="stat-value">{formatCurrency(user.total_coupon_redeemed)}</div>
              <p className="stat-subtitle">Coupon savings</p>
            </div>
            <div className="stat-icon" style={{background: 'var(--gradient-purple)'}}>
              <Gift />
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
            <User size={16} />
            Overview
          </button>
          <button 
            className={`tab-button ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('transactions')}
            style={{
              padding: 'var(--spacing-md) var(--spacing-lg)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'transactions' ? '2px solid var(--text-primary)' : '2px solid transparent',
              color: activeTab === 'transactions' ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            <Activity size={16} />
            Transactions ({(user.transactions && user.transactions.length) || 0})
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
            <Gift size={16} />
            Rewards ({(user.rewards && user.rewards.length) || 0})
          </button>
          <button 
            className={`tab-button ${activeTab === 'referrals' ? 'active' : ''}`}
            onClick={() => setActiveTab('referrals')}
            style={{
              padding: 'var(--spacing-md) var(--spacing-lg)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'referrals' ? '2px solid var(--text-primary)' : '2px solid transparent',
              color: activeTab === 'referrals' ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            <Users size={16} />
            Referrals ({(user.referrals && user.referrals.length) || 0})
          </button>
        </div>

        <div style={{padding: 'var(--spacing-lg)'}}>
          {activeTab === 'overview' && (
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-xl)'}}>
              {/* Contact Information */}
              <div>
                <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                  <Mail size={18} />
                  Contact Information
                </h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <Mail size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Email</div>
                      <div style={{color: 'var(--text-secondary)'}}>{user.email}</div>
                    </div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <Phone size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Phone</div>
                      <div style={{color: 'var(--text-secondary)'}}>{user.phone_number || 'N/A'}</div>
                    </div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <Shield size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Status</div>
                      <div style={{color: user.is_active === 1 ? 'var(--success-text)' : 'var(--error-text)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)'}}>
                        <CheckCircle size={14} />
                        {user.is_active === 1 ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <CheckCircle size={16} style={{color: user.is_email_verified === 1 ? 'var(--success-text)' : 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Email Verified</div>
                      <div style={{color: user.is_email_verified === 1 ? 'var(--success-text)' : 'var(--text-muted)'}}>
                        {user.is_email_verified === 1 ? 'Yes' : 'No'}
                      </div>
                    </div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <CheckCircle size={16} style={{color: user.is_phone_verified === 1 ? 'var(--success-text)' : 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Phone Verified</div>
                      <div style={{color: user.is_phone_verified === 1 ? 'var(--success-text)' : 'var(--text-muted)'}}>
                        {user.is_phone_verified === 1 ? 'Yes' : 'No'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Information */}
              <div>
                <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                  <User size={18} />
                  Profile Information
                </h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <User size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Full Name</div>
                      <div style={{color: 'var(--text-secondary)'}}>{user.first_name} {user.last_name}</div>
                    </div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <User size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Gender</div>
                      <div style={{color: 'var(--text-secondary)'}}>{user.gender || 'N/A'}</div>
                    </div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <Calendar size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Date of Birth</div>
                      <div style={{color: 'var(--text-secondary)'}}>{formatDate(user.date_of_birth)}</div>
                    </div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <Calendar size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Anniversary Date</div>
                      <div style={{color: 'var(--text-secondary)'}}>{formatDate(user.anniversary_date)}</div>
                    </div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <Calendar size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Spouse Birth Date</div>
                      <div style={{color: 'var(--text-secondary)'}}>{formatDate(user.spouse_birth_date)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address & Account Information */}
              <div>
                <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                  <Home size={18} />
                  Address & Account
                </h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <Home size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Building</div>
                      <div style={{color: 'var(--text-secondary)'}}>{user.address_building || 'N/A'}</div>
                    </div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <MapPin size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Street</div>
                      <div style={{color: 'var(--text-secondary)'}}>{user.address_street || 'N/A'}</div>
                    </div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <MapPin size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>City, State</div>
                      <div style={{color: 'var(--text-secondary)'}}>
                        {user.address_city && user.address_state 
                          ? `${user.address_city}, ${user.address_state}` 
                          : user.address_city || user.address_state || 'N/A'
                        }
                      </div>
                    </div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <MapPin size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>PIN Code</div>
                      <div style={{color: 'var(--text-secondary)'}}>{user.address_pincode || 'N/A'}</div>
                    </div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <Calendar size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Join Date</div>
                      <div style={{color: 'var(--text-secondary)'}}>{formatDate(user.created_at)}</div>
                    </div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <Clock size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Last Login</div>
                      <div style={{color: 'var(--text-secondary)'}}>{formatDateTime(user.last_login)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* NEW: VIP Information Section */}
              <div>
                <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                  <Crown size={18} style={{color: '#FFD700'}} />
                  VIP Information
                </h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <Crown size={16} style={{color: vipStatus.isVip ? '#FFD700' : 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>VIP Status</div>
                      <div style={{color: vipStatus.color, fontWeight: '500'}}>
                        {vipStatus.status}
                      </div>
                    </div>
                  </div>
                  
                  {user.is_vip === 1 && (
                    <>
                      <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                        <Calendar size={16} style={{color: 'var(--text-muted)'}} />
                        <div>
                          <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>VIP Start Date</div>
                          <div style={{color: 'var(--text-secondary)'}}>{formatDate(user.vip_start_date)}</div>
                        </div>
                      </div>
                      
                      <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                        <Calendar size={16} style={{color: 'var(--text-muted)'}} />
                        <div>
                          <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>VIP End Date</div>
                          <div style={{color: 'var(--text-secondary)'}}>{formatDate(user.vip_end_date)}</div>
                        </div>
                      </div>
                      
                      {user.vip_start_date && user.vip_end_date && (
                        <div style={{
                          background: 'var(--bg-glass-light)',
                          border: '1px solid var(--border-glass)',
                          borderRadius: 'var(--radius-md)',
                          padding: 'var(--spacing-md)',
                          marginTop: 'var(--spacing-sm)'
                        }}>
                          <div style={{fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-xs)'}}>
                            VIP Duration
                          </div>
                          <div style={{color: 'var(--text-secondary)', fontSize: '0.875rem'}}>
                            {(() => {
                              const start = new Date(user.vip_start_date);
                              const end = new Date(user.vip_end_date);
                              const diffTime = Math.abs(end - start);
                              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                              return `${diffDays} days`;
                            })()}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)'}}>
                <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0}}>
                  Transaction History
                </h3>
                {user.transactions && user.transactions.length > 5 && !showAllTransactions && (
                  <span style={{fontSize: '0.875rem', color: 'var(--text-muted)'}}>
                    Showing {Math.min(5, user.transactions.length)} of {user.transactions.length} transactions
                  </span>
                )}
              </div>
              
              {getDisplayedTransactions().length > 0 ? (
                <>
                  <div style={{overflowX: 'auto'}}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Transaction ID</th>
                          <th>Store</th>
                          <th>Bill Amount</th>
                          <th>Final Amount</th>
                          <th>Cashback Used</th>
                          <th>Status</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getDisplayedTransactions().map((transaction) => (
                          <tr key={transaction.id}>
                            <td style={{fontWeight: '500'}}>{transaction.transaction_number}</td>
                            <td>{transaction.store_name || 'N/A'}</td>
                            <td>{formatCurrency(transaction.bill_amount)}</td>
                            <td>{formatCurrency(transaction.final_amount)}</td>
                            <td style={{color: 'var(--success-text)'}}>{formatCurrency(transaction.cashback_used)}</td>
                            <td>
                              <span className={`status-badge ${transaction.payment_status}`}>
                                {transaction.payment_status}
                              </span>
                            </td>
                            <td className="date-cell">{formatDate(transaction.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* See More/Show Less Button for Transactions */}
                  {user.transactions && user.transactions.length > 5 && (
                    <div style={{textAlign: 'center', marginTop: 'var(--spacing-lg)'}}>
                      <button 
                        className="btn btn-secondary"
                        onClick={() => setShowAllTransactions(!showAllTransactions)}
                        style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', margin: '0 auto'}}
                      >
                        {showAllTransactions ? (
                          <>
                            <Eye size={16} />
                            Show Less
                          </>
                        ) : (
                          <>
                            <ChevronRight size={16} />
                            See More ({user.transactions.length - 5} more)
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <ErrorState
                  title="No transactions found"
                  message="This user hasn't made any transactions yet."
                  showRetry={false}
                  showBackButton={false}
                  showDebugInfo={false}
                />
              )}
            </div>
          )}

          {activeTab === 'rewards' && (
            <div>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)'}}>
                <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0}}>
                  Reward History
                </h3>
                {user.rewards && user.rewards.length > 5 && !showAllRewards && (
                  <span style={{fontSize: '0.875rem', color: 'var(--text-muted)'}}>
                    Showing {Math.min(5, user.rewards.length)} of {user.rewards.length} rewards
                  </span>
                )}
              </div>
              
              {getDisplayedRewards().length > 0 ? (
                <>
                  <div style={{overflowX: 'auto'}}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Amount</th>
                          <th>Description</th>
                          <th>Transaction</th>
                          <th>Transaction Amount</th>
                          <th>Store</th>
                          <th>Credit/Debit</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getDisplayedRewards().map((reward) => (
                          <tr key={reward.id}>
                            <td>
                              <span className="role-badge">{reward.reward_type}</span>
                            </td>
                            <td style={{color: reward.credit_debit === 'credit' ? 'var(--success-text)' : 'var(--error-text)'}}>
                              {reward.credit_debit === 'credit' ? '+' : '-'}{formatCurrency(reward.amount)}
                            </td>
                            <td>{reward.description}</td>
                            <td>
                              {reward.transaction_number ? (
                                <span style={{fontWeight: '500', color: 'var(--text-primary)'}}>
                                  {reward.transaction_number}
                                </span>
                              ) : (
                                <span style={{color: 'var(--text-muted)', fontStyle: 'italic'}}>
                                  Non-transaction
                                </span>
                              )}
                            </td>
                            <td>
                              {reward.bill_amount && reward.final_amount ? (
                                <div>
                                  <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>
                                    Bill: {formatCurrency(reward.bill_amount)}
                                  </div>
                                  <div style={{fontSize: '0.875rem', fontWeight: '500'}}>
                                    Final: {formatCurrency(reward.final_amount)}
                                  </div>
                                </div>
                              ) : (
                                <span style={{color: 'var(--text-muted)'}}>N/A</span>
                              )}
                            </td>
                            <td>
                              {reward.store_name ? (
                                <span style={{color: 'var(--text-primary)'}}>
                                  {reward.store_name}
                                </span>
                              ) : (
                                <span style={{color: 'var(--text-muted)'}}>N/A</span>
                              )}
                            </td>
                            <td>
                              <span className={`status-badge ${reward.credit_debit}`}>
                                {reward.credit_debit}
                              </span>
                            </td>
                            <td className="date-cell">{formatDate(reward.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* See More/Show Less Button for Rewards */}
                  {user.rewards && user.rewards.length > 5 && (
                    <div style={{textAlign: 'center', marginTop: 'var(--spacing-lg)'}}>
                      <button 
                        className="btn btn-secondary"
                        onClick={() => setShowAllRewards(!showAllRewards)}
                        style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', margin: '0 auto'}}
                      >
                        {showAllRewards ? (
                          <>
                            <Eye size={16} />
                            Show Less
                          </>
                        ) : (
                          <>
                            <ChevronRight size={16} />
                            See More ({user.rewards.length - 5} more)
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <ErrorState
                  title="No rewards found"
                  message="This user hasn't earned any rewards yet."
                  showRetry={false}
                  showBackButton={false}
                  showDebugInfo={false}
                />
              )}
            </div>
          )}

          {activeTab === 'referrals' && (
            <div>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)'}}>
                <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0}}>
                  Referral History
                </h3>
                {user.referrals && user.referrals.length > 5 && !showAllReferrals && (
                  <span style={{fontSize: '0.875rem', color: 'var(--text-muted)'}}>
                    Showing {Math.min(5, user.referrals.length)} of {user.referrals.length} referrals
                  </span>
                )}
              </div>
              
              {getDisplayedReferrals().length > 0 ? (
                <>
                  <div style={{overflowX: 'auto'}}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Referred User</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Status</th>
                          <th>Reward Earned</th>
                          <th>Referred Date</th>
                          <th>Signup Date</th>
                          <th>First Transaction</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getDisplayedReferrals().map((referral) => (
                          <tr key={referral.id}>
                            <td style={{fontWeight: '500'}}>
                              {referral.referred_first_name && referral.referred_last_name ? (
                                <span style={{color: 'var(--text-primary)'}}>
                                  {referral.referred_first_name} {referral.referred_last_name}
                                </span>
                              ) : (
                                <span style={{color: 'var(--text-muted)', fontStyle: 'italic'}}>
                                  Pending Signup
                                </span>
                              )}
                            </td>
                            <td>
                              {referral.referred_email ? (
                                <span style={{color: 'var(--text-secondary)'}}>
                                  {referral.referred_email}
                                </span>
                              ) : (
                                <span style={{color: 'var(--text-muted)'}}>N/A</span>
                              )}
                            </td>
                            <td>
                              {referral.referred_phone ? (
                                <span style={{color: 'var(--text-secondary)'}}>
                                  {referral.referred_phone}
                                </span>
                              ) : (
                                <span style={{color: 'var(--text-muted)'}}>N/A</span>
                              )}
                            </td>
                            <td>
                              <span 
                                className="status-badge"
                                style={{
                                  color: getStatusColor(referral.referral_status),
                                  borderColor: getStatusColor(referral.referral_status)
                                }}
                              >
                                {getStatusDisplayText(referral.referral_status)}
                              </span>
                            </td>
                            <td style={{color: 'var(--success-text)', fontWeight: '500'}}>
                              {formatCurrency(referral.reward_earned)}
                            </td>
                            <td className="date-cell">{formatDate(referral.referred_date)}</td>
                            <td className="date-cell">
                              {referral.signup_date ? formatDate(referral.signup_date) : (
                                <span style={{color: 'var(--text-muted)'}}>Pending</span>
                              )}
                            </td>
                            <td className="date-cell">
                              {referral.first_transaction_date ? formatDate(referral.first_transaction_date) : (
                                <span style={{color: 'var(--text-muted)'}}>None</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* See More/Show Less Button for Referrals */}
                  {user.referrals && user.referrals.length > 5 && (
                    <div style={{textAlign: 'center', marginTop: 'var(--spacing-lg)'}}>
                      <button 
                        className="btn btn-secondary"
                        onClick={() => setShowAllReferrals(!showAllReferrals)}
                        style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', margin: '0 auto'}}
                      >
                        {showAllReferrals ? (
                          <>
                            <Eye size={16} />
                            Show Less
                          </>
                        ) : (
                          <>
                            <ChevronRight size={16} />
                            See More ({user.referrals.length - 5} more)
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <ErrorState
                  title="No referrals found"
                  message="This user hasn't referred anyone yet."
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

export default UserDetails;