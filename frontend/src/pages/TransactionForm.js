// pages/TransactionForm.js - Transaction Creation Form
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Save, X, CreditCard, Search, User, Store, Tag,
  DollarSign, AlertCircle, Receipt, Clock,
  Users, ShoppingBag, Percent, Calculator
} from 'lucide-react';
import '../styles/AdminStyles.css';

const TransactionForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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
  
  const [couponSearch, setCouponSearch] = useState('');
  const [couponSearchResults, setCouponSearchResults] = useState([]);
  const [couponSearchLoading, setCouponSearchLoading] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  
  // Form data state
  const [formData, setFormData] = useState({
    transaction_number: '',
    user_id: '',
    store_id: '',
    bill_amount: '',
    vendor_discount: '',
    cashback_used: '',
    coupon_discount: '',
    final_amount: '',
    cashback_earned: '',
    payment_method: 'cash',
    payment_status: 'pending',
    comment: '',
    coupon_id: ''
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
      
    //   const endpoints = [
    //     `${API_BASE_URL}/users/search?q=${encodeURIComponent(searchTerm)}`,
    //     `${API_BASE_URL}/users?search=${encodeURIComponent(searchTerm)}`,
    //     `/api/users/search?q=${encodeURIComponent(searchTerm)}`
    //   ];
    const endpoints = [
        `${API_BASE_URL}/transactions/search/users?q=${encodeURIComponent(searchTerm)}`,
        `/api/transactions/search/users?q=${encodeURIComponent(searchTerm)}`
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
      
    //   const endpoints = [
    //     `${API_BASE_URL}/stores/search?q=${encodeURIComponent(searchTerm)}`,
    //     `${API_BASE_URL}/stores?search=${encodeURIComponent(searchTerm)}`,
    //     `/api/stores/search?q=${encodeURIComponent(searchTerm)}`
    //   ];
        const endpoints = [
            `${API_BASE_URL}/transactions/search/stores?q=${encodeURIComponent(searchTerm)}`,
            `/api/transactions/search/stores?q=${encodeURIComponent(searchTerm)}`
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

  // Search coupons
  const searchCoupons = useCallback(async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setCouponSearchResults([]);
      return;
    }

    try {
      setCouponSearchLoading(true);
      
    //   const endpoints = [
    //     `${API_BASE_URL}/coupons/search?q=${encodeURIComponent(searchTerm)}`,
    //     `${API_BASE_URL}/coupons?search=${encodeURIComponent(searchTerm)}`,
    //     `/api/coupons/search?q=${encodeURIComponent(searchTerm)}`
    //   ];
        
    const endpoints = [
        `${API_BASE_URL}/transactions/search/coupons?q=${encodeURIComponent(searchTerm)}`,
        `/api/transactions/search/coupons?q=${encodeURIComponent(searchTerm)}`
    ];

      let couponData = null;

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: getHeaders(),
            credentials: 'include'
          });

          if (response.ok) {
            const data = await response.json();
            couponData = data;
            break;
          }
        } catch (err) {
          continue;
        }
      }

      if (couponData && couponData.success) {
        setCouponSearchResults(couponData.data || []);
      } else {
        setCouponSearchResults([]);
      }
    } catch (error) {
      console.error('Coupon search failed:', error);
      setCouponSearchResults([]);
    } finally {
      setCouponSearchLoading(false);
    }
  }, [API_BASE_URL]);

  // Debounced search functions
  const debouncedUserSearch = useCallback(debounce(searchUsers, 300), [searchUsers]);
  const debouncedStoreSearch = useCallback(debounce(searchStores, 300), [searchStores]);
  const debouncedCouponSearch = useCallback(debounce(searchCoupons, 300), [searchCoupons]);

  // Handle search input changes
  useEffect(() => {
    debouncedUserSearch(userSearch);
  }, [userSearch, debouncedUserSearch]);

  useEffect(() => {
    debouncedStoreSearch(storeSearch);
  }, [storeSearch, debouncedStoreSearch]);

  useEffect(() => {
    debouncedCouponSearch(couponSearch);
  }, [couponSearch, debouncedCouponSearch]);

  // Auto-generate transaction number on mount
  useEffect(() => {
    const generateTransactionNumber = () => {
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const time = Date.now().toString().slice(-6);
      return `TXN${year}${month}${day}${time}`;
    };

    setFormData(prev => ({
      ...prev,
      transaction_number: generateTransactionNumber()
    }));
  }, []);

  // Calculate final amount whenever related fields change
  useEffect(() => {
    const billAmount = parseFloat(formData.bill_amount) || 0;
    const vendorDiscount = parseFloat(formData.vendor_discount) || 0;
    const cashbackUsed = parseFloat(formData.cashback_used) || 0;
    const couponDiscount = parseFloat(formData.coupon_discount) || 0;
    
    const finalAmount = billAmount - vendorDiscount - cashbackUsed - couponDiscount;
    
    setFormData(prev => ({
      ...prev,
      final_amount: finalAmount.toFixed(2)
    }));
  }, [formData.bill_amount, formData.vendor_discount, formData.cashback_used, formData.coupon_discount]);

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

  // Handle coupon selection
