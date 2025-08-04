// pages/StoreManagement.js - Complete Store Management Frontend
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Store, Plus, Search, Filter, Eye, Edit2, Trash2, 
  MapPin, Star, Phone, Mail, Award, TrendingUp,
  ChevronLeft, ChevronRight, CreditCard, Activity,
  ShoppingBag, Users2, DollarSign, BarChart3, Crown,
  Calendar, AlertTriangle
} from 'lucide-react';
import ErrorState from '../components/common/ErrorState';
import '../styles/AdminStyles.css';

const StoreManagement = () => {
  const navigate = useNavigate();
  
  // State management
  const [allStores, setAllStores] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [storeTypeFilter, setStoreTypeFilter] = useState('all'); // New store type filter

  const [usingStaticData, setUsingStaticData] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);

  // API configuration
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  });

  // Static fallback data for stores
  const staticStoresData = {
    stores: [
      {
        id: 1,
        name: 'Premium Grocery Store',
        category_name: 'Grocery',
        email: 'contact@premiumgrocery.com',
        phone_number: '+1-555-111-2222',
        address: '123 Main Street, Downtown',
        rating: 4.5,
        total_reviews: 150,
        is_premium: 1,
        is_active: 1,
        normal_discount_percentage: 10,
        vip_discount_percentage: 15,
        total_transactions: 245,
        total_bill_amount: 125000.00,
        total_final_amount: 112500.00,
        unique_customers: 89,
        created_at: '2024-01-15',
        contract_start_date: '2024-01-15',
        contract_expiry_date: '2026-01-15'
      },
      {
        id: 2,
        name: 'Fresh Food Restaurant',
        category_name: 'Restaurant',
        email: 'info@freshfood.com',
        phone_number: '+1-555-222-3333',
        address: '456 Food Street, Uptown',
        rating: 4.2,
        total_reviews: 89,
        is_premium: 1,
        is_active: 1,
        normal_discount_percentage: 8,
        vip_discount_percentage: 12,
        total_transactions: 156,
        total_bill_amount: 78000.00,
        total_final_amount: 71500.00,
        unique_customers: 67,
        created_at: '2024-02-20',
        contract_start_date: '2024-01-01',
        contract_expiry_date: '2026-12-31'
      },
      {
        id: 3,
        name: 'Tech World Electronics',
        category_name: 'Electronics',
        email: 'sales@techworld.com',
        phone_number: '+1-555-333-4444',
        address: '789 Tech Avenue, Silicon Valley',
        rating: 4.7,
        total_reviews: 203,
        is_premium: 0,
        is_active: 1,
        normal_discount_percentage: 5,
        vip_discount_percentage: 8,
        total_transactions: 89,
        total_bill_amount: 195000.00,
        total_final_amount: 185000.00,
        unique_customers: 45,
        created_at: '2024-03-10',
        contract_start_date: '2024-01-15',
        contract_expiry_date: '2025-02-10' // This one is expired
      }
    ],
    stats: {
      totalStores: 5,
      partnerStores: 4,
      totalTransactions: 922,
      totalBillAmount: 643000.00,
      totalFinalAmount: 585050.00,
      averageRating: 4.44
    }
  };

  // Fetch all stores
  const fetchAllStores = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        limit: '1000',
        offset: '0',
        is_active: '1'
      });

      const possibleEndpoints = [
        `${API_BASE_URL}/stores?${params}`,
        `${API_BASE_URL}/admin/stores?${params}`,
        `/api/stores?${params}`,
        `/stores?${params}`
      ];

      let lastError = null;
      let storeData = null;

      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`🔄 Trying stores endpoint: ${endpoint}`);
          
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: getHeaders(),
            credentials: 'include'
          });

          if (response.ok) {
            const data = await response.json();
            console.log('✅ Stores API Response:', data);
            storeData = data;
            break;
          } else {
            const errorText = await response.text();
            console.warn(`⚠️ Stores endpoint ${endpoint} failed:`, response.status, errorText);
            lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        } catch (err) {
          console.warn(`⚠️ Stores endpoint ${endpoint} error:`, err.message);
          lastError = err;
          continue;
        }
      }

      if (!storeData) {
        throw lastError || new Error('All stores endpoints failed');
      }

      const processedData = processStoresData(storeData);
      setAllStores(processedData.stores || []);
      setUsingStaticData(false);
      setError(null);
      
      console.log('✅ All stores data loaded successfully');

    } catch (error) {
      console.warn('⚠️ Stores API failed, using static data:', error.message);
      
      setAllStores(staticStoresData.stores);
      setUsingStaticData(true);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  // Client-side filtering logic
  const filteredStores = useMemo(() => {
    let filtered = [...allStores];

    // Apply search filter
    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(store => {
        return (
          (store.name?.toLowerCase() || '').includes(searchLower) ||
          (store.email?.toLowerCase() || '').includes(searchLower) ||
          (store.phone_number || '').includes(searchTerm.trim()) ||
          (store.address?.toLowerCase() || '').includes(searchLower) ||
          (store.category_name?.toLowerCase() || '').includes(searchLower) ||
          (store.sub_category?.toLowerCase() || '').includes(searchLower)
        );
      });
    }

    // Apply store type filter
    if (storeTypeFilter !== 'all') {
      if (storeTypeFilter === 'premium') {
        filtered = filtered.filter(store => parseInt(store.is_premium) === 1);
      } else if (storeTypeFilter === 'free') {
        filtered = filtered.filter(store => parseInt(store.is_premium) === 0);
      }
    }

    return filtered;
  }, [allStores, searchTerm, storeTypeFilter]);

  // Pagination logic
  const paginatedStores = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredStores.slice(startIndex, endIndex);
  }, [filteredStores, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredStores.length / itemsPerPage);
  const totalStores = filteredStores.length;

  // Process stores data
  const processStoresData = (rawData) => {
    let stores = [];
    let pagination = { total: 0, totalPages: 1, currentPage: 1, itemsPerPage: 10 };
    let stats = { totalStores: 0, partnerStores: 0, totalTransactions: 0, totalBillAmount: 0, totalFinalAmount: 0 };

    try {
      if (rawData.success && rawData.data) {
        stores = rawData.data.stores || rawData.data || [];
        pagination = rawData.data.pagination || rawData.pagination || pagination;
        stats = rawData.data.stats || rawData.stats || stats;
      } else if (Array.isArray(rawData)) {
        stores = rawData;
      } else if (rawData.stores) {
        stores = rawData.stores;
      }

      if (!Array.isArray(stores)) {
        stores = [];
      }

      if (stores.length > 0 && stats.totalStores === 0) {
        stats.totalStores = stores.length;
        stats.partnerStores = stores.filter(s => s.is_premium === 1).length;
        stats.totalTransactions = stores.reduce((sum, s) => sum + (parseInt(s.total_transactions) || 0), 0);
        stats.totalBillAmount = stores.reduce((sum, s) => sum + (parseFloat(s.total_bill_amount) || 0), 0);
        stats.totalFinalAmount = stores.reduce((sum, s) => sum + (parseFloat(s.total_final_amount) || 0), 0);
      }

      return { stores, pagination, stats };
    } catch (error) {
      console.error('Error processing stores data:', error);
      return { stores: [], pagination, stats };
    }
  };

  // Initial load
  useEffect(() => {
    fetchAllStores();
  }, [fetchAllStores]);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, storeTypeFilter]);

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

  const getStoreInitials = (store) => {
    const name = store.name || '';
    const words = name.split(' ');
    if (words.length >= 2) {
      return `${words[0][0] || ''}${words[1][0] || ''}`.toUpperCase();
    }
    return `${name[0] || ''}${name[1] || ''}`.toUpperCase() || '??';
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

  const isContractExpired = (expiryDate) => {
    if (!expiryDate) return false;
    try {
      const expiry = new Date(expiryDate);
      const today = new Date();
      return expiry < today;
    } catch {
      return false;
    }
  };

  const getRatingStars = (rating) => {
    const numRating = parseFloat(rating) || 0;
    const stars = [];
    const fullStars = Math.floor(numRating);
    const hasHalfStar = numRating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} size={14} className="text-yellow-500 fill-current" />);
    }

    if (hasHalfStar) {
      stars.push(<Star key="half" size={14} className="text-yellow-300 fill-current" />);
    }

    const emptyStars = 5 - Math.ceil(numRating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} size={14} className="text-gray-300" />);
    }

    return stars;
  };

  // Delete store (set is_active = 0)
  const handleDeleteStore = async (storeId) => {
    if (!window.confirm('Are you sure you want to deactivate this store? This will set their status to inactive.')) {
      return;
    }

    try {
      const deleteEndpoints = [
        `${API_BASE_URL}/stores/${storeId}`,
        `${API_BASE_URL}/admin/stores/${storeId}`,
        `/api/stores/${storeId}`
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
        await fetchAllStores();
        alert('Store deactivated successfully');
      } else {
        throw new Error('Deactivation failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to deactivate store. Please try again.');
    }
  };

  const handleRowClick = (storeId, event) => {
    if (event.target.closest('.action-buttons')) {
      return;
    }
    navigate(`/stores/${storeId}`);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Calculate stats from current stores
  const currentStats = useMemo(() => {
    const totalBillAmount = allStores.reduce((sum, s) => sum + (parseFloat(s.total_bill_amount) || 0), 0);
    const totalFinalAmount = allStores.reduce((sum, s) => sum + (parseFloat(s.total_final_amount) || 0), 0);
    const totalTransactions = allStores.reduce((sum, s) => sum + (parseInt(s.total_transactions) || 0), 0);
    
    return {
      totalStores: allStores.length,
      partnerStores: allStores.filter(s => parseInt(s.is_premium) === 1).length,
      totalTransactions,
      totalBillAmount,
      totalFinalAmount
    };
  }, [allStores]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading stores...</p>
        </div>
      </div>
    );
  }

  if (error && !usingStaticData) {
    return <ErrorState message={`Failed to load stores: ${error}`} />;
  }

  return (
    <div className="page-container">
      {/* Stats Grid */}
      <div className="stats-grid" style={{marginBottom: 'var(--spacing-lg)'}}>
        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{formatNumber(currentStats.totalStores)}</div>
            <div className="stats-label">Total Stores</div>
          </div>
          <div className="stats-icon">
            <Store />
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{formatNumber(currentStats.totalTransactions)}</div>
            <div className="stats-label">Total Transactions</div>
          </div>
          <div className="stats-icon success">
            <Activity />
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{formatCurrency(currentStats.totalBillAmount)}</div>
            <div className="stats-label">Total Bill Amount</div>
          </div>
          <div className="stats-icon info">
            <BarChart3 />
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{formatCurrency(currentStats.totalFinalAmount)}</div>
            <div className="stats-label">Total Final Amount</div>
          </div>
          <div className="stats-icon warning">
            <DollarSign />
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="table-container">
        <div className="table-header">
          <div className="table-header-left">
            <h3 className="table-title">
              Stores ({totalStores.toLocaleString()})
            </h3>
            <div style={{display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center'}}>
              {/* Search Bar */}
              <div className="table-search">
                <Search className="search-input-icon" />
                <input
                  type="text"
                  placeholder="Search by name, email, phone, address..."
                  className="table-search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {/* Store Type Filter */}
              <div className="filter-dropdown">
                
                <select
                  value={storeTypeFilter}
                  onChange={(e) => setStoreTypeFilter(e.target.value)}
                  className="form-input"
                  style={{
                    minWidth: '140px',
                    padding: '0.5rem 2rem 0.5rem 0.75rem',
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="all">All Stores</option>
                  <option value="premium">Premium</option>
                  <option value="free">Free</option>
                </select>
              </div>
            </div>
          </div>
          <div className="table-actions">
            <button 
              className="add-user-btn"
              onClick={() => navigate('/stores/add')}
            >
              <Plus size={16} />
              Add New Store
            </button>
          </div>
        </div>

        {paginatedStores.length === 0 ? (
          <div className="empty-state">
            <Store className="empty-state-icon" />
            <h3 className="empty-state-title">No stores found</h3>
            <p className="empty-state-description">
              {searchTerm || storeTypeFilter !== 'all'
                ? 'Try adjusting your search criteria or filters'
                : 'No active stores found'
              }
            </p>
          </div>
        ) : (
          <div className="table-scroll-container">
            <table className="data-table">
              <thead className="table-sticky-header">
                <tr>
                  <th style={{width: '80px', padding: 'var(--spacing-lg)'}}>ID</th>
                  <th style={{padding: 'var(--spacing-lg)'}}>Store Details</th>
                  <th style={{width: '200px', padding: 'var(--spacing-lg)'}}>Contact</th>
                  <th style={{width: '150px', padding: 'var(--spacing-lg)'}}>Performance</th>
                  <th style={{width: '120px', padding: 'var(--spacing-lg)'}}>Discounts</th>
                  <th style={{width: '120px', padding: 'var(--spacing-lg)'}}>Contract</th>
                  <th style={{width: '100px', padding: 'var(--spacing-lg)'}}>Revenue</th>
                  <th style={{width: '100px', padding: 'var(--spacing-lg)'}}>Is Premium</th>
                  <th style={{width: '110px', padding: 'var(--spacing-lg)'}}>Created</th>
                  <th style={{width: '140px', textAlign: 'center', padding: 'var(--spacing-lg)'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStores.map((store) => (
                  <tr 
                    key={store.id} 
                    style={{height: '64px', cursor: 'pointer'}}
                    onClick={(e) => handleRowClick(store.id, e)}
                    className="user-row-clickable"
                  >
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <span className="font-medium" style={{color: 'var(--text-secondary)'}}>
                        #{store.id}
                      </span>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <div className="user-cell">
                        <div className="user-avatar">
                          {getStoreInitials(store)}
                        </div>
                        <div>
                          <div className="user-name">
                            {store.name}
                          </div>
                          <div className="user-email">{store.category_name}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <div style={{fontSize: '0.75rem'}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem'}}>
                          <Phone size={12} style={{color: 'var(--text-disabled)'}} />
                          <span>{store.phone_number}</span>
                        </div>
                        <div style={{display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                          <Mail size={12} style={{color: 'var(--text-disabled)'}} />
                          <span style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '150px'}}>
                            {store.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <div style={{fontSize: '0.75rem'}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem'}}>
                          {getRatingStars(parseFloat(store.rating) || 0)}
                          <span style={{marginLeft: '0.25rem', color: 'var(--text-secondary)'}}>
                            {(parseFloat(store.rating) || 0).toFixed(1)}
                          </span>
                        </div>
                        <div style={{color: 'var(--text-secondary)'}}>
                          {formatNumber(store.total_transactions || 0)} transactions
                        </div>
                      </div>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <div style={{fontSize: '0.75rem'}}>
                        <div style={{marginBottom: '0.25rem'}}>
                          Normal: {parseFloat(store.normal_discount_percentage) || 0}%
                        </div>
                        <div>
                          VIP: {parseFloat(store.vip_discount_percentage) || 0}%
                        </div>
                      </div>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <div style={{fontSize: '0.75rem', textAlign: 'center'}}>
                        {store.contract_start_date && store.contract_expiry_date ? (
                          <div>
                            <div style={{color: 'var(--text-secondary)', marginBottom: '2px'}}>
                              {formatDate(store.contract_start_date)}
                            </div>
                            <div style={{color: 'var(--text-disabled)', fontSize: '0.7rem', marginBottom: '2px'}}>
                              to
                            </div>
                            <div style={{
                              color: isContractExpired(store.contract_expiry_date) ? 'var(--error-text)' : 'var(--text-secondary)',
                              background: isContractExpired(store.contract_expiry_date) ? 'var(--error-bg)' : 'transparent',
                              padding: isContractExpired(store.contract_expiry_date) ? '2px 4px' : '0',
                              borderRadius: isContractExpired(store.contract_expiry_date) ? '4px' : '0',
                              fontWeight: isContractExpired(store.contract_expiry_date) ? '500' : 'normal',
                              display: 'inline-block'
                            }}>
                              {formatDate(store.contract_expiry_date)}
                            </div>
                          </div>
                        ) : store.contract_start_date ? (
                          <div style={{color: 'var(--text-secondary)'}}>
                            {formatDate(store.contract_start_date)}
                          </div>
                        ) : store.contract_expiry_date ? (
                          <div style={{
                            color: isContractExpired(store.contract_expiry_date) ? 'var(--error-text)' : 'var(--text-secondary)',
                            background: isContractExpired(store.contract_expiry_date) ? 'var(--error-bg)' : 'transparent',
                            padding: isContractExpired(store.contract_expiry_date) ? '2px 4px' : '0',
                            borderRadius: isContractExpired(store.contract_expiry_date) ? '4px' : '0',
                            fontWeight: isContractExpired(store.contract_expiry_date) ? '500' : 'normal',
                            display: 'inline-block'
                          }}>
                            {formatDate(store.contract_expiry_date)}
                          </div>
                        ) : (
                          <span style={{color: 'var(--text-disabled)', fontSize: '0.75rem'}}>No Contract</span>
                        )}
                      </div>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <div style={{fontSize: '0.75rem'}}>
                        <div className="cashback-amount success" style={{marginBottom: '0.25rem'}}>
                          {formatCurrency(store.total_final_amount || 0)}
                        </div>
                        <div style={{color: 'var(--text-secondary)'}}>
                          {store.unique_customers || 0} customers
                        </div>
                      </div>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                        {parseInt(store.is_premium) === 1 ? (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '500'
                          }}>
                            <Crown size={12} />
                            <span>Premium</span>
                          </div>
                        ) : (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            background: 'var(--bg-glass)',
                            color: 'var(--text-secondary)',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            border: '1px solid var(--border-glass)'
                          }}>
                            <Store size={12} />
                            <span>Free</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <span className="date-cell">{formatDate(store.created_at)}</span>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)', textAlign: 'center'}}>
                      <div className="action-buttons">
                        <button 
                          className="action-btn view"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/stores/${store.id}`);
                          }}
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          className="action-btn edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/stores/${store.id}/edit`);
                          }}
                          title="Edit Store"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          className="action-btn delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteStore(store.id);
                          }}
                          title="Deactivate Store"
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
        <div className="pagination-container">
          <div className="pagination-info">
            <span>
              Showing {Math.min(((currentPage - 1) * itemsPerPage) + 1, totalStores)} to {Math.min(currentPage * itemsPerPage, totalStores)} of {totalStores} stores
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

export default StoreManagement;