// pages/SettlementForm.js - Settlement Form for Creating New Settlements
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Save, X, Calculator, Search, User, Store, Building,
  DollarSign, AlertCircle, Receipt, Clock, Percent,
  Users, ShoppingBag, CreditCard, ArrowLeft, FileText
} from 'lucide-react';
import ErrorState from '../components/common/ErrorState';
import '../styles/AdminStyles.css';

const SettlementForm = () => {
  const navigate = useNavigate();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Search states
  const [userSearch, setUserSearch] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  const [storeSearch, setStoreSearch] = useState('');
  const [storeSearchResults, setStoreSearchResults] = useState([]);
  const [storeSearchLoading, setStoreSearchLoading] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  
  // Form data state
  const [formData, setFormData] = useState({
    store_id: '',
    transaction_id: '',
    user_id: '',
    bill_amount: '',
    commission_percentage: '',
    commission_amount: '',
    settlement_amount: '',
    settled_amount: '',
    pending_amount: '',
    extra_paid_amount: '',
    settlement_status: 'pending',
    payment_method: '',
    payment_reference: '',
    bank_account: '',
    tax_amount: '',
    processing_fee: '',
    net_settlement_amount: '',
    processed_by: '',
    comments: '',
    transaction_date: '',
    settlement_date: '',
    final_amount: ''
  });

  // Validation errors
  const [errors, setErrors] = useState({});

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

  // Debounced search function
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Search users
  const searchUsers = useCallback(async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setUserSearchResults([]);
      return;
    }

    try {
      setUserSearchLoading(true);
      
      const endpoints = [
        `${API_BASE_URL}/settlements/search/users?q=${encodeURIComponent(searchTerm)}`,
        `/api/settlements/search/users?q=${encodeURIComponent(searchTerm)}`
      ];

      let userData = null;

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: getHeaders(),
            credentials: 'include'
          });

          if (response.ok) {
            const data = await response.json();
            userData = data;
            break;
          }
        } catch (err) {
          continue;
        }
      }

      if (userData && userData.success) {
        setUserSearchResults(userData.data || []);
      } else {
        setUserSearchResults([]);
      }
    } catch (error) {
      console.error('User search failed:', error);
      setUserSearchResults([]);
    } finally {
      setUserSearchLoading(false);
    }
  }, [API_BASE_URL]);

  // Search stores
  const searchStores = useCallback(async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setStoreSearchResults([]);
      return;
    }

    try {
      setStoreSearchLoading(true);
      
      const endpoints = [
        `${API_BASE_URL}/settlements/search/stores?q=${encodeURIComponent(searchTerm)}`,
        `/api/settlements/search/stores?q=${encodeURIComponent(searchTerm)}`
      ];

      let storeData = null;

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: getHeaders(),
            credentials: 'include'
          });

          if (response.ok) {
            const data = await response.json();
            storeData = data;
            break;
          }
        } catch (err) {
          continue;
        }
      }

      if (storeData && storeData.success) {
        setStoreSearchResults(storeData.data || []);
      } else {
        setStoreSearchResults([]);
      }
    } catch (error) {
      console.error('Store search failed:', error);
      setStoreSearchResults([]);
    } finally {
      setStoreSearchLoading(false);
    }
  }, [API_BASE_URL]);

  // Debounced search functions
  const debouncedUserSearch = useCallback(debounce(searchUsers, 300), [searchUsers]);
  const debouncedStoreSearch = useCallback(debounce(searchStores, 300), [searchStores]);

  // Handle search input changes
  useEffect(() => {
    if (userSearch && !selectedUser) {
      debouncedUserSearch(userSearch);
    }
  }, [userSearch, selectedUser, debouncedUserSearch]);

  useEffect(() => {
    if (storeSearch && !selectedStore) {
      debouncedStoreSearch(storeSearch);
    }
  }, [storeSearch, selectedStore, debouncedStoreSearch]);

  // Calculate amounts when related fields change
  useEffect(() => {
    const billAmount = parseFloat(formData.bill_amount) || 0;
    const commissionPercentage = parseFloat(formData.commission_percentage) || 0;
    const taxAmount = parseFloat(formData.tax_amount) || 0;
    const processingFee = parseFloat(formData.processing_fee) || 0;
    const settledAmount = parseFloat(formData.settled_amount) || 0;
    
    // Calculate commission amount
    const commissionAmount = (billAmount * commissionPercentage) / 100;
    
    // Calculate settlement amount (bill amount - commission)
    const settlementAmount = billAmount - commissionAmount;
    
    // Calculate base net settlement amount (after tax and processing fee)
    const baseNetSettlement = settlementAmount - taxAmount - processingFee;
    
    // Calculate pending amount and extra paid amount based on settled amount
    let pendingAmount = 0;
    let extraPaidAmount = 0;
    
    if (settledAmount <= baseNetSettlement) {
      // Normal case: settled amount is less than or equal to what's owed
      pendingAmount = baseNetSettlement - settledAmount;
      extraPaidAmount = 0;
    } else {
      // Overpayment case: settled amount exceeds what's owed
      pendingAmount = 0;
      extraPaidAmount = settledAmount - baseNetSettlement;
    }
    
    // Final net settlement amount includes extra paid
    const netSettlementAmount = baseNetSettlement + extraPaidAmount;
    
    setFormData(prev => ({
      ...prev,
      commission_amount: commissionAmount.toFixed(2),
      settlement_amount: settlementAmount.toFixed(2),
      net_settlement_amount: netSettlementAmount.toFixed(2),
      pending_amount: pendingAmount.toFixed(2),
      extra_paid_amount: extraPaidAmount.toFixed(2)
    }));
  }, [
    formData.bill_amount, 
    formData.commission_percentage, 
    formData.tax_amount, 
    formData.processing_fee,
    formData.settled_amount
  ]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle user selection
  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setUserSearch(`${user.first_name} ${user.last_name} (${user.email})`);
    setFormData(prev => ({
      ...prev,
      user_id: user.id
    }));
    setUserSearchResults([]);
  };

  // Handle store selection
  const handleStoreSelect = (store) => {
    setSelectedStore(store);
    setStoreSearch(`${store.name} (${store.email})`);
    setFormData(prev => ({
      ...prev,
      store_id: store.id
    }));
    setStoreSearchResults([]);
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.user_id) {
      newErrors.user_id = 'User is required';
    }

    if (!formData.store_id) {
      newErrors.store_id = 'Store is required';
    }

    if (!formData.bill_amount || parseFloat(formData.bill_amount) <= 0) {
      newErrors.bill_amount = 'Bill amount must be greater than 0';
    }

    if (!formData.commission_percentage || parseFloat(formData.commission_percentage) < 0 || parseFloat(formData.commission_percentage) > 100) {
      newErrors.commission_percentage = 'Commission percentage must be between 0 and 100';
    }

    if (!formData.settlement_status) {
      newErrors.settlement_status = 'Settlement status is required';
    }

    // Numeric validations
    const numericFields = ['settled_amount', 'tax_amount', 'processing_fee'];
    numericFields.forEach(field => {
      if (formData[field] && (isNaN(formData[field]) || parseFloat(formData[field]) < 0)) {
        newErrors[field] = `${field.replace('_', ' ')} must be a non-negative number`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitLoading(true);
    setError(null);

    try {
      const submitData = {
        ...formData,
        bill_amount: parseFloat(formData.bill_amount),
        commission_percentage: parseFloat(formData.commission_percentage),
        commission_amount: parseFloat(formData.commission_amount),
        settlement_amount: parseFloat(formData.settlement_amount),
        settled_amount: parseFloat(formData.settled_amount) || 0,
        pending_amount: parseFloat(formData.pending_amount) || 0,
        extra_paid_amount: parseFloat(formData.extra_paid_amount) || 0,
        tax_amount: parseFloat(formData.tax_amount) || 0,
        processing_fee: parseFloat(formData.processing_fee) || 0,
        net_settlement_amount: parseFloat(formData.net_settlement_amount),
        final_amount: parseFloat(formData.final_amount) || 0,
        user_id: parseInt(formData.user_id),
        store_id: parseInt(formData.store_id),
        transaction_id: formData.transaction_id ? parseInt(formData.transaction_id) : null
      };

      console.log('🔄 Creating settlement:', submitData);

      const response = await fetch(`${API_BASE_URL}/settlements`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(submitData)
      });

      console.log(`📡 Create response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Create result:', result);
      
      if (result.success) {
        alert('Settlement created successfully!');
        navigate('/settlements');
      } else {
        throw new Error(result.message || 'Settlement creation failed');
      }

    } catch (error) {
      console.error('❌ Create failed:', error);
      setError(error.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    const num = parseFloat(amount) || 0;
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="page-container" style={{paddingBottom: '100px'}}>
      {/* Breadcrumb */}
      <div style={{marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
        <Link 
          to="/settlements" 
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
          Back to Settlements
        </Link>
        <span style={{color: 'var(--text-disabled)'}}>•</span>
        <span style={{color: 'var(--text-primary)', fontSize: '0.875rem'}}>
          Add New Settlement
        </span>
      </div>

      {error && (
        <div style={{
          background: 'var(--error-bg)',
          border: '1px solid var(--error-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--spacing-lg)',
          marginBottom: 'var(--spacing-xl)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-md)'
        }}>
          <AlertCircle size={20} style={{color: 'var(--error-text)'}} />
          <span style={{color: 'var(--error-text)'}}>{error}</span>
        </div>
      )}

      {/* Settlement Form */}
      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">Create New Settlement</h3>
        </div>
        
        <form onSubmit={handleSubmit} style={{padding: 'var(--spacing-lg)'}}>
          {/* Settlement Details */}
          <div style={{marginBottom: 'var(--spacing-xl)'}}>
            <h4 style={{fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
              <Receipt size={18} />
              Settlement Details
            </h4>
            
            {/* Transaction ID */}
            <div className="form-group" style={{marginBottom: 'var(--spacing-lg)'}}>
              <label className="form-label">Transaction ID (Optional)</label>
              <input
                type="number"
                name="transaction_id"
                className="form-input"
                placeholder="Enter transaction ID if this settlement is for a specific transaction"
                value={formData.transaction_id}
                onChange={handleInputChange}
              />
            </div>

            {/* User Search */}
            <div className="form-group" style={{marginBottom: 'var(--spacing-lg)', position: 'relative'}}>
              <label className="form-label">
                <Users size={16} style={{marginRight: 'var(--spacing-sm)'}} />
                Select User *
              </label>
              <div style={{position: 'relative'}}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search user by name or email..."
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    if (selectedUser) {
                      setSelectedUser(null);
                      setFormData(prev => ({...prev, user_id: ''}));
                    }
                  }}
                  style={{borderColor: errors.user_id ? 'var(--error-border)' : undefined}}
                />
                <Search size={16} style={{
                  position: 'absolute',
                  right: 'var(--spacing-md)',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-disabled)'
                }} />
              </div>
              
              {/* User Search Results */}
              {userSearchResults.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: 'var(--radius-md)',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 1000,
                  marginTop: '0.25rem'
                }}>
                  {userSearchResults.map(user => (
                    <div
                      key={user.id}
                      style={{
                        padding: 'var(--spacing-md)',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--border-light)',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.background = 'var(--bg-glass-light)'}
                      onMouseLeave={(e) => e.target.style.background = 'transparent'}
                      onClick={() => handleUserSelect(user)}
                    >
                      <div style={{fontWeight: '500', color: 'var(--text-primary)'}}>
                        {user.first_name} {user.last_name}
                      </div>
                      <div style={{fontSize: '0.875rem', color: 'var(--text-secondary)'}}>
                        {user.email} • ID: {user.id}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {userSearchLoading && (
                <div style={{fontSize: '0.875rem', color: 'var(--text-disabled)', marginTop: '0.25rem'}}>
                  Searching users...
                </div>
              )}
              
              {errors.user_id && (
                <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                  {errors.user_id}
                </span>
              )}
            </div>

            {/* Store Search */}
            <div className="form-group" style={{marginBottom: 'var(--spacing-lg)', position: 'relative'}}>
              <label className="form-label">
                <ShoppingBag size={16} style={{marginRight: 'var(--spacing-sm)'}} />
                Select Store *
              </label>
              <div style={{position: 'relative'}}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search store by name or email..."
                  value={storeSearch}
                  onChange={(e) => {
                    setStoreSearch(e.target.value);
                    if (selectedStore) {
                      setSelectedStore(null);
                      setFormData(prev => ({...prev, store_id: ''}));
                    }
                  }}
                  style={{borderColor: errors.store_id ? 'var(--error-border)' : undefined}}
                />
                <Search size={16} style={{
                  position: 'absolute',
                  right: 'var(--spacing-md)',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-disabled)'
                }} />
              </div>
              
              {/* Store Search Results */}
              {storeSearchResults.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: 'var(--radius-md)',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 1000,
                  marginTop: '0.25rem'
                }}>
                  {storeSearchResults.map(store => (
                    <div
                      key={store.id}
                      style={{
                        padding: 'var(--spacing-md)',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--border-light)',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.background = 'var(--bg-glass-light)'}
                      onMouseLeave={(e) => e.target.style.background = 'transparent'}
                      onClick={() => handleStoreSelect(store)}
                    >
                      <div style={{fontWeight: '500', color: 'var(--text-primary)'}}>
                        {store.name}
                      </div>
                      <div style={{fontSize: '0.875rem', color: 'var(--text-secondary)'}}>
                        {store.email} • ID: {store.id}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {storeSearchLoading && (
                <div style={{fontSize: '0.875rem', color: 'var(--text-disabled)', marginTop: '0.25rem'}}>
                  Searching stores...
                </div>
              )}
              
              {errors.store_id && (
                <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                  {errors.store_id}
                </span>
              )}
            </div>
          </div>

          {/* Amount Details */}
          <div style={{marginBottom: 'var(--spacing-xl)'}}>
            <h4 style={{fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
              <DollarSign size={18} />
              Amount Details
            </h4>
            
            {/* Bill Amount & Commission */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)'}}>
              <div className="form-group">
                <label className="form-label">Bill Amount (₹) *</label>
                <input
                  type="number"
                  name="bill_amount"
                  className="form-input"
                  placeholder="Enter bill amount"
                  value={formData.bill_amount}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  style={{borderColor: errors.bill_amount ? 'var(--error-border)' : undefined}}
                />
                {errors.bill_amount && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.bill_amount}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Percent size={16} style={{marginRight: 'var(--spacing-sm)'}} />
                  Commission Percentage (%) *
                </label>
                <input
                  type="number"
                  name="commission_percentage"
                  className="form-input"
                  placeholder="Enter commission percentage"
                  value={formData.commission_percentage}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  step="0.01"
                  style={{borderColor: errors.commission_percentage ? 'var(--error-border)' : undefined}}
                />
                {errors.commission_percentage && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.commission_percentage}
                  </span>
                )}
              </div>
            </div>

            {/* Calculated Amounts */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)'}}>
              <div className="form-group">
                <label className="form-label">Commission Amount (₹)</label>
                <input
                  type="number"
                  name="commission_amount"
                  className="form-input"
                  value={formData.commission_amount}
                  style={{background: 'var(--bg-glass-light)', color: 'var(--text-secondary)'}}
                  readOnly
                />
              </div>

              <div className="form-group">
                <label className="form-label">Settlement Amount (₹)</label>
                <input
                  type="number"
                  name="settlement_amount"
                  className="form-input"
                  value={formData.settlement_amount}
                  style={{background: 'var(--bg-glass-light)', color: 'var(--text-secondary)'}}
                  readOnly
                />
              </div>

              <div className="form-group">
                <label className="form-label">Net Settlement (₹)</label>
                <input
                  type="number"
                  name="net_settlement_amount"
                  className="form-input"
                  value={formData.net_settlement_amount}
                  style={{background: 'var(--bg-glass-light)', color: 'var(--success-text)', fontWeight: '600'}}
                  readOnly
                />
              </div>
            </div>

            {/* Deductions */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)'}}>
              <div className="form-group">
                <label className="form-label">Tax Amount (₹)</label>
                <input
                  type="number"
                  name="tax_amount"
                  className="form-input"
                  placeholder="0.00"
                  value={formData.tax_amount}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Processing Fee (₹)</label>
                <input
                  type="number"
                  name="processing_fee"
                  className="form-input"
                  placeholder="0.00"
                  value={formData.processing_fee}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* Settlement Status */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)'}}>
              <div className="form-group">
                <label className="form-label">Settled Amount (₹)</label>
                <input
                  type="number"
                  name="settled_amount"
                  className="form-input"
                  placeholder="Enter amount you have settled"
                  value={formData.settled_amount}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                />
                <div style={{fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem'}}>
                  Enter the actual amount you have paid to the store
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Pending Amount (₹)</label>
                <input
                  type="number"
                  name="pending_amount"
                  className="form-input"
                  value={formData.pending_amount}
                  style={{background: 'var(--bg-glass-light)', color: 'var(--warning-text)', fontWeight: '600'}}
                  readOnly
                />
                <div style={{fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem'}}>
                  Auto-calculated: Remaining amount to settle
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Extra Paid Amount (₹)</label>
                <input
                  type="number"
                  name="extra_paid_amount"
                  className="form-input"
                  value={formData.extra_paid_amount}
                  style={{background: 'var(--bg-glass-light)', color: 'var(--success-text)', fontWeight: '600'}}
                  readOnly
                />
                <div style={{fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem'}}>
                  Auto-calculated: Overpayment amount
                </div>
              </div>
            </div>

            {/* Settlement Summary */}
            <div style={{
              padding: 'var(--spacing-lg)',
              background: 'var(--bg-glass)',
              border: '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: 'var(--spacing-lg)'
            }}>
              <h5 style={{fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-md)'}}>
                Settlement Calculation Summary
              </h5>
              
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)', fontSize: '0.875rem'}}>
                <div>
                  <div style={{color: 'var(--text-muted)', marginBottom: '0.25rem'}}>Bill Amount:</div>
                  <div style={{color: 'var(--text-primary)', fontWeight: '500', marginBottom: 'var(--spacing-sm)'}}>
                    {formatCurrency(formData.bill_amount)}
                  </div>
                  
                  <div style={{color: 'var(--text-muted)', marginBottom: '0.25rem'}}>Commission ({formData.commission_percentage}%):</div>
                  <div style={{color: 'var(--error-text)', fontWeight: '500', marginBottom: 'var(--spacing-sm)'}}>
                    - {formatCurrency(formData.commission_amount)}
                  </div>
                  
                  <div style={{color: 'var(--text-muted)', marginBottom: '0.25rem'}}>Settlement Amount (to store):</div>
                  <div style={{color: 'var(--text-primary)', fontWeight: '600'}}>
                    {formatCurrency(formData.settlement_amount)}
                  </div>
                </div>
                
                <div>
                  <div style={{color: 'var(--text-muted)', marginBottom: '0.25rem'}}>Amount You Settled:</div>
                  <div style={{color: 'var(--text-primary)', fontWeight: '600', marginBottom: 'var(--spacing-sm)'}}>
                    {formatCurrency(formData.settled_amount)}
                  </div>
                  
                  {parseFloat(formData.pending_amount) > 0 && (
                    <>
                      <div style={{color: 'var(--text-muted)', marginBottom: '0.25rem'}}>Pending Amount:</div>
                      <div style={{color: 'var(--warning-text)', fontWeight: '600', marginBottom: 'var(--spacing-sm)'}}>
                        {formatCurrency(formData.pending_amount)}
                      </div>
                    </>
                  )}
                  
                  {parseFloat(formData.extra_paid_amount) > 0 && (
                    <>
                      <div style={{color: 'var(--text-muted)', marginBottom: '0.25rem'}}>Extra Paid:</div>
                      <div style={{color: 'var(--success-text)', fontWeight: '600'}}>
                        + {formatCurrency(formData.extra_paid_amount)}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Net Settlement Amount Display */}
            <div style={{
              padding: 'var(--spacing-lg)',
              background: 'var(--success-bg)',
              border: '1px solid var(--success-border)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                <Calculator size={20} style={{color: 'var(--success-text)'}} />
                <span style={{fontSize: '1.1rem', fontWeight: '500', color: 'var(--success-text)'}}>
                  Net Settlement Amount
                </span>
              </div>
              <div style={{fontSize: '1.5rem', fontWeight: '700', color: 'var(--success-text)'}}>
                {formatCurrency(formData.net_settlement_amount)}
              </div>
            </div>
          </div>

          {/* Settlement Details */}
          <div style={{marginBottom: 'var(--spacing-xl)'}}>
            <h4 style={{fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
              <FileText size={18} />
              Settlement Details
            </h4>
            
            {/* Status & Payment Method */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)'}}>
              <div className="form-group">
                <label className="form-label">
                  <Clock size={16} style={{marginRight: 'var(--spacing-sm)'}} />
                  Settlement Status *
                </label>
                <select
                  name="settlement_status"
                  className="form-input"
                  value={formData.settlement_status}
                  onChange={handleInputChange}
                  style={{borderColor: errors.settlement_status ? 'var(--error-border)' : undefined}}
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                {errors.settlement_status && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.settlement_status}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select
                  name="payment_method"
                  className="form-input"
                  value={formData.payment_method}
                  onChange={handleInputChange}
                >
                  <option value="">Select Payment Method</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="upi">UPI</option>
                  <option value="cheque">Cheque</option>
                  <option value="cash">Cash</option>
                  <option value="wallet">Wallet</option>
                </select>
              </div>
            </div>

            {/* Payment Reference & Bank Account */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)'}}>
              <div className="form-group">
                <label className="form-label">Payment Reference</label>
                <input
                  type="text"
                  name="payment_reference"
                  className="form-input"
                  placeholder="Enter payment reference number"
                  value={formData.payment_reference}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Building size={16} style={{marginRight: 'var(--spacing-sm)'}} />
                  Bank Account
                </label>
                <input
                  type="text"
                  name="bank_account"
                  className="form-input"
                  placeholder="Enter bank account number"
                  value={formData.bank_account}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Dates */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)'}}>
              <div className="form-group">
                <label className="form-label">Transaction Date</label>
                <input
                  type="date"
                  name="transaction_date"
                  className="form-input"
                  value={formData.transaction_date}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Settlement Date</label>
                <input
                  type="date"
                  name="settlement_date"
                  className="form-input"
                  value={formData.settlement_date}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Comments */}
            <div className="form-group">
              <label className="form-label">Comments</label>
              <textarea
                name="comments"
                className="form-input"
                placeholder="Enter any additional comments..."
                value={formData.comments}
                onChange={handleInputChange}
                rows="3"
                style={{resize: 'vertical'}}
              />
            </div>
          </div>
        </form>
      </div>

      {/* Floating Action Buttons */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        display: 'flex',
        gap: 'var(--spacing-md)',
        zIndex: 1000,
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(20px)',
        padding: 'var(--spacing-md)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-glass)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <Link to="/settlements" className="btn btn-secondary">
          <X size={16} />
          Cancel
        </Link>
        <button 
          type="button"
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={submitLoading}
        >
          {submitLoading ? (
            <>
              <div className="spinner-ring" style={{
                width: '16px', 
                height: '16px', 
                border: '2px solid rgba(255,255,255,0.3)', 
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              Creating...
            </>
          ) : (
            <>
              <Save size={16} />
              Create Settlement
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SettlementForm;