// pages/CouponDetails.js - UPDATED for coupon_master table
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Edit, Trash2, Tag, Store, Calendar, Clock,
  Ticket, Shield, Target, CheckCircle, Percent, Gift, 
  Activity, Home, ChevronRight, Eye, Users, TrendingUp,
  User, Crown, Infinity
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

  // Process coupon data from API response
  const processCouponData = (rawData) => {
    try {
      console.log('🔍 Processing raw API data:', rawData);
      
      let couponData = null;
      
      if (rawData.success && rawData.data) {
        couponData = rawData.data.coupon || rawData.data;
      } else if (rawData.coupon) {
        couponData = rawData.coupon;
      } else if (rawData.id || rawData.coupon_id) {
        couponData = rawData;
      } else {
        console.error('❌ Unrecognized API response structure:', rawData);
        throw new Error('Invalid API response format - no coupon data found');
      }

      console.log('🔍 Extracted coupon data:', couponData);

      if (!couponData) {
        throw new Error('Coupon data is null or undefined');
      }

      if (!couponData.id && !couponData.coupon_id) {
        console.error('❌ Coupon data missing ID field:', couponData);
        throw new Error('Coupon data missing required ID field');
      }

      // Ensure we have the right ID
      const couponId = couponData.id || couponData.coupon_id;
      if (couponId != id) {
        throw new Error(`Coupon ID mismatch: expected ${id}, got ${couponId}`);
      }

      // Normalize the data structure
      couponData.id = couponId;
      couponData.code = couponData.coupon_name; // Use coupon_name as code
      couponData.title = couponData.coupon_name;
      
      console.log('✅ Final processed coupon data:', couponData);
      
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

  const getCouponStatus = (coupon) => {
    const now = new Date();
    
    if (!coupon.is_active) return { status: 'Inactive', color: 'error' };
    
    if (coupon.lifetime_validity) return { status: 'Active (Lifetime)', color: 'success' };
    
    const validUntil = new Date(coupon.valid_till || coupon.valid_until);
    const validFrom = new Date(coupon.valid_from);
    
    if (validUntil < now) return { status: 'Expired', color: 'error' };
    if (validFrom > now) return { status: 'Upcoming', color: 'warning' };
    return { status: 'Active', color: 'success' };
  };

  const getDiscountDisplay = (coupon) => {
    if (coupon.discount_type === 'percentage') {
      return `${coupon.discount_value}% OFF`;
    } else if (coupon.discount_type === 'fixed') {
      return `₹${coupon.discount_value} OFF`;
    }
    return 'N/A';
  };

  const getApplicability = (coupon) => {
    const applicability = [];
    
    // User applicability
    if (coupon.for_all_user) applicability.push('All Users');
    if (coupon.for_all_vip_user) applicability.push('VIP Users');
    if (coupon.for_specific_user) applicability.push('Specific User');
    if (coupon.for_new_user) applicability.push('New Users');
    
    return applicability.length > 0 ? applicability.join(', ') : 'No specific targeting';
  };

  const getStoreApplicability = (coupon) => {
    if (coupon.for_all_store) return 'All Stores';
    if (coupon.for_all_premium_store) return 'Premium Stores';
    if (coupon.for_specific_store && coupon.store_name) return coupon.store_name;
    return 'Not specified';
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
          #{coupon.id} {coupon.coupon_name}
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
                {coupon.discount_type === 'percentage' ? 'Percentage' : 'Fixed Amount'}
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
              <h3>Validity</h3>
              <div className="stat-value">
                {coupon.lifetime_validity ? 'Lifetime' : 'Limited'}
              </div>
              <p className="stat-subtitle">
                {coupon.lifetime_validity ? 'No expiry' : `Until ${formatDate(coupon.valid_till)}`}
              </p>
            </div>
            <div className="stat-icon" style={{background: 'var(--gradient-blue)'}}>
              {coupon.lifetime_validity ? <Infinity /> : <Clock />}
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>User Targeting</h3>
              <div className="stat-value" style={{fontSize: '0.9rem'}}>
                {getApplicability(coupon)}
              </div>
              <p className="stat-subtitle">Target audience</p>
            </div>
            <div className="stat-icon" style={{background: 'var(--gradient-orange)'}}>
              <Users />
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Store Scope</h3>
              <div className="stat-value" style={{fontSize: '0.9rem'}}>
                {getStoreApplicability(coupon)}
              </div>
              <p className="stat-subtitle">Applicable stores</p>
            </div>
            <div className="stat-icon" style={{background: 'var(--gradient-purple)'}}>
              <Store />
            </div>
          </div>
        </div>
      </div>

      {/* Coupon Details */}
      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">Coupon Information</h3>
        </div>

        <div style={{padding: 'var(--spacing-lg)'}}>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-xl)'}}>
            {/* Basic Information */}
            <div>
              <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                <Tag size={18} />
                Basic Information
              </h3>
              <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                  <Ticket size={16} style={{color: 'var(--text-muted)'}} />
                  <div>
                    <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Coupon Name</div>
                    <div style={{color: 'var(--text-secondary)', fontWeight: '600'}}>{coupon.coupon_name}</div>
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

            {/* Discount & Validity */}
            <div>
              <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                <Percent size={18} />
                Discount & Validity
              </h3>
              <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                  <Percent size={16} style={{color: 'var(--text-muted)'}} />
                  <div>
                    <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Discount Type</div>
                    <div style={{color: 'var(--text-secondary)', fontWeight: '600'}}>{coupon.discount_type}</div>
                  </div>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                  <Gift size={16} style={{color: 'var(--text-muted)'}} />
                  <div>
                    <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Discount Value</div>
                    <div style={{color: 'var(--success-text)', fontWeight: '600'}}>{coupon.discount_value}</div>
                  </div>
                </div>
                {!coupon.lifetime_validity && (
                  <>
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
                        <div style={{color: 'var(--text-secondary)'}}>{formatDate(coupon.valid_till)}</div>
                      </div>
                    </div>
                  </>
                )}
                {coupon.lifetime_validity && (
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <Infinity size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Validity</div>
                      <div style={{color: 'var(--success-text)', fontWeight: '600'}}>Lifetime Validity</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Targeting & Applicability */}
            <div>
              <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                <Target size={18} />
                Targeting & Applicability
              </h3>
              <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                  <Users size={16} style={{color: 'var(--text-muted)'}} />
                  <div>
                    <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>User Targeting</div>
                    <div style={{color: 'var(--text-secondary)'}}>{getApplicability(coupon)}</div>
                  </div>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                  <Store size={16} style={{color: 'var(--text-muted)'}} />
                  <div>
                    <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Store Applicability</div>
                    <div style={{color: 'var(--text-secondary)'}}>{getStoreApplicability(coupon)}</div>
                  </div>
                </div>
                {coupon.new_user_name && (
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <User size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Specific User</div>
                      <div style={{color: 'var(--text-secondary)'}}>{coupon.new_user_name}</div>
                    </div>
                  </div>
                )}
                {coupon.new_user_mobile_no && (
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <Target size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>User Mobile</div>
                      <div style={{color: 'var(--text-secondary)'}}>{coupon.new_user_mobile_no}</div>
                    </div>
                  </div>
                )}
                <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                  <Calendar size={16} style={{color: 'var(--text-muted)'}} />
                  <div>
                    <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Created On</div>
                    <div style={{color: 'var(--text-secondary)'}}>{formatDate(coupon.created_at)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CouponDetails;