const handleCouponSelect = (coupon) => {
  setSelectedCoupon(coupon);
  setCouponSearch(`${coupon.code} (${coupon.name || coupon.title})`);
  setFormData(prev => ({
    ...prev,
    coupon_id: coupon.id,
    // Use discount_amount if available, otherwise discount_percentage
    coupon_discount: coupon.discount_amount || coupon.discount_percentage || ''
  }));
  setCouponSearchResults([]);
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

    if (!formData.payment_method) {
      newErrors.payment_method = 'Payment method is required';
    }

    if (!formData.payment_status) {
      newErrors.payment_status = 'Payment status is required';
    }

    // Numeric validations
    if (formData.vendor_discount && (isNaN(formData.vendor_discount) || parseFloat(formData.vendor_discount) < 0)) {
      newErrors.vendor_discount = 'Vendor discount must be a positive number';
    }

    if (formData.cashback_used && (isNaN(formData.cashback_used) || parseFloat(formData.cashback_used) < 0)) {
      newErrors.cashback_used = 'Cashback used must be a positive number';
    }

    if (formData.coupon_discount && (isNaN(formData.coupon_discount) || parseFloat(formData.coupon_discount) < 0)) {
      newErrors.coupon_discount = 'Coupon discount must be a positive number';
    }

    if (formData.cashback_earned && (isNaN(formData.cashback_earned) || parseFloat(formData.cashback_earned) < 0)) {
      newErrors.cashback_earned = 'Cashback earned must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const submitData = {
        ...formData,
        bill_amount: parseFloat(formData.bill_amount),
        vendor_discount: parseFloat(formData.vendor_discount) || 0,
        cashback_used: parseFloat(formData.cashback_used) || 0,
        coupon_discount: parseFloat(formData.coupon_discount) || 0,
        final_amount: parseFloat(formData.final_amount),
        cashback_earned: parseFloat(formData.cashback_earned) || 0,
        user_id: parseInt(formData.user_id),
        store_id: parseInt(formData.store_id),
        coupon_id: formData.coupon_id ? parseInt(formData.coupon_id) : null
      };

      console.log('🔄 Creating new transaction:', submitData);

      const response = await fetch(`${API_BASE_URL}/transactions`, {
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
        alert('Transaction created successfully!');
        navigate('/transactions');
      } else {
        throw new Error(result.message || 'Transaction creation failed');
      }

    } catch (error) {
      console.error('❌ Create failed:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    const num = parseFloat(amount) || 0;
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="page-container" style={{paddingBottom: '100px'}}>
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

      {/* Transaction Form */}
      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">Transaction Information</h3>
        </div>
        
        <form onSubmit={handleSubmit} style={{padding: 'var(--spacing-lg)'}}>
          {/* Transaction Details */}
          <div style={{marginBottom: 'var(--spacing-xl)'}}>
            <h4 style={{fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
              <Receipt size={18} />
              Transaction Details
            </h4>
            
            {/* Transaction Number */}
            <div className="form-group" style={{marginBottom: 'var(--spacing-lg)'}}>
              <label className="form-label">Transaction Number</label>
              <input
                type="text"
                name="transaction_number"
                className="form-input"
                value={formData.transaction_number}
                onChange={handleInputChange}
                placeholder="Auto-generated"
                style={{background: 'var(--bg-glass-light)', color: 'var(--text-secondary)'}}
                readOnly
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
                  onChange={(e) => setUserSearch(e.target.value)}
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
                  onChange={(e) => setStoreSearch(e.target.value)}
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
            
            {/* Bill Amount */}
            <div className="form-group" style={{marginBottom: 'var(--spacing-lg)'}}>
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

            {/* Discounts Row */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)'}}>
              <div className="form-group">
                <label className="form-label">
                  <Percent size={16} style={{marginRight: 'var(--spacing-sm)'}} />
                  Vendor Discount (₹)
                </label>
                <input
                  type="number"
                  name="vendor_discount"
                  className="form-input"
                  placeholder="0.00"
                  value={formData.vendor_discount}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  style={{borderColor: errors.vendor_discount ? 'var(--error-border)' : undefined}}
                />
                {errors.vendor_discount && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.vendor_discount}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Cashback Used (₹)</label>
                <input
                  type="number"
                  name="cashback_used"
                  className="form-input"
                  placeholder="0.00"
                  value={formData.cashback_used}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  style={{borderColor: errors.cashback_used ? 'var(--error-border)' : undefined}}
                />
                {errors.cashback_used && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.cashback_used}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Cashback Earned (₹)</label>
                <input
                  type="number"
                  name="cashback_earned"
                  className="form-input"
                  placeholder="0.00"
                  value={formData.cashback_earned}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  style={{borderColor: errors.cashback_earned ? 'var(--error-border)' : undefined}}
                />
                {errors.cashback_earned && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.cashback_earned}
                  </span>
                )}
              </div>
            </div>

            {/* Coupon Section */}
            <div style={{marginBottom: 'var(--spacing-lg)'}}>
              <h5 style={{fontSize: '1rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                <Tag size={16} />
                Coupon (Optional)
              </h5>
              
              <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-lg)'}}>
                {/* Coupon Search */}
                <div className="form-group" style={{position: 'relative'}}>
                  <label className="form-label">Search Coupon</label>
                  <div style={{position: 'relative'}}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Search coupon by code..."
                      value={couponSearch}
                      onChange={(e) => setCouponSearch(e.target.value)}
                    />
                    <Search size={16} style={{
                      position: 'absolute',
                      right: 'var(--spacing-md)',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-disabled)'
                    }} />
                  </div>
                  
                  {/* Coupon Search Results */}
                  {couponSearchResults.length > 0 && (
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
                      {couponSearchResults.map(coupon => (
                        <div
                            key={coupon.id}
                            style={{
                            padding: 'var(--spacing-md)',
                            cursor: 'pointer',
                            borderBottom: '1px solid var(--border-light)',
                            transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.background = 'var(--bg-glass-light)'}
                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                            onClick={() => handleCouponSelect(coupon)}
                        >
                            <div style={{fontWeight: '500', color: 'var(--text-primary)'}}>
                            {coupon.code}
                            </div>
                            <div style={{fontSize: '0.875rem', color: 'var(--text-secondary)'}}>
                            {coupon.name || coupon.title} • 
                            {coupon.discount_amount ? `₹${coupon.discount_amount}` : `${coupon.discount_percentage}%`} • 
                            ID: {coupon.id}
                            </div>
                        </div>
                        ))}
                    </div>
                  )}
                  
                  {couponSearchLoading && (
                    <div style={{fontSize: '0.875rem', color: 'var(--text-disabled)', marginTop: '0.25rem'}}>
                      Searching coupons...
                    </div>
                  )}
                </div>

                {/* Coupon Discount */}
                <div className="form-group">
                  <label className="form-label">Coupon Discount (₹)</label>
                  <input
                    type="number"
                    name="coupon_discount"
                    className="form-input"
                    placeholder="0.00"
                    value={formData.coupon_discount}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    style={{borderColor: errors.coupon_discount ? 'var(--error-border)' : undefined}}
                  />
                  {errors.coupon_discount && (
                    <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                      {errors.coupon_discount}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Final Amount Display */}
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
                  Final Amount
                </span>
              </div>
              <div style={{fontSize: '1.5rem', fontWeight: '700', color: 'var(--success-text)'}}>
                {formatCurrency(formData.final_amount)}
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div style={{marginBottom: 'var(--spacing-xl)'}}>
            <h4 style={{fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
              <CreditCard size={18} />
              Payment Details
            </h4>
            
            {/* Payment Method | Payment Status */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)'}}>
              <div className="form-group">
                <label className="form-label">Payment Method *</label>
                <select
                  name="payment_method"
                  className="form-input"
                  value={formData.payment_method}
                  onChange={handleInputChange}
                  style={{borderColor: errors.payment_method ? 'var(--error-border)' : undefined}}
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="net_banking">Net Banking</option>
                  <option value="wallet">Wallet</option>
                </select>
                {errors.payment_method && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.payment_method}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Clock size={16} style={{marginRight: 'var(--spacing-sm)'}} />
                  Payment Status *
                </label>
                <select
                  name="payment_status"
                  className="form-input"
                  value={formData.payment_status}
                  onChange={handleInputChange}
                  style={{borderColor: errors.payment_status ? 'var(--error-border)' : undefined}}
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                {errors.payment_status && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.payment_status}
                  </span>
                )}
              </div>
            </div>

            {/* Comment */}
            <div className="form-group">
              <label className="form-label">Comment</label>
              <textarea
                name="comment"
                className="form-input"
                placeholder="Enter any additional comments..."
                value={formData.comment}
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
        <Link to="/transactions" className="btn btn-secondary">
          <X size={16} />
          Cancel
        </Link>
        <button 
          type="button"
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
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
              Create Transaction
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default TransactionForm;