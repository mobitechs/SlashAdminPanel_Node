// pages/StoreDetails.js - Store Details View (Updated to match UserDetails layout)
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Edit, Trash2, Mail, Phone, MapPin, Calendar,
  Store, Star, Clock, CheckCircle, DollarSign, TrendingUp, Wallet,
  CreditCard, Gift, Activity, Home, ChevronRight, Eye, Award,
  Users, Percent, QrCode, Globe, AlertCircle, Building,
  FileText, Lock, User
} from 'lucide-react';
import ErrorState from '../components/common/ErrorState';
import '../styles/AdminStyles.css';

const StoreDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // State for showing full lists
  const [showAllTransactions, setShowAllTransactions] = useState(false);

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

  // Fetch store details
  const fetchStoreDetails = async () => {
    try {
      setError(null);
      console.log(`🔄 Fetching store details for ID: ${id}`);
      
      const possibleEndpoints = [
        `${API_BASE_URL}/stores/${id}`,
        `/api/stores/${id}`,
        `/stores/${id}`
      ];

      let lastError = null;
      let storeData = null;

      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`🔄 Trying store details endpoint: ${endpoint}`);
          
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: getHeaders(),
            credentials: 'include'
          });

          console.log(`📡 Store details response status: ${response.status}`);

          if (response.ok) {
            storeData = await response.json();
            console.log('✅ Store details fetched successfully');
            break;
          } else {
            const errorText = await response.text();
            lastError = new Error(`HTTP ${response.status}: ${errorText}`);
          }
        } catch (err) {
          console.warn(`⚠️ Store details endpoint ${endpoint} error:`, err.message);
          lastError = err;
          continue;
        }
      }

      if (!storeData) {
        throw lastError || new Error('Store not found');
      }

      const processedStore = processStoreData(storeData);
      if (!processedStore.id) {
        throw new Error(`Invalid store data received for ID: ${id}`);
      }
      
      setStore(processedStore);
      console.log('✅ Store details loaded successfully:', processedStore);

    } catch (error) {
      console.error(`❌ Failed to fetch store ${id}:`, error.message);
      setError(error.message);
      setStore(null);
    } finally {
      setLoading(false);
    }
  };

  // Process store data from API response
  const processStoreData = (rawData) => {
    try {
      console.log('🔍 Processing raw API data:', rawData);
      
      let storeData = null;
      let transactions = [];
      
      if (rawData.success && rawData.data) {
        storeData = rawData.data.store || rawData.data;
        transactions = rawData.data.recentTransactions || 
                      rawData.data.transactions || 
                      rawData.recentTransactions || 
                      rawData.transactions || 
                      [];
      } else if (rawData.store) {
        storeData = rawData.store;
        transactions = rawData.recentTransactions || rawData.transactions || [];
      } else if (rawData.id) {
        storeData = rawData;
        transactions = rawData.recentTransactions || rawData.transactions || [];
      } else {
        console.error('❌ Unrecognized API response structure:', rawData);
        throw new Error('Invalid API response format - no store data found');
      }

      console.log('🔍 Extracted store data:', storeData);

      if (!storeData) {
        throw new Error('Store data is null or undefined');
      }

      if (!storeData.id) {
        console.error('❌ Store data missing ID field:', storeData);
        throw new Error('Store data missing required ID field');
      }

      if (storeData.id != id) {
        throw new Error(`Store ID mismatch: expected ${id}, got ${storeData.id}`);
      }

      // Attach transactions to store data
      storeData.transactions = Array.isArray(transactions) ? transactions : [];

      return storeData;
      
    } catch (error) {
      console.error('❌ Error processing store data:', error);
      throw error;
    }
  };

  // Load store data on component mount
  useEffect(() => {
    fetchStoreDetails();
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

  // Get rating stars
  const getRatingStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = (rating || 0) % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />);
    }
    
    if (hasHalfStar) {
      stars.push(<Star key="half" size={16} className="text-yellow-400 fill-yellow-200" />);
    }
    
    const emptyStars = 5 - Math.ceil(rating || 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} size={16} className="text-gray-300" />);
    }
    
    return stars;
  };

  // Functions to get limited lists
  const getDisplayedTransactions = () => {
    if (!store?.transactions || !Array.isArray(store.transactions)) {
      console.log('🔍 No transactions found or not an array:', store?.transactions);
      return [];
    }
    console.log(`🔍 Displaying ${showAllTransactions ? 'all' : 'top 5'} of ${store.transactions.length} transactions`);
    return showAllTransactions ? store.transactions : store.transactions.slice(0, 5);
  };

  // Navigation handlers
  const handleEdit = () => {
    navigate(`/stores/${id}/edit`);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this store?')) {
      // TODO: Implement delete functionality
      console.log('Delete store:', id);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading Store #{id}...</p>
        </div>
      </div>
    );
  }

  // Show error state if API failed and no store data
  if (error && !store) {
    return (
      <div className="page-container">
        <div className="chart-card">
          <ErrorState
            title="Failed to Load Store"
            message={error}
            onRetry={fetchStoreDetails}
            backTo="/stores"
            backText="Back to Stores List"
            debugInfo={{
              "Store ID": id,
              "API Base URL": API_BASE_URL,
              "Expected Endpoint": `${API_BASE_URL}/stores/${id}`,
              "Error": error
            }}
          />
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="page-container">
        <ErrorState
          title="Store not found"
          message={`Store #${id} does not exist in the database`}
          showRetry={false}
          backTo="/stores"
          backText="Back to Stores"
          showDebugInfo={false}
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header with Store Icon, Store ID, Name, and Action Buttons */}
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
          <Store size={24} style={{color: 'var(--text-muted)'}} />
          #{store.id} {store.name}
          <span style={{
            fontSize: '0.875rem',
            color: 'var(--text-muted)',
            fontWeight: '400',
            marginLeft: 'var(--spacing-sm)'
          }}>
            • {store.category_name}
          </span>
        </h1>
        
        <div style={{display: 'flex', gap: 'var(--spacing-md)'}}>
          <button className="btn btn-secondary" onClick={handleEdit}>
            <Edit size={16} />
            Edit Store
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

      {/* Store Stats */}
      <div className="stats-grid" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 'var(--spacing-xl)'}}>
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Total Transactions</h3>
              <div className="stat-value">{store.total_transactions || 0}</div>
              <p className="stat-subtitle">All time count</p>
            </div>
            <div className="stat-icon" style={{background: 'var(--gradient-blue)'}}>
              <CreditCard />
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Total Revenue</h3>
              <div className="stat-value">{formatCurrency(store.total_final_amount || store.total_revenue)}</div>
              <p className="stat-subtitle">Final amount earned</p>
            </div>
            <div className="stat-icon" style={{background: 'var(--gradient-green)'}}>
              <DollarSign />
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Total Bill Amount</h3>
              <div className="stat-value">{formatCurrency(store.total_bill_amount)}</div>
              <p className="stat-subtitle">Before discounts</p>
            </div>
            <div className="stat-icon" style={{background: 'var(--gradient-orange)'}}>
              <Wallet />
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Unique Customers</h3>
              <div className="stat-value">{store.unique_customers || 0}</div>
              <p className="stat-subtitle">Total users served</p>
            </div>
            <div className="stat-icon" style={{background: 'var(--gradient-purple)'}}>
              <Users />
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
            <Store size={16} />
            Store Details
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
            Transactions ({(store.transactions && store.transactions.length) || 0})
          </button>
        </div>

        <div style={{padding: 'var(--spacing-lg)'}}>
          {activeTab === 'overview' && (
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-xl)'}}>
              {/* Basic Information */}
              <div>
                <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                  <Store size={18} />
                  Basic Information
                </h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <Store size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Store Name</div>
                      <div style={{color: 'var(--text-secondary)'}}>{store.name}</div>
                    </div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <Building size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Category</div>
                      <div style={{color: 'var(--text-secondary)'}}>{store.category_name}</div>
                    </div>
                  </div>
                  {store.sub_category && (
                    <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                      <FileText size={16} style={{color: 'var(--text-muted)'}} />
                      <div>
                        <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Sub Category</div>
                        <div style={{color: 'var(--text-secondary)'}}>{store.sub_category}</div>
                      </div>
                    </div>
                  )}
                  {store.description && (
                    <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                      <Activity size={16} style={{color: 'var(--text-muted)'}} />
                      <div>
                        <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Description</div>
                        <div style={{color: 'var(--text-secondary)'}}>{store.description}</div>
                      </div>
                    </div>
                  )}
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <CheckCircle size={16} style={{color: store.is_active ? 'var(--success-text)' : 'var(--error-text)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Status</div>
                      <div style={{color: store.is_active ? 'var(--success-text)' : 'var(--error-text)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)'}}>
                        {store.is_active ? 'Active' : 'Inactive'}
                        {store.is_premium && (
                          <span style={{
                            background: 'var(--gradient-blue)',
                            color: 'white',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '0.625rem',
                            fontWeight: '500'
                          }}>
                            Partner
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <Calendar size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Join Date</div>
                      <div style={{color: 'var(--text-secondary)'}}>{formatDate(store.created_at)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                  <Phone size={18} />
                  Contact Information
                </h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <Phone size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Phone</div>
                      <div style={{color: 'var(--text-secondary)'}}>{store.phone_number}</div>
                    </div>
                  </div>
                  {store.email && (
                    <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                      <Mail size={16} style={{color: 'var(--text-muted)'}} />
                      <div>
                        <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Email</div>
                        <div style={{color: 'var(--text-secondary)'}}>{store.email}</div>
                      </div>
                    </div>
                  )}
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <MapPin size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Address</div>
                      <div style={{color: 'var(--text-secondary)'}}>{store.address}</div>
                    </div>
                  </div>
                  {(store.latitude && store.longitude) && (
                    <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                      <MapPin size={16} style={{color: 'var(--text-muted)'}} />
                      <div>
                        <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Coordinates</div>
                        <div style={{color: 'var(--text-secondary)'}}>{store.latitude}, {store.longitude}</div>
                      </div>
                    </div>
                  )}
                  {store.upi_id && (
                    <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                      <CreditCard size={16} style={{color: 'var(--text-muted)'}} />
                      <div>
                        <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>UPI ID</div>
                        <div style={{color: 'var(--text-secondary)'}}>{store.upi_id}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Contract & Business Details */}
              <div>
                <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                  <Calendar size={18} />
                  Contract & Business
                </h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)'}}>
                  {store.contract_start_date && (
                    <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                      <Calendar size={16} style={{color: 'var(--text-muted)'}} />
                      <div>
                        <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Contract Start</div>
                        <div style={{color: 'var(--text-secondary)'}}>{formatDate(store.contract_start_date)}</div>
                      </div>
                    </div>
                  )}
                  {store.contract_expiry_date && (
                    <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                      <Calendar size={16} style={{color: 'var(--text-muted)'}} />
                      <div>
                        <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Contract Expiry</div>
                        <div style={{color: 'var(--text-secondary)'}}>{formatDate(store.contract_expiry_date)}</div>
                      </div>
                    </div>
                  )}
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <Percent size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Normal Discount</div>
                      <div style={{color: 'var(--text-secondary)'}}>{store.normal_discount_percentage}%</div>
                    </div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <Star size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>VIP Discount</div>
                      <div style={{color: 'var(--text-secondary)'}}>{store.vip_discount_percentage}%</div>
                    </div>
                  </div>
                  {store.commission_percent && (
                    <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                      <DollarSign size={16} style={{color: 'var(--text-muted)'}} />
                      <div>
                        <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Commission</div>
                        <div style={{color: 'var(--text-secondary)'}}>{store.commission_percent}%</div>
                      </div>
                    </div>
                  )}
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <DollarSign size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Minimum Order</div>
                      <div style={{color: 'var(--text-secondary)'}}>{formatCurrency(store.minimum_order_amount)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance & Security */}
              <div>
                <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                  <Award size={18} />
                  Performance & Security
                </h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <Star size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Store Rating</div>
                      <div style={{color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                        <div style={{display: 'flex', gap: '2px'}}>
                          {getRatingStars(store.rating)}
                        </div>
                        <span>{parseFloat(store.rating || 0).toFixed(1)} ({store.total_reviews} reviews)</span>
                      </div>
                    </div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <TrendingUp size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Average Order Value</div>
                      <div style={{color: 'var(--text-secondary)'}}>{formatCurrency(store.average_order_value || store.avg_order_value)}</div>
                    </div>
                  </div>
                  {store.closed_by && (
                    <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                      <User size={16} style={{color: 'var(--text-muted)'}} />
                      <div>
                        <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Closed By</div>
                        <div style={{color: 'var(--text-secondary)'}}>{store.closed_by}</div>
                      </div>
                    </div>
                  )}
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <Lock size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Security Status</div>
                      <div style={{color: 'var(--text-secondary)'}}>
                        {store.owner_password ? 'Password Protected' : 'No Password Set'}
                      </div>
                    </div>
                  </div>
                  {store.google_business_url && (
                    <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                      <Globe size={16} style={{color: 'var(--text-muted)'}} />
                      <div>
                        <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Google Business</div>
                        <div style={{color: 'var(--text-secondary)'}}>
                          <a href={store.google_business_url} target="_blank" rel="noopener noreferrer" style={{color: 'var(--primary-color)', textDecoration: 'none'}}>
                            View on Google
                          </a>
                        </div>
                      </div>
                    </div>
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
                {store.transactions && store.transactions.length > 5 && !showAllTransactions && (
                  <span style={{fontSize: '0.875rem', color: 'var(--text-muted)'}}>
                    Showing {Math.min(5, store.transactions.length)} of {store.transactions.length} transactions
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
                          <th>Customer</th>
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
                            <td>
                              <div>
                                <div style={{fontWeight: '500'}}>{transaction.first_name} {transaction.last_name}</div>
                                <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>{transaction.email}</div>
                              </div>
                            </td>
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
                  {store.transactions && store.transactions.length > 5 && (
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
                            See More ({store.transactions.length - 5} more)
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <ErrorState
                  title="No transactions found"
                  message="This store hasn't received any transactions yet."
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

export default StoreDetails;