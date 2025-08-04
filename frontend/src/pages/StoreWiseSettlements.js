// pages/StoreWiseSettlements.js - Store-wise Settlement Management
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  DollarSign, Plus, Search, Filter, Eye, Edit2, Trash2, 
  MapPin, Star, Phone, Mail, Award, TrendingUp,
  ChevronLeft, ChevronRight, Activity, Users,
  ShoppingBag, Store, BarChart, Calculator,
  CheckCircle, XCircle, Clock, AlertCircle, CreditCard, Building,
  ArrowLeft, Home, User
} from 'lucide-react';
import ErrorState from '../components/common/ErrorState';
import '../styles/AdminStyles.css';

const StoreWiseSettlements = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [allSettlements, setAllSettlements] = useState([]);
  const [storeInfo, setStoreInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [storeLoading, setStoreLoading] = useState(true);
  const [error, setError] = useState(null);
  const [storeError, setStoreError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);

  // API configuration
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  });

  // Fetch store information
  const fetchStoreInfo = useCallback(async () => {
    try {
      setStoreLoading(true);
      setStoreError(null);
      
      const possibleEndpoints = [
        `${API_BASE_URL}/settlements/store/${storeId}/info`,
        `/api/settlements/store/${storeId}/info`,
        `${API_BASE_URL}/stores/${storeId}`,
        `${API_BASE_URL}/admin/stores/${storeId}`,
        `/api/stores/${storeId}`,
        `/stores/${storeId}`
      ];

      let lastError = null;
      let storeData = null;

      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`🔄 Trying store endpoint: ${endpoint}`);
          
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: getHeaders(),
            credentials: 'include'
          });

          if (response.ok) {
            const data = await response.json();
            console.log('✅ Store API Response:', data);
            
            // Handle different response structures
            if (data.success && data.data) {
              storeData = data.data.store || data.data;
            } else if (data.store) {
              storeData = data.store;
            } else if (data.id || data.store_id) {
              storeData = data;
            }
            
            break;
          } else {
            const errorText = await response.text();
            console.warn(`⚠️ Store endpoint ${endpoint} failed:`, response.status, errorText);
            lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        } catch (err) {
          console.warn(`⚠️ Store endpoint ${endpoint} error:`, err.message);
          lastError = err;
          continue;
        }
      }

      if (storeData) {
        setStoreInfo(storeData);
        console.log('✅ Store data loaded successfully:', storeData);
      } else {
        throw lastError || new Error('Store not found');
      }

    } catch (error) {
      console.error('⚠️ Store API failed:', error.message);
      setStoreError(error.message);
      setStoreInfo(null);
    } finally {
      setStoreLoading(false);
    }
  }, [API_BASE_URL, storeId]);

  // Fetch settlements for the specific store
  const fetchStoreSettlements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try the dedicated store settlements endpoint first, then fall back to general endpoint with filter
      const possibleEndpoints = [
        `${API_BASE_URL}/settlements/store/${storeId}`,
        `/api/settlements/store/${storeId}`,
        `${API_BASE_URL}/settlements?limit=1000&offset=0&store_id=${storeId}`,
        `${API_BASE_URL}/admin/settlements?limit=1000&offset=0&store_id=${storeId}`,
        `/api/settlements?limit=1000&offset=0&store_id=${storeId}`,
        `/settlements?limit=1000&offset=0&store_id=${storeId}`
      ];

      let lastError = null;
      let settlementData = null;

      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`🔄 Trying settlements endpoint: ${endpoint}`);
          
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: getHeaders(),
            credentials: 'include'
          });

          if (response.ok) {
            const data = await response.json();
            console.log('✅ Settlements API Response:', data);
            settlementData = data;
            break;
          } else {
            const errorText = await response.text();
            console.warn(`⚠️ Settlements endpoint ${endpoint} failed:`, response.status, errorText);
            lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        } catch (err) {
          console.warn(`⚠️ Settlements endpoint ${endpoint} error:`, err.message);
          lastError = err;
          continue;
        }
      }

      if (!settlementData) {
        throw lastError || new Error('All settlements endpoints failed');
      }

      const processedData = processSettlementsData(settlementData);
      
      // If using general endpoint, filter settlements by store_id (redundant but safe)
      let storeSettlements = processedData.settlements || [];
      if (storeSettlements.length > 0 && storeSettlements[0].store_id != storeId) {
        storeSettlements = storeSettlements.filter(
          settlement => settlement.store_id == storeId
        );
      }
      
      setAllSettlements(storeSettlements);
      
      console.log(`✅ Store settlements data loaded successfully. Found ${storeSettlements.length} settlements for store ${storeId}`);

    } catch (error) {
      console.error('⚠️ Settlements API failed:', error.message);
      setError(error.message);
      setAllSettlements([]);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, storeId]);

  // Client-side filtering logic
  const filteredSettlements = useMemo(() => {
    let filtered = [...allSettlements];

    // Apply search filter
    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(settlement => {
        return (
          (settlement.settlement_id?.toString() || '').includes(searchLower) ||
          (settlement.user_first_name?.toLowerCase() || '').includes(searchLower) ||
          (settlement.user_last_name?.toLowerCase() || '').includes(searchLower) ||
          (settlement.user_email?.toLowerCase() || '').includes(searchLower) ||
          (settlement.settlement_status?.toLowerCase() || '').includes(searchLower) ||
          (settlement.payment_reference?.toLowerCase() || '').includes(searchLower) ||
          (settlement.transaction_number?.toLowerCase() || '').includes(searchLower)
        );
      });
    }

    return filtered;
  }, [allSettlements, searchTerm]);

  // Pagination logic
  const paginatedSettlements = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredSettlements.slice(startIndex, endIndex);
  }, [filteredSettlements, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredSettlements.length / itemsPerPage);
  const totalSettlements = filteredSettlements.length;

  // Process settlements data
  const processSettlementsData = (rawData) => {
    let settlements = [];
    let pagination = { total: 0, totalPages: 1, currentPage: 1, itemsPerPage: 10 };
    let stats = { 
      totalSettlements: 0, 
      uniqueStores: 0, 
      uniqueUsers: 0, 
      totalSettlementAmount: 0, 
      totalSettledAmount: 0,
      totalPendingAmount: 0,
      totalCommissionAmount: 0
    };

    try {
      if (rawData.success && rawData.data) {
        settlements = rawData.data.settlements || rawData.data || [];
        pagination = rawData.data.pagination || rawData.pagination || pagination;
        stats = rawData.data.stats || rawData.stats || stats;
      } else if (Array.isArray(rawData)) {
        settlements = rawData;
      } else if (rawData.settlements) {
        settlements = rawData.settlements;
      }

      if (!Array.isArray(settlements)) {
        settlements = [];
      }

      return { settlements, pagination, stats };
    } catch (error) {
      console.error('Error processing settlements data:', error);
      return { settlements: [], pagination, stats };
    }
  };

  // Initial load
  useEffect(() => {
    fetchStoreInfo();
    fetchStoreSettlements();
  }, [fetchStoreInfo, fetchStoreSettlements]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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

  const getUserInitials = (settlement) => {
    const firstName = settlement.user_first_name || '';
    const lastName = settlement.user_last_name || '';
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    return `${firstName[0] || ''}${firstName[1] || ''}`.toUpperCase() || '??';
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

  const getSettlementStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <CheckCircle size={14} className="text-green-500" />;
      case 'pending':
        return <Clock size={14} className="text-yellow-500" />;
      case 'processing':
        return <Activity size={14} className="text-blue-500" />;
      case 'failed':
        return <XCircle size={14} className="text-red-500" />;
      default:
        return <AlertCircle size={14} className="text-gray-500" />;
    }
  };

  const getSettlementStatusBadge = (status) => {
    const statusClass = {
      completed: 'success',
      pending: 'warning',
      processing: 'info',
      failed: 'error',
      cancelled: 'error'
    }[status?.toLowerCase()] || 'default';

    return (
      <span className={`status-badge ${statusClass}`}>
        {getSettlementStatusIcon(status)}
        <span style={{ marginLeft: '0.25rem' }}>
          {status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown'}
        </span>
      </span>
    );
  };

  const handleRowClick = (settlementId, event) => {
    if (event.target.closest('.action-buttons')) {
      return;
    }
    navigate(`/settlements/${settlementId}`);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleDeleteSettlement = async (settlementId) => {
    if (!window.confirm(`Are you sure you want to delete settlement #${settlementId}? This action cannot be undone.`)) {
      return;
    }

    try {
      const endpoints = [
        `${API_BASE_URL}/settlements/${settlementId}`,
        `/api/settlements/${settlementId}`
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
        alert('Settlement deleted successfully');
        // Refresh the settlements list
        fetchStoreSettlements();
      } else {
        alert('Failed to delete settlement');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete settlement');
    }
  };

  // Calculate stats from current settlements
  const currentStats = useMemo(() => {
    const totalSettlementAmount = allSettlements.reduce((sum, s) => sum + (parseFloat(s.settlement_amount) || 0), 0);
    const totalSettledAmount = allSettlements.reduce((sum, s) => sum + (parseFloat(s.settled_amount) || 0), 0);
    const totalPendingAmount = allSettlements.reduce((sum, s) => sum + (parseFloat(s.pending_amount) || 0), 0);
    const totalCommissionAmount = allSettlements.reduce((sum, s) => sum + (parseFloat(s.commission_amount) || 0), 0);
    const uniqueUsers = new Set(allSettlements.map(s => s.user_id)).size;
    
    return {
      totalSettlements: allSettlements.length,
      uniqueUsers,
      totalSettlementAmount,
      totalSettledAmount,
      totalPendingAmount,
      totalCommissionAmount
    };
  }, [allSettlements]);

  if (loading || storeLoading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading store settlements...</p>
        </div>
      </div>
    );
  }

  if (storeError && !storeInfo) {
    return (
      <div className="page-container">
        <ErrorState 
          message={`Failed to load store information: ${storeError}`} 
          backTo="/settlements"
          backText="Back to All Settlements"
        />
      </div>
    );
  }

  if (error && allSettlements.length === 0) {
    return (
      <div className="page-container">
        <ErrorState 
          message={`Failed to load settlements: ${error}`}
          backTo="/settlements"
          backText="Back to All Settlements"
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Breadcrumb Navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-sm)',
        marginBottom: 'var(--spacing-lg)',
        padding: 'var(--spacing-md)',
        background: 'var(--bg-glass)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-glass)',
        fontSize: '0.875rem'
      }}>
        <button 
          onClick={() => navigate('/settlements')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-xs)',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 'var(--spacing-xs)',
            borderRadius: 'var(--radius-md)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'var(--bg-glass-hover)';
            e.target.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'none';
            e.target.style.color = 'var(--text-muted)';
          }}
        >
          <ArrowLeft size={16} />
          All Settlements
        </button>
        <ChevronRight size={16} style={{color: 'var(--text-disabled)'}} />
        <span style={{color: 'var(--text-primary)', fontWeight: '500'}}>
          {storeInfo?.name || `Store #${storeId}`}
        </span>
      </div>

      {/* Store Information Card */}
      {storeInfo && (
        <div style={{
          background: 'var(--bg-glass)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-glass)',
          padding: 'var(--spacing-lg)',
          marginBottom: 'var(--spacing-xl)'
        }}>
          <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)'}}>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'var(--gradient-blue)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Store size={24} style={{color: 'white'}} />
            </div>
            
            <div style={{flex: 1}}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                margin: 0,
                marginBottom: 'var(--spacing-sm)'
              }}>
                {storeInfo.name}
              </h2>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 'var(--spacing-md)',
                fontSize: '0.875rem'
              }}>
                {storeInfo.email && (
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                    <Mail size={16} style={{color: 'var(--text-muted)'}} />
                    <span style={{color: 'var(--text-secondary)'}}>{storeInfo.email}</span>
                  </div>
                )}
                
                {storeInfo.phone_number && (
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                    <Phone size={16} style={{color: 'var(--text-muted)'}} />
                    <span style={{color: 'var(--text-secondary)'}}>{storeInfo.phone_number}</span>
                  </div>
                )}
                
                {storeInfo.address && (
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                    <MapPin size={16} style={{color: 'var(--text-muted)'}} />
                    <span style={{color: 'var(--text-secondary)'}}>{storeInfo.address}</span>
                  </div>
                )}
                
                {storeInfo.normal_discount_percentage && (
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                    <Award size={16} style={{color: 'var(--text-muted)'}} />
                    <span style={{color: 'var(--text-secondary)'}}>
                      {storeInfo.normal_discount_percentage}% discount
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div style={{textAlign: 'right'}}>
              <Link
                to={`/stores/${storeId}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm)',
                  padding: 'var(--spacing-md)',
                  background: 'var(--bg-glass-hover)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  border: '1px solid var(--border-glass)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'var(--bg-glass)';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'var(--bg-glass-hover)';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                <Eye size={16} />
                View Store Details
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid" style={{marginBottom: 'var(--spacing-lg)'}}>
        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{formatNumber(currentStats.totalSettlements)}</div>
            <div className="stats-label">Total Settlements</div>
          </div>
          <div className="stats-icon">
            <Calculator />
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{formatNumber(currentStats.uniqueUsers)}</div>
            <div className="stats-label">Unique Customers</div>
          </div>
          <div className="stats-icon success">
            <Users />
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{formatCurrency(currentStats.totalSettlementAmount)}</div>
            <div className="stats-label">Total Settlement Amount</div>
          </div>
          <div className="stats-icon info">
            <DollarSign />
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{formatCurrency(currentStats.totalSettledAmount)}</div>
            <div className="stats-label">Total Settled</div>
          </div>
          <div className="stats-icon" style={{background: 'var(--gradient-green)'}}>
            <CheckCircle />
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{formatCurrency(currentStats.totalPendingAmount)}</div>
            <div className="stats-label">Total Pending</div>
          </div>
          <div className="stats-icon warning">
            <Clock />
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{formatCurrency(currentStats.totalCommissionAmount)}</div>
            <div className="stats-label">Total Commission</div>
          </div>
          <div className="stats-icon" style={{background: 'var(--gradient-purple)'}}>
            <BarChart />
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="table-container">
        <div className="table-header">
          <div className="table-header-left">
            <h3 className="table-title">
              Store Settlements ({totalSettlements.toLocaleString()})
            </h3>
            <div className="table-search">
              <Search className="search-input-icon" />
              <input
                type="text"
                placeholder="Search by settlement ID, customer, email, transaction..."
                className="table-search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="table-actions">
            <button 
              className="add-user-btn"
              onClick={() => navigate('/settlements/add')}
            >
              <Plus size={16} />
              Add Settlement
            </button>
          </div>
        </div>

        {paginatedSettlements.length === 0 ? (
          <div className="empty-state">
            <Calculator className="empty-state-icon" />
            <h3 className="empty-state-title">No settlements found</h3>
            <p className="empty-state-description">
              {searchTerm 
                ? 'Try adjusting your search criteria'
                : `No settlements found for ${storeInfo?.name || 'this store'}`
              }
            </p>
          </div>
        ) : (
          <div className="table-scroll-container">
            <table className="data-table">
              <thead className="table-sticky-header">
                <tr>
                  <th style={{width: '120px', padding: 'var(--spacing-lg)'}}>Settlement #</th>
                  <th style={{padding: 'var(--spacing-lg)'}}>Customer Details</th>
                  <th style={{width: '140px', padding: 'var(--spacing-lg)'}}>Commission</th>
                  <th style={{width: '140px', padding: 'var(--spacing-lg)'}}>Settlement</th>
                  <th style={{width: '140px', padding: 'var(--spacing-lg)'}}>Amounts</th>
                  <th style={{width: '120px', padding: 'var(--spacing-lg)'}}>Status</th>
                  <th style={{width: '110px', padding: 'var(--spacing-lg)'}}>Date</th>
                  <th style={{width: '140px', textAlign: 'center', padding: 'var(--spacing-lg)'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSettlements.map((settlement) => (
                  <tr 
                    key={settlement.settlement_id} 
                    style={{height: '64px', cursor: 'pointer'}}
                    onClick={(e) => handleRowClick(settlement.settlement_id, e)}
                    className="user-row-clickable"
                  >
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <div style={{fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)'}}>
                        #{settlement.settlement_id}
                      </div>
                      {settlement.transaction_id && (
                        <div style={{fontSize: '0.75rem', color: 'var(--text-secondary)'}}>
                          TXN: {settlement.transaction_id}
                        </div>
                      )}
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <div className="user-cell">
                        <div className="user-avatar">
                          {getUserInitials(settlement)}
                        </div>
                        <div>
                          <div className="user-name">
                            {settlement.user_first_name} {settlement.user_last_name}
                          </div>
                          <div style={{fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.125rem'}}>
                            {settlement.user_email}
                          </div>
                          <div style={{fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                            <Phone size={10} />
                            {settlement.user_phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <div style={{fontSize: '0.75rem'}}>
                        <div style={{marginBottom: '0.25rem', color: 'var(--text-secondary)'}}>
                          {settlement.commission_percentage}%
                        </div>
                        <div style={{color: 'var(--text-primary)', fontWeight: '600'}}>
                          {formatCurrency(settlement.commission_amount)}
                        </div>
                      </div>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <div style={{fontSize: '0.75rem'}}>
                        <div style={{marginBottom: '0.25rem', color: 'var(--text-primary)', fontWeight: '600'}}>
                          {formatCurrency(settlement.settlement_amount)}
                        </div>
                        <div style={{color: 'var(--text-secondary)'}}>
                          Net: {formatCurrency(settlement.net_settlement_amount)}
                        </div>
                      </div>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <div style={{fontSize: '0.75rem'}}>
                        <div style={{marginBottom: '0.25rem', color: 'var(--success-text)'}}>
                          Settled: {formatCurrency(settlement.settled_amount)}
                        </div>
                        <div style={{color: 'var(--warning-text)'}}>
                          Pending: {formatCurrency(settlement.pending_amount)}
                        </div>
                      </div>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <div style={{fontSize: '0.75rem'}}>
                        {getSettlementStatusBadge(settlement.settlement_status)}
                        {settlement.payment_reference && (
                          <div style={{color: 'var(--text-secondary)', marginTop: '0.25rem', fontFamily: 'monospace', fontSize: '0.7rem'}}>
                            Ref: {settlement.payment_reference}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <span className="date-cell">{formatDate(settlement.created_at)}</span>
                      {settlement.settlement_date && (
                        <div style={{fontSize: '0.7rem', color: 'var(--text-disabled)', marginTop: '0.25rem'}}>
                          Settled: {formatDate(settlement.settlement_date)}
                        </div>
                      )}
                    </td>
                    <td style={{padding: 'var(--spacing-lg)', textAlign: 'center'}}>
                      <div className="action-buttons">
                        <button 
                          className="action-btn view"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/settlements/${settlement.settlement_id}`);
                          }}
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          className="action-btn edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/settlements/${settlement.settlement_id}/edit`);
                          }}
                          title="Edit Settlement"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          className="action-btn delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSettlement(settlement.settlement_id);
                          }}
                          title="Delete Settlement"
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
              Showing {Math.min(((currentPage - 1) * itemsPerPage) + 1, totalSettlements)} to {Math.min(currentPage * itemsPerPage, totalSettlements)} of {totalSettlements} settlements
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

export default StoreWiseSettlements;