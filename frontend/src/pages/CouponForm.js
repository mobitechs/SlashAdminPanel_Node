// pages/CouponForm.js - Optimized Layout with Better Space Usage
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Save, X, Ticket, Tag, Percent, Calendar,
  Store, Target, Gift, AlertCircle
} from 'lucide-react';
import '../styles/AdminStyles.css';

const CouponForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stores, setStores] = useState([]);
  
  // Form data state matching CouponEdit structure
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    discount_type: 'percentage', // 'percentage' or 'amount'
    discount_amount: '',
    discount_percentage: '',
    store_id: '',
    min_order_amount: '',
    max_discount: '',
    valid_from: '',
    valid_until: '',
    usage_limit: 1,
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

  // Handle discount type change
  const handleDiscountTypeChange = (e) => {
    const discountType = e.target.value;
    setFormData(prev => ({
      ...prev,
      discount_type: discountType,
      discount_amount: discountType === 'amount' ? prev.discount_amount : '',
      discount_percentage: discountType === 'percentage' ? prev.discount_percentage : ''
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.code.trim()) {
      newErrors.code = 'Coupon code is required';
    } else if (formData.code.length > 10) {
      newErrors.code = 'Coupon code must be 10 characters or less';
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.valid_from) {
      newErrors.valid_from = 'Valid from date is required';
    }

    if (!formData.valid_until) {
      newErrors.valid_until = 'Valid until date is required';
    }

    // Date validation
    if (formData.valid_from && formData.valid_until) {
      const fromDate = new Date(formData.valid_from);
      const untilDate = new Date(formData.valid_until);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (fromDate < today) {
        newErrors.valid_from = 'Valid from date cannot be in the past';
      }
      
      if (untilDate <= fromDate) {
        newErrors.valid_until = 'Valid until date must be after valid from date';
      }
    }

    // Discount validation
    if (formData.discount_type === 'percentage') {
      if (!formData.discount_percentage || formData.discount_percentage <= 0) {
        newErrors.discount_percentage = 'Discount percentage is required and must be greater than 0';
      } else if (formData.discount_percentage > 100) {
        newErrors.discount_percentage = 'Discount percentage cannot exceed 100%';
      }
    } else {
      if (!formData.discount_amount || formData.discount_amount <= 0) {
        newErrors.discount_amount = 'Discount amount is required and must be greater than 0';
      }
    }

    // Minimum order amount validation
    if (formData.min_order_amount && formData.min_order_amount < 0) {
      newErrors.min_order_amount = 'Minimum order amount cannot be negative';
    }

    // Maximum discount validation
    if (formData.max_discount && formData.max_discount <= 0) {
      newErrors.max_discount = 'Maximum discount must be greater than 0';
    }

    // Usage limit validation
    if (!formData.usage_limit || formData.usage_limit < 1) {
      newErrors.usage_limit = 'Usage limit must be at least 1';
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
      // Prepare create data
      const createData = {
        code: formData.code.trim().toUpperCase(),
        title: formData.title.trim(),
        description: formData.description.trim(),
        store_id: formData.store_id || null,
        min_order_amount: parseFloat(formData.min_order_amount) || 0,
        max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
        valid_from: new Date(formData.valid_from).toISOString(),
        valid_until: new Date(formData.valid_until).toISOString(),
        usage_limit: parseInt(formData.usage_limit),
        is_active: formData.is_active
      };

      // Set discount fields based on type
      if (formData.discount_type === 'percentage') {
        createData.discount_percentage = parseFloat(formData.discount_percentage);
        createData.discount_amount = null;
      } else {
        createData.discount_amount = parseFloat(formData.discount_amount);
        createData.discount_percentage = null;
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

      {/* Create Form Layout */}
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
            
            {/* Coupon Code | Title */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)'}}>
              <div className="form-group">
                <label className="form-label">Coupon Code *</label>
                <input
                  type="text"
                  name="code"
                  className="form-input"
                  placeholder="e.g., SAVE20"
                  value={formData.code}
                  onChange={handleInputChange}
                  maxLength="10"
                  style={{borderColor: errors.code ? 'var(--error-border)' : undefined, textTransform: 'uppercase'}}
                />
                {errors.code && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.code}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  name="title"
                  className="form-input"
                  placeholder="e.g., Save 20% on Electronics"
                  value={formData.title}
                  onChange={handleInputChange}
                  style={{borderColor: errors.title ? 'var(--error-border)' : undefined}}
                />
                {errors.title && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.title}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
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

          {/* Discount Configuration */}
          <div style={{marginBottom: 'var(--spacing-xl)'}}>
            <h4 style={{fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
              <Percent size={18} />
              Discount Configuration
            </h4>
            
            {/* Discount Type */}
            <div className="form-group" style={{marginBottom: 'var(--spacing-lg)'}}>
              <label className="form-label">Discount Type *</label>
              <select
                name="discount_type"
                className="form-input"
                value={formData.discount_type}
                onChange={handleDiscountTypeChange}
              >
                <option value="percentage">Percentage Discount</option>
                <option value="amount">Fixed Amount Discount</option>
              </select>
            </div>

            {/* Discount Value | Min Order Amount */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)'}}>
              {formData.discount_type === 'percentage' ? (
                <div className="form-group">
                  <label className="form-label">
                    <Percent size={16} style={{marginRight: 'var(--spacing-sm)'}} />
                    Discount Percentage *
                  </label>
                  <input
                    type="number"
                    name="discount_percentage"
                    className="form-input"
                    placeholder="e.g., 20"
                    value={formData.discount_percentage}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    step="0.01"
                    style={{borderColor: errors.discount_percentage ? 'var(--error-border)' : undefined}}
                  />
                  {errors.discount_percentage && (
                    <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                      {errors.discount_percentage}
                    </span>
                  )}
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">
                    <Gift size={16} style={{marginRight: 'var(--spacing-sm)'}} />
                    Discount Amount (₹) *
                  </label>
                  <input
                    type="number"
                    name="discount_amount"
                    className="form-input"
                    placeholder="e.g., 50"
                    value={formData.discount_amount}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    style={{borderColor: errors.discount_amount ? 'var(--error-border)' : undefined}}
                  />
                  {errors.discount_amount && (
                    <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                      {errors.discount_amount}
                    </span>
                  )}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">
                  <Target size={16} style={{marginRight: 'var(--spacing-sm)'}} />
                  Minimum Order Amount (₹)
                </label>
                <input
                  type="number"
                  name="min_order_amount"
                  className="form-input"
                  placeholder="e.g., 500"
                  value={formData.min_order_amount}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  style={{borderColor: errors.min_order_amount ? 'var(--error-border)' : undefined}}
                />
                {errors.min_order_amount && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.min_order_amount}
                  </span>
                )}
              </div>
            </div>

            {/* Max Discount | Usage Limit */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)'}}>
              <div className="form-group">
                <label className="form-label">Maximum Discount Cap (₹)</label>
                <input
                  type="number"
                  name="max_discount"
                  className="form-input"
                  placeholder="e.g., 200"
                  value={formData.max_discount}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  style={{borderColor: errors.max_discount ? 'var(--error-border)' : undefined}}
                />
                <small style={{color: 'var(--text-muted)', fontSize: '0.75rem'}}>
                  Leave empty for no cap
                </small>
                {errors.max_discount && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.max_discount}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Usage Limit *</label>
                <input
                  type="number"
                  name="usage_limit"
                  className="form-input"
                  placeholder="e.g., 100"
                  value={formData.usage_limit}
                  onChange={handleInputChange}
                  min="1"
                  step="1"
                  style={{borderColor: errors.usage_limit ? 'var(--error-border)' : undefined}}
                />
                {errors.usage_limit && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.usage_limit}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Store & Validity */}
          <div style={{marginBottom: 'var(--spacing-xl)'}}>
            <h4 style={{fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
              <Store size={18} />
              Store & Validity
            </h4>
            
            {/* Store Selection */}
            <div className="form-group" style={{marginBottom: 'var(--spacing-lg)'}}>
              <label className="form-label">
                <Store size={16} style={{marginRight: 'var(--spacing-sm)'}} />
                Applicable Store
              </label>
              <select
                name="store_id"
                className="form-input"
                value={formData.store_id}
                onChange={handleInputChange}
              >
                <option value="">All Stores</option>
                {stores.map(store => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
              <small style={{color: 'var(--text-muted)', fontSize: '0.75rem'}}>
                Leave empty to apply to all stores
              </small>
            </div>

            {/* Valid From | Valid Until */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)'}}>
              <div className="form-group">
                <label className="form-label">
                  <Calendar size={16} style={{marginRight: 'var(--spacing-sm)'}} />
                  Valid From *
                </label>
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
                <label className="form-label">
                  <Calendar size={16} style={{marginRight: 'var(--spacing-sm)'}} />
                  Valid Until *
                </label>
                <input
                  type="date"
                  name="valid_until"
                  className="form-input"
                  value={formData.valid_until}
                  onChange={handleInputChange}
                  min={formData.valid_from || new Date().toISOString().split('T')[0]}
                  style={{borderColor: errors.valid_until ? 'var(--error-border)' : undefined}}
                />
                {errors.valid_until && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.valid_until}
                  </span>
                )}
              </div>
            </div>
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
              <label htmlFor="is_active" style={{color: 'var(--text-secondary)', cursor: 'pointer'}}>
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