// pages/CouponForm.js - UPDATED with Transaction-style search UI
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Save, X, Ticket, Tag, Percent, Calendar,
  Store, Target, Gift, AlertCircle, Users, User, Search
} from 'lucide-react';
import '../styles/AdminStyles.css';

const CouponForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stores, setStores] = useState([]);
  
  // Search states
  const [userSearch, setUserSearch] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  const [storeSearch, setStoreSearch] = useState('');
  const [storeSearchResults, setStoreSearchResults] = useState([]);
  const [storeSearchLoading, setStoreSearchLoading] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  
  // Form data state matching coupon_master structure
  const [formData, setFormData] = useState({
    coupon_name: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    valid_from: '',
    valid_till: '',
    lifetime_validity: 0,
    for_all_user: 1,
    for_all_vip_user: 0,
    for_specific_user: 0,
    for_all_store: 1,
    for_all_premium_store: 0,
    for_specific_store: 0,
    for_new_user: 0,
    new_user_name: '',
    new_user_mobile_no: '',
    store_id: '',
    user_id: '',
    is_active: 1
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
  const searchUsers = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setUserSearchResults([]);
      return;
    }

    try {
      setUserSearchLoading(true);
      
      const endpoints = [
        `${API_BASE_URL}/users?search=${encodeURIComponent(searchTerm)}&limit=10`,
        `/api/users?search=${encodeURIComponent(searchTerm)}&limit=10`
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
        setUserSearchResults(userData.data?.users || userData.data || []);
      } else {
        setUserSearchResults([]);
      }
    } catch (error) {
      console.error('User search failed:', error);
      setUserSearchResults([]);
    } finally {
      setUserSearchLoading(false);
    }
  };

  // Search stores
  const searchStores = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setStoreSearchResults([]);
      return;
    }

    try {
      setStoreSearchLoading(true);
      
      const filteredStores = stores.filter(store => 
        store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      setStoreSearchResults(filteredStores);
    } catch (error) {
      console.error('Store search failed:', error);
      setStoreSearchResults([]);
    } finally {
      setStoreSearchLoading(false);
    }
  };

  // Debounced search functions
  const debouncedUserSearch = debounce(searchUsers, 300);
  const debouncedStoreSearch = debounce(searchStores, 300);

  // Fetch stores for dropdown
  const fetchStores = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/stores`, {
        method: 'GET',
        headers: getHeaders(),
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        const storesList = data.success ? (data.data?.stores || data.data || []) : [];
        setStores(storesList);
      }
    } catch (error) {
      console.warn('Failed to fetch stores:', error);
      setStores([]);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  // Handle search input changes
  useEffect(() => {
    debouncedUserSearch(userSearch);
  }, [userSearch]);

  useEffect(() => {
    debouncedStoreSearch(storeSearch);
  }, [storeSearch]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    let newValue = value;
    if (type === 'checkbox') {
      newValue = checked ? 1 : 0;
    } else if (type === 'number') {
      newValue = value === '' ? '' : parseFloat(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle store targeting change
  const handleStoreTargetingChange = (targetType) => {
    setFormData(prev => ({
      ...prev,
      for_all_store: targetType === 'all' ? 1 : 0,
      for_all_premium_store: targetType === 'premium' ? 1 : 0,
      for_specific_store: targetType === 'specific' ? 1 : 0,
      store_id: targetType === 'specific' ? prev.store_id : ''
    }));

    // Reset store selection when changing targeting type
    if (targetType !== 'specific') {
      setSelectedStore(null);
      setStoreSearch('');
      setStoreSearchResults([]);
    }
  };

  // Handle user targeting change
  const handleUserTargetingChange = (targetType) => {
    setFormData(prev => ({
      ...prev,
      for_all_user: targetType === 'all' ? 1 : 0,
      for_all_vip_user: targetType === 'vip' ? 1 : 0,
      for_specific_user: targetType === 'specific' ? 1 : 0,
      for_new_user: targetType === 'new' ? 1 : 0,
      new_user_name: targetType === 'new' ? prev.new_user_name : '',
      new_user_mobile_no: targetType === 'new' ? prev.new_user_mobile_no : '',
      user_id: targetType === 'specific' ? prev.user_id : ''
    }));

    // Reset user selection when changing targeting type
    if (targetType !== 'specific') {
      setSelectedUser(null);
      setUserSearch('');
      setUserSearchResults([]);
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
    setStoreSearch(`${store.name} (${store.email || 'No email'})`);
    setFormData(prev => ({
      ...prev,
      store_id: store.id
    }));
    setStoreSearchResults([]);
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.coupon_name.trim()) {
      newErrors.coupon_name = 'Coupon name is required';
    }

    if (!formData.discount_type) {
      newErrors.discount_type = 'Discount type is required';
    }

    if (!formData.discount_value || formData.discount_value <= 0) {
      newErrors.discount_value = 'Discount value is required and must be greater than 0';
    }

    if (formData.discount_type === 'percentage' && formData.discount_value > 100) {
      newErrors.discount_value = 'Percentage discount cannot exceed 100%';
    }

    if (!formData.lifetime_validity) {
      if (!formData.valid_from) {
        newErrors.valid_from = 'Valid from date is required';
      }
      if (!formData.valid_till) {
        newErrors.valid_till = 'Valid till date is required';
      }
      if (formData.valid_from && formData.valid_till) {
        const fromDate = new Date(formData.valid_from);
        const tillDate = new Date(formData.valid_till);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (fromDate < today) {
          newErrors.valid_from = 'Valid from date cannot be in the past';
        }
        
        if (tillDate <= fromDate) {
          newErrors.valid_till = 'Valid till date must be after valid from date';
        }
      }
    }

    if (formData.for_specific_store && !formData.store_id) {
      newErrors.store_id = 'Store selection is required for specific store targeting';
    }

    if (formData.for_specific_user && !formData.user_id) {
      newErrors.user_id = 'User selection is required for specific user targeting';
    }

    if (formData.for_new_user && !formData.new_user_name) {
      newErrors.new_user_name = 'User name is required for new user targeting';
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
      const createData = { ...formData };
      
      if (createData.valid_from) {
        createData.valid_from = new Date(createData.valid_from).toISOString();
      }
      if (createData.valid_till) {
        createData.valid_till = new Date(createData.valid_till).toISOString();
      }

      console.log('🔄 Creating new coupon with data:', createData);

      const response = await fetch(`${API_BASE_URL}/coupons`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(createData)
      });

      console.log(`📡 Create response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Create result:', result);
      
      if (result.success) {
        alert('Coupon created successfully!');
        navigate('/coupons');
      } else {
        throw new Error(result.message || 'Coupon creation failed');
      }

    } catch (error) {
      console.error('❌ Create failed:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStoreTargeting = () => {
    if (formData.for_all_store) return 'all';
    if (formData.for_all_premium_store) return 'premium';
    if (formData.for_specific_store) return 'specific';
    return 'all';
  };

  const getCurrentUserTargeting = () => {
    if (formData.for_all_user) return 'all';
    if (formData.for_all_vip_user) return 'vip';
    if (formData.for_specific_user) return 'specific';
    if (formData.for_new_user) return 'new';
    return 'all';
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

      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">Create New Coupon</h3>
        </div>
        
        <form onSubmit={handleSubmit} style={{padding: 'var(--spacing-lg)'}}>
          {/* Basic Information */}
          <div style={{marginBottom: 'var(--spacing-xl)'}}>
            <h4 style={{fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
              <Ticket size={18} />
              Basic Information
            </h4>
            
            <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)'}}>
              <div className="form-group">
                <label className="form-label">Coupon Name *</label>
                <input
                  type="text"
                  name="coupon_name"
                  className="form-input"
                  placeholder="e.g., Save 20% on Electronics"
                  value={formData.coupon_name}
                  onChange={handleInputChange}
                  style={{borderColor: errors.coupon_name ? 'var(--error-border)' : undefined}}
                />
                {errors.coupon_name && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.coupon_name}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  name="description"
                  className="form-input"
                  placeholder="Describe the coupon and its terms..."
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  style={{resize: 'vertical'}}
                />
              </div>
            </div>
          </div>

          {/* Discount Configuration */}
          <div style={{marginBottom: 'var(--spacing-xl)'}}>
            <h4 style={{fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
              <Percent size={18} />
              Discount Configuration
            </h4>
            
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)'}}>
              <div className="form-group">
                <label className="form-label">Discount Type *</label>
                <select
                  name="discount_type"
                  className="form-input"
                  value={formData.discount_type}
                  onChange={handleInputChange}
                  style={{borderColor: errors.discount_type ? 'var(--error-border)' : undefined}}
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
                {errors.discount_type && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.discount_type}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Discount Value * ({formData.discount_type === 'percentage' ? '%' : '₹'})
                </label>
                <input
                  type="number"
                  name="discount_value"
                  className="form-input"
                  placeholder={formData.discount_type === 'percentage' ? 'e.g., 20' : 'e.g., 50'}
                  value={formData.discount_value}
                  onChange={handleInputChange}
                  min="0"
                  max={formData.discount_type === 'percentage' ? '100' : undefined}
                  step="0.01"
                  style={{borderColor: errors.discount_value ? 'var(--error-border)' : undefined}}
                />
                {errors.discount_value && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.discount_value}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Validity Configuration */}
          <div style={{marginBottom: 'var(--spacing-xl)'}}>
            <h4 style={{fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
              <Calendar size={18} />
              Validity Configuration
            </h4>
            
            <div style={{marginBottom: 'var(--spacing-lg)'}}>
              <label style={{
                display: 'flex', 
                alignItems: 'center', 
                gap: 'var(--spacing-md)', 
                cursor: 'pointer',
                padding: 'var(--spacing-md)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-glass)',
                background: formData.lifetime_validity ? 'var(--success-bg)' : 'var(--bg-glass-light)',
                transition: 'all 0.2s ease'
              }}>
                <input
                  type="checkbox"
                  name="lifetime_validity"
                  checked={formData.lifetime_validity === 1}
                  onChange={handleInputChange}
                  className="checkbox-input"
                />
                <span style={{color: 'var(--text-secondary)', fontWeight: '500'}}>Lifetime Validity</span>
                <span style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>
                  (Coupon will never expire)
                </span>
              </label>
            </div>

            {!formData.lifetime_validity && (
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)'}}>
                <div className="form-group">
                  <label className="form-label">Valid From *</label>
                  <input
                    type="date"
                    name="valid_from"
                    className="form-input"
                    value={formData.valid_from}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    style={{borderColor: errors.valid_from ? 'var(--error-border)' : undefined}}
                  />
                  {errors.valid_from && (
                    <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                      {errors.valid_from}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Valid Till *</label>
                  <input
                    type="date"
                    name="valid_till"
                    className="form-input"
                    value={formData.valid_till}
                    onChange={handleInputChange}
                    min={formData.valid_from || new Date().toISOString().split('T')[0]}
                    style={{borderColor: errors.valid_till ? 'var(--error-border)' : undefined}}
                  />
                  {errors.valid_till && (
                    <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                      {errors.valid_till}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Targeting */}
          <div style={{marginBottom: 'var(--spacing-xl)'}}>
            <h4 style={{fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
              <Users size={18} />
              User Targeting
            </h4>
            
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)'}}>
              {[
                { value: 'all', label: 'All Users', icon: Users, description: 'Available to all registered users' },
                { value: 'vip', label: 'VIP Users', icon: User, description: 'Only for VIP/Premium users' },
                { value: 'new', label: 'New Users', icon: Gift, description: 'For new user registration' },
                { value: 'specific', label: 'Specific User', icon: Target, description: 'For one specific user' }
              ].map(option => (
                <label 
                  key={option.value}
                  style={{
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: 'var(--spacing-sm)', 
                    cursor: 'pointer',
                    padding: 'var(--spacing-md)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-glass)',
                    background: getCurrentUserTargeting() === option.value ? 'var(--primary-bg)' : 'var(--bg-glass-light)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <input
                    type="radio"
                    name="user_targeting"
                    value={option.value}
                    checked={getCurrentUserTargeting() === option.value}
                    onChange={() => handleUserTargetingChange(option.value)}
                    style={{marginTop: '2px'}}
                  />
                  <option.icon size={16} style={{marginTop: '2px', color: 'var(--text-muted)'}} />
                  <div>
                    <div style={{fontWeight: '500', color: 'var(--text-secondary)'}}>{option.label}</div>
                    <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>{option.description}</div>
                  </div>
                </label>
              ))}
            </div>

            {/* New User Fields */}
            {formData.for_new_user === 1 && (
              <div style={{
                padding: 'var(--spacing-lg)', 
                background: 'var(--bg-glass)', 
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-glass)'
              }}>
                <h5 style={{fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-md)'}}>
                  New User Information
                </h5>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)'}}>
                  <div className="form-group">
                    <label className="form-label">User Name *</label>
                    <input
                      type="text"
                      name="new_user_name"
                      className="form-input"
                      placeholder="Enter new user name"
                      value={formData.new_user_name}
                      onChange={handleInputChange}
                      style={{borderColor: errors.new_user_name ? 'var(--error-border)' : undefined}}
                    />
                    {errors.new_user_name && (
                      <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                        {errors.new_user_name}
                      </span>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mobile Number</label>
                    <input
                      type="text"
                      name="new_user_mobile_no"
                      className="form-input"
                      placeholder="Enter mobile number"
                      value={formData.new_user_mobile_no}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Specific User Search */}
            {formData.for_specific_user === 1 && (
              <div className="form-group" style={{marginBottom: 'var(--spacing-lg)', position: 'relative'}}>
                <label className="form-label">
                  <Users size={16} style={{marginRight: 'var(--spacing-sm)'}} />
                  Search & Select User *
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
            )}
          </div>

          {/* Store Targeting */}
          <div style={{marginBottom: 'var(--spacing-xl)'}}>
            <h4 style={{fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
              <Store size={18} />
              Store Targeting
            </h4>
            
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)'}}>
              {[
                { value: 'all', label: 'All Stores', icon: Store, description: 'Available in all stores' },
                { value: 'premium', label: 'Premium Stores', icon: Target, description: 'Only premium/featured stores' },
                { value: 'specific', label: 'Specific Store', icon: Gift, description: 'One specific store only' }
              ].map(option => (
                <label 
                  key={option.value}
                  style={{
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: 'var(--spacing-sm)', 
                    cursor: 'pointer',
                    padding: 'var(--spacing-md)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-glass)',
                    background: getCurrentStoreTargeting() === option.value ? 'var(--primary-bg)' : 'var(--bg-glass-light)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <input
                    type="radio"
                    name="store_targeting"
                    value={option.value}
                    checked={getCurrentStoreTargeting() === option.value}
                    onChange={() => handleStoreTargetingChange(option.value)}
                    style={{marginTop: '2px'}}
                  />
                  <option.icon size={16} style={{marginTop: '2px', color: 'var(--text-muted)'}} />
                  <div>
                    <div style={{fontWeight: '500', color: 'var(--text-secondary)'}}>{option.label}</div>
                    <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>{option.description}</div>
                  </div>
                </label>
              ))}
            </div>

            {/* Specific Store Search */}
            {formData.for_specific_store === 1 && (
              <div className="form-group" style={{marginBottom: 'var(--spacing-lg)', position: 'relative'}}>
                <label className="form-label">
                  <Store size={16} style={{marginRight: 'var(--spacing-sm)'}} />
                  Search & Select Store *
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
                          {store.email || store.description || 'No description'} • ID: {store.id}
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
            )}
          </div>

          {/* Status Settings */}
          <div style={{padding: 'var(--spacing-lg)', background: 'var(--bg-glass-light)', borderRadius: 'var(--radius-lg)'}}>
            <h4 style={{fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
              <Target size={18} />
              Status Settings
            </h4>
            <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                className="checkbox-input"
                checked={formData.is_active === 1}
                onChange={handleInputChange}
              />
              <label htmlFor="is_active" style={{color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: '500'}}>
                Coupon Active
              </label>
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
        <Link to="/coupons" className="btn btn-secondary">
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
              Create Coupon
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CouponForm;