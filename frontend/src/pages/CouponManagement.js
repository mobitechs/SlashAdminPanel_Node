// pages/CouponManagement.js - FIXED: Client-side filtering & table scroll
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Ticket, Plus, Search, Filter, Eye, Edit2, Trash2, 
  MoreHorizontal, X, TrendingUp, AlertCircle, Wifi, 
  ChevronLeft, ChevronRight, Gift, Activity, Clock, Target
} from 'lucide-react';
import ErrorState from '../components/common/ErrorState';
import '../styles/AdminStyles.css';

const CouponManagement = () => {
  const navigate = useNavigate();
  
  // State management
  const [allCoupons, setAllCoupons] = useState([]); // Store all coupons for client-side filtering
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [usingStaticData, setUsingStaticData] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);

  // API configuration - FIXED: Corrected API base URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  });

  // Static fallback data
  const staticCouponsData = {
    coupons: [
      {
        id: 1,
        code: 'SAVE20',
        title: 'Save 20% on Electronics',
        description: 'Get 20% off on all electronics items with minimum order of ₹1000',
        discount_amount: null,
        discount_percentage: 20.00,
        store_id: 1,
        store_name: 'TechMart Electronics',
        min_order_amount: 1000.00,
        max_discount: 500.00,
        valid_from: '2024-01-01T00:00:00Z',
        valid_until: '2024-12-31T23:59:59Z',
        usage_limit: 100,
        total_used: 15,
        is_active: 1,
        created_at: '2024-01-15T10:30:00Z'
      },
      {
        id: 2,
        code: 'FLAT50',
        title: 'Flat ₹50 Off',
        description: 'Get flat ₹50 discount on minimum order of ₹200',
        discount_amount: 50.00,
        discount_percentage: null,
        store_id: null,
        store_name: 'All Stores',
        min_order_amount: 200.00,
        max_discount: 50.00,
        valid_from: '2024-02-01T00:00:00Z',
        valid_until: '2024-06-30T23:59:59Z',
        usage_limit: 500,
        total_used: 123,
        is_active: 1,
        created_at: '2024-02-01T09:15:00Z'
      },
      {
        id: 3,
        code: 'EXPIRED10',
        title: 'Expired 10% Discount',
        description: 'This coupon has expired',
        discount_amount: null,
        discount_percentage: 10.00,
        store_id: 2,
        store_name: 'Fashion Hub',
        min_order_amount: 500.00,
        max_discount: 200.00,
        valid_from: '2023-12-01T00:00:00Z',
        valid_until: '2024-01-31T23:59:59Z',
        usage_limit: 50,
        total_used: 45,
        is_active: 0,
        created_at: '2023-12-01T08:45:00Z'
      }
    ],
    stats: {
      totalCoupons: 3,
      activeCoupons: 2,
      totalRedemptions: 183,
      totalSavings: 15650.00
    }
  };

  // Fetch all coupons once and filter client-side
  const fetchAllCoupons = useCallback(async () => {
    try {
      setLoading(true);
      
      // Try to fetch from API with a large limit to get all coupons
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

      // Process and store all coupons
      const processedData = processCouponsData(couponData);
      setAllCoupons(processedData.coupons || []);
      setUsingStaticData(false);
      setError(null);
      
      console.log('✅ All coupons data loaded successfully');

    } catch (error) {
      console.warn('⚠️ Coupons API failed:', error.message);
      
      // Set empty data instead of static data
      setAllCoupons([]);
      setUsingStaticData(false);
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
          (coupon.code?.toLowerCase() || '').includes(searchLower) ||
          (coupon.title?.toLowerCase() || '').includes(searchLower) ||
          (coupon.description?.toLowerCase() || '').includes(searchLower) ||
          (coupon.store_name?.toLowerCase() || '').includes(searchLower)
        );
      });
    }

    // Apply status filter
    if (statusFilter) {
      const now = new Date();
      filtered = filtered.filter(coupon => {
        const validUntil = new Date(coupon.valid_until);
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
            return coupon.discount_percentage && !coupon.discount_amount;
          case 'fixed':
            return coupon.discount_amount && !coupon.discount_percentage;
          case 'store':
            return coupon.store_id;
          case 'global':
            return !coupon.store_id;
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

      if (coupons.length > 0 && stats.totalCoupons === 0) {
        const now = new Date();
        stats.totalCoupons = pagination.total || coupons.length;
        stats.activeCoupons = coupons.filter(c => c.is_active === 1 && new Date(c.valid_until) >= now).length;
        stats.totalRedemptions = coupons.reduce((sum, c) => sum + (parseInt(c.total_used) || 0), 0);
        stats.totalSavings = coupons.reduce((sum, c) => {
          const used = parseInt(c.total_used) || 0;
          const avgDiscount = c.discount_amount || (c.max_discount || 100);
          return sum + (used * avgDiscount);
        }, 0);
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
    return coupon.code?.substring(0, 2).toUpperCase() || '??';
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
    const now = new Date();
    const validUntil = new Date(coupon.valid_until);
    const validFrom = new Date(coupon.valid_from);
    
    if (!coupon.is_active) return { status: 'inactive', color: 'error' };
    if (validUntil < now) return { status: 'expired', color: 'error' };
    if (validFrom > now) return { status: 'upcoming', color: 'warning' };
    return { status: 'active', color: 'success' };
  };

  const getDiscountDisplay = (coupon) => {
    if (coupon.discount_percentage) {
      return `${coupon.discount_percentage}% OFF`;
    } else if (coupon.discount_amount) {
      return `₹${coupon.discount_amount} OFF`;
    }
    return 'N/A';
  };

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
    const activeCoupons = allCoupons.filter(c => c.is_active === 1 && new Date(c.valid_until) >= now).length;
    const totalRedemptions = allCoupons.reduce((sum, c) => sum + (parseInt(c.total_used) || 0), 0);
    const totalSavings = allCoupons.reduce((sum, c) => {
      const used = parseInt(c.total_used) || 0;
      const avgDiscount = c.discount_amount || (c.max_discount || 100);
      return sum + (used * avgDiscount);
    }, 0);
    
    return {
      totalCoupons: allCoupons.length,
      activeCoupons,
      totalRedemptions,
      totalSavings
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

  if (error && !usingStaticData) {
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
            <div className="stats-value">{formatNumber(currentStats.totalRedemptions)}</div>
            <div className="stats-label">Total Redemptions</div>
          </div>
          <div className="stats-icon info">
            <Activity />
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{formatCurrency(currentStats.totalSavings)}</div>
            <div className="stats-label">Total Savings</div>
          </div>
          <div className="stats-icon warning">
            <Gift />
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
                placeholder="Search by code, title, store..."
                className="table-search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="table-actions">
            
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
                  <th style={{width: '150px', padding: 'var(--spacing-lg)'}}>Store</th>
                  <th style={{width: '120px', padding: 'var(--spacing-lg)'}}>Min Order</th>
                  <th style={{width: '100px', padding: 'var(--spacing-lg)'}}>Usage</th>
                  <th style={{width: '100px', padding: 'var(--spacing-lg)'}}>Status</th>
                  <th style={{width: '110px', padding: 'var(--spacing-lg)'}}>Valid Until</th>
                  <th style={{width: '140px', textAlign: 'center', padding: 'var(--spacing-lg)'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCoupons.map((coupon) => {
                  const status = getCouponStatus(coupon);
                  return (
                    <tr 
                      key={coupon.id} 
                      style={{height: '64px', cursor: 'pointer'}}
                      onClick={(e) => handleRowClick(coupon.id, e)}
                      className="user-row-clickable"
                    >
                      <td style={{padding: 'var(--spacing-lg)'}}>
                        <span className="font-medium" style={{color: 'var(--text-secondary)'}}>
                          #{coupon.id}
                        </span>
                      </td>
                      <td style={{padding: 'var(--spacing-lg)'}}>
                        <div className="user-cell">
                          <div className="user-avatar">
                            {getCouponInitials(coupon)}
                          </div>
                          <div>
                            <div className="user-name">
                              {coupon.code}
                            </div>
                            <div className="user-email">{coupon.title}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{padding: 'var(--spacing-lg)'}}>
                        <span className="font-medium" style={{color: 'var(--success-text)'}}>
                          {getDiscountDisplay(coupon)}
                        </span>
                      </td>
                      <td style={{padding: 'var(--spacing-lg)'}}>
                        <span className="font-medium">
                          {coupon.store_name || 'All Stores'}
                        </span>
                      </td>
                      <td style={{padding: 'var(--spacing-lg)'}}>
                        <span className="font-medium">
                          {formatCurrency(coupon.min_order_amount)}
                        </span>
                      </td>
                      <td style={{padding: 'var(--spacing-lg)'}}>
                        <span className="transaction-count">
                          {coupon.total_used || 0}/{coupon.usage_limit}
                        </span>
                      </td>
                      <td style={{padding: 'var(--spacing-lg)'}}>
                        <span className={`status-badge ${status.color}`}>
                          {status.status}
                        </span>
                      </td>
                      <td style={{padding: 'var(--spacing-lg)'}}>
                        <span className="date-cell">{formatDate(coupon.valid_until)}</span>
                      </td>
                      <td style={{padding: 'var(--spacing-lg)', textAlign: 'center'}}>
                        <div className="action-buttons">
                          <button 
                            className="action-btn view"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/coupons/${coupon.id}`);
                            }}
                            title="View Details"
                          >
                            <Eye size={14} />
                          </button>
                          <button 
                            className="action-btn edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/coupons/${coupon.id}/edit`);
                            }}
                            title="Edit Coupon"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            className="action-btn delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCoupon(coupon.id);
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