// pages/CouponDetails.js - FIXED: Real data only, proper data processing
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Edit, Trash2, Tag, Store, Calendar, Clock,
  Ticket, Shield, Target, CheckCircle, Percent, Gift, 
  Activity, Home, ChevronRight, Eye, Users, TrendingUp
} from 'lucide-react';
import ErrorState from '../components/common/ErrorState';
import '../styles/AdminStyles.css';

const CouponDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [coupon, setCoupon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // State for showing full lists
  const [showAllUsages, setShowAllUsages] = useState(false);
  const [showAllUsers, setShowAllUsers] = useState(false);

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

  // Fetch coupon details
  const fetchCouponDetails = async () => {
    try {
      setError(null);
      console.log(`🔄 Fetching coupon details for ID: ${id}`);
      
      const possibleEndpoints = [
        `${API_BASE_URL}/coupons/${id}`,
        `/api/coupons/${id}`,
        `/coupons/${id}`
      ];

      let lastError = null;
      let couponData = null;

      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`🔄 Trying coupon details endpoint: ${endpoint}`);
          
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: getHeaders(),
            credentials: 'include'
          });

          console.log(`📡 Coupon details response status: ${response.status}`);

          if (response.ok) {
            const data = await response.json();
            console.log('✅ Coupon Details API Response:', JSON.stringify(data, null, 2));
            couponData = data;
            break;
          } else if (response.status === 404) {
            throw new Error(`Coupon with ID ${id} not found`);
          } else {
            const errorText = await response.text();
            console.warn(`⚠️ Coupon details endpoint ${endpoint} failed:`, response.status, errorText);
            lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        } catch (err) {
          console.warn(`⚠️ Coupon details endpoint ${endpoint} error:`, err.message);
          lastError = err;
          
          if (err.message.includes('not found') || err.message.includes('404')) {
            throw err;
          }
          continue;
        }
      }

      if (!couponData) {
        throw lastError || new Error(`Failed to fetch coupon data for ID: ${id}. Please check if the coupon exists.`);
      }

      const processedCoupon = processCouponData(couponData);
      if (!processedCoupon.id) {
        throw new Error(`Invalid coupon data received for ID: ${id}`);
      }
      
      setCoupon(processedCoupon);
      console.log('✅ Coupon details loaded successfully:', processedCoupon);

    } catch (error) {
      console.error(`❌ Failed to fetch coupon ${id}:`, error.message);
      setError(error.message);
      setCoupon(null);
    } finally {
      setLoading(false);
    }
  };

  // Process coupon data from API response - FIXED for real database structure
  const processCouponData = (rawData) => {
    try {
      console.log('🔍 Processing raw API data:', rawData);
      
      let couponData = null;
      let usages = [];
      let users = [];
      
      // Handle backend structure: { success: true, data: { coupon: {...}, usages: [...], users: [...] } }
      if (rawData.success && rawData.data) {
        couponData = rawData.data.coupon || rawData.data;
        
        // Get usages from the correct location
        usages = rawData.data.usages || 
                rawData.data.couponUsages || 
                rawData.usages || 
                rawData.couponUsages || 
                [];
                      
        // Get users from the correct location
        users = rawData.data.users || 
               rawData.users || 
               [];
      } else if (rawData.coupon) {
        couponData = rawData.coupon;
        usages = rawData.usages || rawData.couponUsages || [];
        users = rawData.users || [];
      } else if (rawData.id) {
        couponData = rawData;
        usages = rawData.usages || rawData.couponUsages || [];
        users = rawData.users || [];
      } else {
        console.error('❌ Unrecognized API response structure:', rawData);
        throw new Error('Invalid API response format - no coupon data found');
      }

      console.log('🔍 Extracted coupon data:', couponData);
      console.log('🔍 Extracted usages:', usages);
      console.log('🔍 Extracted users:', users);

      if (!couponData) {
        throw new Error('Coupon data is null or undefined');
      }

      if (!couponData.id) {
        console.error('❌ Coupon data missing ID field:', couponData);
        throw new Error('Coupon data missing required ID field');
      }

      if (couponData.id != id) {
        throw new Error(`Coupon ID mismatch: expected ${id}, got ${couponData.id}`);
      }

      // Attach usage data to coupon
      couponData.usages = Array.isArray(usages) ? usages : [];
      couponData.users = Array.isArray(users) ? users : [];

      console.log('✅ Final processed coupon data:');
      console.log('📊 Usages found:', couponData.usages.length);
      console.log('👥 Users found:', couponData.users.length);
      console.log('📝 First usage:', couponData.usages[0]);
      console.log('👤 First user:', couponData.users[0]);
      
      return couponData;
    } catch (error) {
      console.error('❌ Error processing coupon data:', error);
      console.error('Raw data that caused error:', rawData);
      throw error;
    }
  };

  useEffect(() => {
    fetchCouponDetails();
  }, [id]);

  // Functions to get limited lists
  const getDisplayedUsages = () => {
    if (!coupon?.usages || !Array.isArray(coupon.usages)) {
      console.log('🔍 No usages found or not an array:', coupon?.usages);
      return [];
    }
    console.log(`🔍 Displaying ${showAllUsages ? 'all' : 'top 10'} of ${coupon.usages.length} usages`);
    return showAllUsages ? coupon.usages : coupon.usages.slice(0, 10);
  };

  const getDisplayedUsers = () => {
    if (!coupon?.users || !Array.isArray(coupon.users)) {
      console.log('🔍 No users found or not an array:', coupon?.users);
      return [];
    }
    console.log(`🔍 Displaying ${showAllUsers ? 'all' : 'top 10'} of ${coupon.users.length} users`);
    return showAllUsers ? coupon.users : coupon.users.slice(0, 10);
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

  const getCouponStatus = (coupon) => {
    const now = new Date();
    const validUntil = new Date(coupon.valid_until);
    const validFrom = new Date(coupon.valid_from);
    
    if (!coupon.is_active) return { status: 'Inactive', color: 'error' };
    if (validUntil < now) return { status: 'Expired', color: 'error' };
    if (validFrom > now) return { status: 'Upcoming', color: 'warning' };
    return { status: 'Active', color: 'success' };
  };

  const getDiscountDisplay = (coupon) => {
    if (coupon.discount_percentage) {
      return `${coupon.discount_percentage}% OFF`;
    } else if (coupon.discount_amount) {
      return `₹${coupon.discount_amount} OFF`;
    }
    return 'N/A';
  };

  const handleDeleteCoupon = async () => {
    if (!window.confirm('Are you sure you want to deactivate this coupon? This will set its status to inactive.')) {
      return;
    }

    try {
      const deleteEndpoints = [
        `${API_BASE_URL}/coupons/${id}`,
        `${API_BASE_URL}/admin/coupons/${id}`,
        `/api/coupons/${id}`
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
        alert('Coupon deactivated successfully');
        navigate('/coupons');
      } else {
        throw new Error('Deactivation failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to deactivate coupon. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading Coupon #{id}...</p>
        </div>
      </div>
    );
  }

  // Show error state if API failed and no coupon data
  if (error && !coupon) {
    return (
      <div className="page-container">
        <div className="chart-card">
          <ErrorState
            title="Failed to Load Coupon"
            message={error}
            onRetry={fetchCouponDetails}
            backTo="/coupons"
            backText="Back to Coupons List"
            debugInfo={{
              "Coupon ID": id,
              "API Base URL": API_BASE_URL,
              "Expected Endpoint": `${API_BASE_URL}/coupons/${id}`,
              "Error": error
            }}
          />
        </div>
      </div>
    );
  }

  if (!coupon) {
    return (
      <div className="page-container">
        <ErrorState
          title="Coupon not found"
          message={`Coupon #${id} does not exist in the database`}
          showRetry={false}
          backTo="/coupons"
          backText="Back to Coupons"
          showDebugInfo={false}
        />
      </div>
    );
  }

  const status = getCouponStatus(coupon);

  return (
    <div className="page-container">
      {/* Header with Coupon Info and Action Buttons */}
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
          <Ticket size={24} style={{color: 'var(--text-muted)'}} />
          #{coupon.id} {coupon.code} - {coupon.title}
        </h1>
        
        <div style={{display: 'flex', gap: 'var(--spacing-md)'}}>
          <Link to={`/coupons/${coupon.id}/edit`} className="btn btn-secondary">
            <Edit size={16} />
            Edit Coupon
          </Link>
          <button 
            className="btn btn-secondary"
            onClick={handleDeleteCoupon}
            style={{background: 'var(--error-bg)', borderColor: 'var(--error-border)', color: 'var(--error-text)'}}
          >
            <Trash2 size={16} />
            Deactivate
          </button>
        </div>
      </div>

      {/* Coupon Stats */}
      <div className="stats-grid" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 'var(--spacing-xl)'}}>
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Discount Value</h3>
              <div className="stat-value">{getDiscountDisplay(coupon)}</div>
              <p className="stat-subtitle">
                {coupon.discount_percentage ? 'Percentage' : 'Fixed Amount'}
              </p>
            </div>
            <div className="stat-icon" style={{background: 'var(--gradient-green)'}}>
              <Percent />
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Usage Count</h3>
              <div className="stat-value">{coupon.total_used || 0}</div>
              <p className="stat-subtitle">
                Out of {coupon.usage_limit} limit
              </p>
            </div>
            <div className="stat-icon" style={{background: 'var(--gradient-blue)'}}>
              <Activity />
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Min Order</h3>
              <div className="stat-value">{formatCurrency(coupon.min_order_amount)}</div>
              <p className="stat-subtitle">Minimum requirement</p>
            </div>
            <div className="stat-icon" style={{background: 'var(--gradient-orange)'}}>
              <Target />
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Max Discount</h3>
              <div className="stat-value">{formatCurrency(coupon.max_discount)}</div>
              <p className="stat-subtitle">Maximum cap</p>
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
            <Ticket size={16} />
            Overview
          </button>
          <button 
            className={`tab-button ${activeTab === 'usages' ? 'active' : ''}`}
            onClick={() => setActiveTab('usages')}
            style={{
              padding: 'var(--spacing-md) var(--spacing-lg)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'usages' ? '2px solid var(--text-primary)' : '2px solid transparent',
              color: activeTab === 'usages' ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            <Activity size={16} />
            Usage History ({(coupon.usages && coupon.usages.length) || 0})
          </button>
          <button 
            className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
            style={{
              padding: 'var(--spacing-md) var(--spacing-lg)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'users' ? '2px solid var(--text-primary)' : '2px solid transparent',
              color: activeTab === 'users' ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            <Users size={16} />
            Users ({(coupon.users && coupon.users.length) || 0})
          </button>
        </div>

        <div style={{padding: 'var(--spacing-lg)'}}>
          {activeTab === 'overview' && (
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-xl)'}}>
              {/* Coupon Information */}
              <div>
                <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                  <Tag size={18} />
                  Coupon Information
                </h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <Tag size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Coupon Code</div>
                      <div style={{color: 'var(--text-secondary)', fontWeight: '600'}}>{coupon.code}</div>
                    </div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <Ticket size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Title</div>
                      <div style={{color: 'var(--text-secondary)'}}>{coupon.title}</div>
                    </div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <Gift size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Description</div>
                      <div style={{color: 'var(--text-secondary)'}}>{coupon.description || 'No description'}</div>
                    </div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <Shield size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Status</div>
                      <div style={{color: status.color === 'success' ? 'var(--success-text)' : status.color === 'error' ? 'var(--error-text)' : 'var(--warning-text)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)'}}>
                        <CheckCircle size={14} />
                        {status.status}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Store & Validity Information */}
              <div>
                <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                  <Store size={18} />
                  Store & Validity
                </h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <Store size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Applicable Store</div>
                      <div style={{color: 'var(--text-secondary)'}}>{coupon.store_name || 'All Stores'}</div>
                    </div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <Calendar size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Valid From</div>
                      <div style={{color: 'var(--text-secondary)'}}>{formatDate(coupon.valid_from)}</div>
                    </div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <Clock size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Valid Until</div>
                      <div style={{color: 'var(--text-secondary)'}}>{formatDate(coupon.valid_until)}</div>
                    </div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <Target size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Usage Limit</div>
                      <div style={{color: 'var(--text-secondary)'}}>{coupon.usage_limit} times</div>
                    </div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <Calendar size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Created On</div>
                      <div style={{color: 'var(--text-secondary)'}}>{formatDate(coupon.created_at)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Discount Details */}
              <div>
                <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                  <Percent size={18} />
                  Discount Details
                </h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)'}}>
                  {coupon.discount_percentage && (
                    <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                      <Percent size={16} style={{color: 'var(--text-muted)'}} />
                      <div>
                        <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Discount Percentage</div>
                        <div style={{color: 'var(--success-text)', fontWeight: '600'}}>{coupon.discount_percentage}%</div>
                      </div>
                    </div>
                  )}
                  {coupon.discount_amount && (
                    <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                      <Gift size={16} style={{color: 'var(--text-muted)'}} />
                      <div>
                        <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Discount Amount</div>
                        <div style={{color: 'var(--success-text)', fontWeight: '600'}}>{formatCurrency(coupon.discount_amount)}</div>
                      </div>
                    </div>
                  )}
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <Target size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Minimum Order Amount</div>
                      <div style={{color: 'var(--text-secondary)'}}>{formatCurrency(coupon.min_order_amount)}</div>
                    </div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <Gift size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Maximum Discount</div>
                      <div style={{color: 'var(--text-secondary)'}}>{formatCurrency(coupon.max_discount)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'usages' && (
            <div>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)'}}>
                <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0}}>
                  Usage History
                </h3>
                {coupon.usages && coupon.usages.length > 10 && !showAllUsages && (
                  <span style={{fontSize: '0.875rem', color: 'var(--text-muted)'}}>
                    Showing {Math.min(10, coupon.usages.length)} of {coupon.usages.length} usages
                  </span>
                )}
              </div>
              
              {getDisplayedUsages().length > 0 ? (
                <>
                  <div style={{overflowX: 'auto'}}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Transaction</th>
                          <th>Used At</th>
                          <th>Order Amount</th>
                          <th>Discount Applied</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getDisplayedUsages().map((usage) => (
                          <tr key={usage.id}>
                            <td>{usage.user_name || 'N/A'}</td>
                            <td style={{fontWeight: '500'}}>{usage.transaction_number || 'N/A'}</td>
                            <td className="date-cell">{formatDateTime(usage.used_at)}</td>
                            <td>{formatCurrency(usage.order_amount || 0)}</td>
                            <td style={{color: 'var(--success-text)'}}>{formatCurrency(usage.discount_applied || 0)}</td>
                            <td>
                              <span className="status-badge success">
                                Used
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* See More/Show Less Button for Usages */}
                  {coupon.usages && coupon.usages.length > 10 && (
                    <div style={{textAlign: 'center', marginTop: 'var(--spacing-lg)'}}>
                      <button 
                        className="btn btn-secondary"
                        onClick={() => setShowAllUsages(!showAllUsages)}
                        style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', margin: '0 auto'}}
                      >
                        {showAllUsages ? (
                          <>
                            <Eye size={16} />
                            Show Less
                          </>
                        ) : (
                          <>
                            <ChevronRight size={16} />
                            See More ({coupon.usages.length - 10} more)
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <ErrorState
                  title="No usage history found"
                  message="This coupon hasn't been used yet."
                  showRetry={false}
                  showBackButton={false}
                  showDebugInfo={false}
                />
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)'}}>
                <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0}}>
                  Users with this Coupon
                </h3>
                {coupon.users && coupon.users.length > 10 && !showAllUsers && (
                  <span style={{fontSize: '0.875rem', color: 'var(--text-muted)'}}>
                    Showing {Math.min(10, coupon.users.length)} of {coupon.users.length} users
                  </span>
                )}
              </div>
              
              {getDisplayedUsers().length > 0 ? (
                <>
                  <div style={{overflowX: 'auto'}}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Status</th>
                          <th>Added On</th>
                          <th>Used</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getDisplayedUsers().map((user) => (
                          <tr key={user.id}>
                            <td>{user.first_name} {user.last_name}</td>
                            <td>{user.email}</td>
                            <td>{user.phone_number || 'N/A'}</td>
                            <td>
                              <span className={`status-badge ${user.is_used ? 'success' : 'default'}`}>
                                {user.is_used ? 'Used' : 'Available'}
                              </span>
                            </td>
                            <td className="date-cell">{formatDate(user.created_at)}</td>
                            <td className="date-cell">{user.used_at ? formatDateTime(user.used_at) : 'Not Used'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* See More/Show Less Button for Users */}
                  {coupon.users && coupon.users.length > 10 && (
                    <div style={{textAlign: 'center', marginTop: 'var(--spacing-lg)'}}>
                      <button 
                        className="btn btn-secondary"
                        onClick={() => setShowAllUsers(!showAllUsers)}
                        style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', margin: '0 auto'}}
                      >
                        {showAllUsers ? (
                          <>
                            <Eye size={16} />
                            Show Less
                          </>
                        ) : (
                          <>
                            <ChevronRight size={16} />
                            See More ({coupon.users.length - 10} more)
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <ErrorState
                  title="No users found"
                  message="No users have this coupon yet."
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

export default CouponDetails;