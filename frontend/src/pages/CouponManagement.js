// pages/CouponManagement.js - UPDATED for coupon_master table
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Ticket, Plus, Search, Filter, Eye, Edit2, Trash2, 
  MoreHorizontal, X, TrendingUp, AlertCircle, Wifi, 
  ChevronLeft, ChevronRight, Gift, Activity, Clock, Target,
  Infinity, Users, Store
} from 'lucide-react';
import ErrorState from '../components/common/ErrorState';
import '../styles/AdminStyles.css';

const CouponManagement = () => {
  const navigate = useNavigate();
  
  // State management
  const [allCoupons, setAllCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
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

  // Fetch all coupons
  const fetchAllCoupons = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        limit: '1000',
        offset: '0',
        include_store: 'true',
        include_usage: 'true'
      });

      const possibleEndpoints = [
        `${API_BASE_URL}/coupons?${params}`,
        `${API_BASE_URL}/admin/coupons?${params}`,
        `/api/coupons?${params}`,
        `/coupons?${params}`
      ];

      let lastError = null;
      let couponData = null;

      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`🔄 Trying coupons endpoint: ${endpoint}`);
          
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: getHeaders(),
            credentials: 'include'
          });

          if (response.ok) {
            const data = await response.json();
            console.log('✅ Coupons API Response:', data);
            couponData = data;
            break;
          } else {
            const errorText = await response.text();
            console.warn(`⚠️ Coupons endpoint ${endpoint} failed:`, response.status, errorText);
            lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        } catch (err) {
          console.warn(`⚠️ Coupons endpoint ${endpoint} error:`, err.message);
          lastError = err;
          continue;
        }
      }

      if (!couponData) {
        throw lastError || new Error('All coupons endpoints failed');
      }

      const processedData = processCouponsData(couponData);
      setAllCoupons(processedData.coupons || []);
      setError(null);
      
      console.log('✅ All coupons data loaded successfully');

    } catch (error) {
      console.warn('⚠️ Coupons API failed:', error.message);
      setAllCoupons([]);
      setError(`Failed to load coupons: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  // Client-side filtering logic
  const filteredCoupons = useMemo(() => {
    let filtered = [...allCoupons];

    // Apply search filter
    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(coupon => {
        return (
          (coupon.coupon_name?.toLowerCase() || '').includes(searchLower) ||
          (coupon.description?.toLowerCase() || '').includes(searchLower) ||
          (coupon.store_name?.toLowerCase() || '').includes(searchLower)
        );
      });
    }

    // Apply status filter
    if (statusFilter) {
      const now = new Date();
      filtered = filtered.filter(coupon => {
        if (coupon.lifetime_validity) {
          return statusFilter === 'active' ? coupon.is_active === 1 : false;
        }
        
        const validUntil = new Date(coupon.valid_till || coupon.valid_until);
        const isExpired = validUntil < now;
        
        switch (statusFilter) {
          case 'active':
            return coupon.is_active === 1 && !isExpired;
          case 'expired':
            return isExpired;
          case 'inactive':
            return coupon.is_active === 0;
          default:
            return true;
        }
      });
    }

    // Apply type filter
    if (typeFilter) {
      filtered = filtered.filter(coupon => {
        switch (typeFilter) {
          case 'percentage':
            return coupon.discount_type === 'percentage';
          case 'fixed':
            return coupon.discount_type === 'fixed';
          case 'lifetime':
            return coupon.lifetime_validity === 1;
          case 'limited':
            return coupon.lifetime_validity === 0;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [allCoupons, searchTerm, statusFilter, typeFilter]);

  // Pagination logic using filtered data
  const paginatedCoupons = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredCoupons.slice(startIndex, endIndex);
  }, [filteredCoupons, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredCoupons.length / itemsPerPage);
  const totalCoupons = filteredCoupons.length;

  // Process coupons data
  const processCouponsData = (rawData) => {
    let coupons = [];
    let pagination = { total: 0, totalPages: 1, currentPage: 1, itemsPerPage: 10 };
    let stats = { totalCoupons: 0, activeCoupons: 0, totalRedemptions: 0, totalSavings: 0 };

    try {
      if (rawData.success && rawData.data) {
        coupons = rawData.data.coupons || rawData.data || [];
        pagination = rawData.data.pagination || rawData.pagination || pagination;
        stats = rawData.data.stats || rawData.stats || stats;
      } else if (Array.isArray(rawData)) {
        coupons = rawData;
      } else if (rawData.coupons) {
        coupons = rawData.coupons;
        pagination = rawData.pagination || pagination;
      }

      if (!Array.isArray(coupons)) {
        coupons = [];
      }

      // Normalize coupon data structure
      coupons = coupons.map(coupon => ({
        ...coupon,
        id: coupon.id || coupon.coupon_id,
        code: coupon.coupon_name, // Use coupon_name as code for display
        title: coupon.coupon_name
      }));

      if (coupons.length > 0 && stats.totalCoupons === 0) {
        const now = new Date();
        stats.totalCoupons = pagination.total || coupons.length;
        stats.activeCoupons = coupons.filter(c => {
          if (c.lifetime_validity) return c.is_active === 1;
          return c.is_active === 1 && new Date(c.valid_till || c.valid_until) >= now;
        }).length;
      }

      return { coupons, pagination, stats };
    } catch (error) {
      console.error('Error processing coupons data:', error);
      return { coupons: [], pagination, stats };
    }
  };

  // Initial load
  useEffect(() => {
    fetchAllCoupons();
  }, [fetchAllCoupons]);

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

  const getCouponInitials = (coupon) => {
    return coupon.coupon_name?.substring(0, 2).toUpperCase() || '??';
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

  const getCouponStatus = (coupon) => {
    if (!coupon.is_active) return { status: 'inactive', color: 'error' };
    
    if (coupon.lifetime_validity) return { status: 'active', color: 'success' };
    
    const now = new Date();
    const validUntil = new Date(coupon.valid_till || coupon.valid_until);
    const validFrom = new Date(coupon.valid_from);
    
    if (validUntil < now) return { status: 'expired', color: 'error' };
    if (validFrom > now) return { status: 'upcoming', color: 'warning' };
    return { status: 'active', color: 'success' };
  };

  const getDiscountDisplay = (coupon) => {
    if (coupon.discount_type === 'percentage') {
      return `${coupon.discount_value}% OFF`;
    } else if (coupon.discount_type === 'fixed') {
      return `₹${coupon.discount_value} OFF`;
    }
    return 'N/A';
  };

  const getTargetingDisplay = (coupon) => {
    const targeting = [];
    
    if (coupon.for_all_user) targeting.push('All Users');
    if (coupon.for_all_vip_user) targeting.push('VIP Users');
    if (coupon.for_new_user) targeting.push('New Users');
    if (coupon.for_specific_user) targeting.push('Specific User');
    
    return targeting.length > 0 ? targeting.join(', ') : 'All Users';
  };

  const getStoreDisplay = (coupon) => {
    if (coupon.for_all_store) return 'All Stores';
    if (coupon.for_all_premium_store) return 'Premium Stores';
    if (coupon.for_specific_store && coupon.store_name) return coupon.store_name;
    return 'All Stores';
  };

  // Delete coupon (set is_active = 0)
  // Delete coupon (set is_active = 0)
  const handleDeleteCoupon = async (couponId) => {
    if (!window.confirm('Are you sure you want to deactivate this coupon? This will set its status to inactive.')) {
      return;
    }

    try {
      const deleteEndpoints = [
        `${API_BASE_URL}/coupons/${couponId}`,
        `${API_BASE_URL}/admin/coupons/${couponId}`,
        `/api/coupons/${couponId}`
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
        await fetchAllCoupons();
        alert('Coupon deactivated successfully');
      } else {
        throw new Error('Deactivation failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to deactivate coupon. Please try again.');
    }
  };

  // Handle row click to navigate to coupon details
  const handleRowClick = (couponId, event) => {
    if (event.target.closest('.action-buttons')) {
      return;
    }
    navigate(`/coupons/${couponId}`);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Calculate stats from current coupons
  const currentStats = useMemo(() => {
    const now = new Date();
    const activeCoupons = allCoupons.filter(c => {
      if (c.lifetime_validity) return c.is_active === 1;
      return c.is_active === 1 && new Date(c.valid_till || c.valid_until) >= now;
    }).length;
    
    return {
      totalCoupons: allCoupons.length,
      activeCoupons,
      lifetimeCoupons: allCoupons.filter(c => c.lifetime_validity === 1).length,
      expiredCoupons: allCoupons.filter(c => {
        if (c.lifetime_validity) return false;
        return new Date(c.valid_till || c.valid_until) < now;
      }).length
    };
  }, [allCoupons]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading coupons...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={`Failed to load coupons: ${error}`} />;
  }

  return (
    <div className="page-container">
      {/* Stats Grid */}
      <div className="stats-grid" style={{marginBottom: 'var(--spacing-lg)'}}>
        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{formatNumber(currentStats.totalCoupons)}</div>
            <div className="stats-label">Total Coupons</div>
          </div>
          <div className="stats-icon">
            <Ticket />
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{formatNumber(currentStats.activeCoupons)}</div>
            <div className="stats-label">Active Coupons</div>
          </div>
          <div className="stats-icon success">
            <Target />
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{formatNumber(currentStats.lifetimeCoupons)}</div>
            <div className="stats-label">Lifetime Coupons</div>
          </div>
          <div className="stats-icon info">
            <Infinity />
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{formatNumber(currentStats.expiredCoupons)}</div>
            <div className="stats-label">Expired Coupons</div>
          </div>
          <div className="stats-icon warning">
            <Clock />
          </div>
        </div>
      </div>

      {/* Table Container with filters and search */}
      <div className="table-container">
        <div className="table-header">
          <div className="table-header-left">
            <h3 className="table-title">
              Coupons ({totalCoupons.toLocaleString()})
            </h3>
            <div className="table-search">
              <Search className="search-input-icon" />
              <input
                type="text"
                placeholder="Search by name, description..."
                className="table-search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="table-actions">
            <div className="table-filters">
              <select
                className="filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="inactive">Inactive</option>
              </select>
              
              <select
                className="filter-select"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
                <option value="lifetime">Lifetime</option>
                <option value="limited">Limited</option>
              </select>
            </div>
            
            <button 
              className="add-user-btn"
              onClick={() => navigate('/coupons/add')}
            >
              <Plus size={16} />
              Add New Coupon
            </button>
          </div>
        </div>

        {paginatedCoupons.length === 0 ? (
          <div className="empty-state">
            <Ticket className="empty-state-icon" />
            <h3 className="empty-state-title">No coupons found</h3>
            <p className="empty-state-description">
              {searchTerm || statusFilter || typeFilter
                ? 'Try adjusting your search criteria'
                : 'No coupons found'
              }
            </p>
          </div>
        ) : (
          <div className="table-scroll-container">
            <table className="data-table">
              <thead className="table-sticky-header">
                <tr>
                  <th style={{width: '80px', padding: 'var(--spacing-lg)'}}>ID</th>
                  <th style={{padding: 'var(--spacing-lg)'}}>Coupon Details</th>
                  <th style={{width: '120px', padding: 'var(--spacing-lg)'}}>Discount</th>
                  <th style={{width: '120px', padding: 'var(--spacing-lg)'}}>Type</th>
                  <th style={{width: '150px', padding: 'var(--spacing-lg)'}}>User Targeting</th>
                  <th style={{width: '150px', padding: 'var(--spacing-lg)'}}>Store Scope</th>
                  <th style={{width: '100px', padding: 'var(--spacing-lg)'}}>Status</th>
                  <th style={{width: '120px', padding: 'var(--spacing-lg)'}}>Valid Until</th>
                  <th style={{width: '140px', textAlign: 'center', padding: 'var(--spacing-lg)'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCoupons.map((coupon) => {
                  const status = getCouponStatus(coupon);
                  return (
                    <tr 
                      key={coupon.id || coupon.coupon_id} 
                      style={{height: '64px', cursor: 'pointer'}}
                      onClick={(e) => handleRowClick(coupon.id || coupon.coupon_id, e)}
                      className="user-row-clickable"
                    >
                      <td style={{padding: 'var(--spacing-lg)'}}>
                        <span className="font-medium" style={{color: 'var(--text-secondary)'}}>
                          #{coupon.id || coupon.coupon_id}
                        </span>
                      </td>
                      <td style={{padding: 'var(--spacing-lg)'}}>
                        <div className="user-cell">
                          <div className="user-avatar">
                            {getCouponInitials(coupon)}
                          </div>
                          <div>
                            <div className="user-name">
                              {coupon.coupon_name}
                            </div>
                            <div className="user-email">
                              {coupon.description ? 
                                (coupon.description.length > 50 ? 
                                  `${coupon.description.substring(0, 50)}...` : 
                                  coupon.description
                                ) : 'No description'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{padding: 'var(--spacing-lg)'}}>
                        <span className="font-medium" style={{color: 'var(--success-text)'}}>
                          {getDiscountDisplay(coupon)}
                        </span>
                      </td>
                      <td style={{padding: 'var(--spacing-lg)'}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)'}}>
                          {coupon.lifetime_validity ? <Infinity size={14} /> : <Clock size={14} />}
                          <span className="font-medium">
                            {coupon.lifetime_validity ? 'Lifetime' : 'Limited'}
                          </span>
                        </div>
                      </td>
                      <td style={{padding: 'var(--spacing-lg)'}}>
                        <span className="font-medium" style={{fontSize: '0.85rem'}}>
                          {getTargetingDisplay(coupon)}
                        </span>
                      </td>
                      <td style={{padding: 'var(--spacing-lg)'}}>
                        <span className="font-medium">
                          {getStoreDisplay(coupon)}
                        </span>
                      </td>
                      <td style={{padding: 'var(--spacing-lg)'}}>
                        <span className={`status-badge ${status.color}`}>
                          {status.status}
                        </span>
                      </td>
                      <td style={{padding: 'var(--spacing-lg)'}}>
                        <span className="date-cell">
                          {coupon.lifetime_validity ? 'Never' : formatDate(coupon.valid_till || coupon.valid_until)}
                        </span>
                      </td>
                      <td style={{padding: 'var(--spacing-lg)', textAlign: 'center'}}>
                        <div className="action-buttons">
                          <button 
                            className="action-btn view"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/coupons/${coupon.id || coupon.coupon_id}`);
                            }}
                            title="View Details"
                          >
                            <Eye size={14} />
                          </button>
                          <button 
                            className="action-btn edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/coupons/${coupon.id || coupon.coupon_id}/edit`);
                            }}
                            title="Edit Coupon"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            className="action-btn delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCoupon(coupon.id || coupon.coupon_id);
                            }}
                            title="Deactivate Coupon"
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
              Showing {Math.min(((currentPage - 1) * itemsPerPage) + 1, totalCoupons)} to {Math.min(currentPage * itemsPerPage, totalCoupons)} of {totalCoupons} coupons
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

export default CouponManagement;