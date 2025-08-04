// pages/StoreForm.js - Store Creation Form with Optimized Layout
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Save, X, Store, Mail, Phone, MapPin,
  Shield, DollarSign, AlertCircle, Tag,
  Award, Globe, Percent, Upload, Image,
  Calendar, Lock, User, FileText
} from 'lucide-react';
import '../styles/AdminStyles.css';

const StoreForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  
  // File upload state
  const [files, setFiles] = useState({
    logo: null,
    banner_image: null,
    qr_code: null
  });
  const [filePreviews, setFilePreviews] = useState({
    logo: null,
    banner_image: null,
    qr_code: null
  });
  
  // Form data state matching store structure
  const [formData, setFormData] = useState({
    // Required fields
    name: '',
    category_id: '',
    email: '',
    phone_number: '',
    address: '',
    
    // Optional fields
    description: '',
    sub_category: '',
    latitude: '',
    longitude: '',
    normal_discount_percentage: '',
    vip_discount_percentage: '',
    commission_percent: '',
    minimum_order_amount: '',
    upi_id: '',
    google_business_url: '',
    contract_start_date: '',
    contract_expiry_date: '',
    owner_password: '',
    closed_by: '',
    is_premium: 0,
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

  // Fetch categories for dropdown
  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      
      const endpoints = [
        `${API_BASE_URL}/stores/categories/list`,
        `/api/stores/categories/list`,
        `/api/categories`
      ];

      let categoryData = null;

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: getHeaders(),
            credentials: 'include'
          });

          if (response.ok) {
            const data = await response.json();
            categoryData = data;
            break;
          }
        } catch (err) {
          continue;
        }
      }

      if (categoryData && categoryData.success) {
        setCategories(categoryData.data || []);
      } else {
        // Fallback categories
        setCategories([
          { id: 1, name: 'Grocery' },
          { id: 2, name: 'Restaurant' },
          { id: 3, name: 'Electronics' },
          { id: 4, name: 'Fashion' },
          { id: 5, name: 'Health' }
        ]);
      }
    } catch (error) {
      console.warn('⚠️ Categories API failed, using static data:', error.message);
      setCategories([
        { id: 1, name: 'Grocery' },
        { id: 2, name: 'Restaurant' },
        { id: 3, name: 'Electronics' },
        { id: 4, name: 'Fashion' },
        { id: 5, name: 'Health' }
      ]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Handle file input changes
  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: 'Please select a valid image file (JPEG, PNG, GIF, WebP)'
      }));
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: 'File size must be less than 5MB'
      }));
      return;
    }

    // Clear error and set file
    setErrors(prev => ({
      ...prev,
      [fieldName]: ''
    }));

    setFiles(prev => ({
      ...prev,
      [fieldName]: file
    }));

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setFilePreviews(prev => ({
        ...prev,
        [fieldName]: e.target.result
      }));
    };
    reader.readAsDataURL(file);
  };

  // Remove uploaded file
  const removeFile = (fieldName) => {
    setFiles(prev => ({
      ...prev,
      [fieldName]: null
    }));
    setFilePreviews(prev => ({
      ...prev,
      [fieldName]: null
    }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.name.trim()) {
      newErrors.name = 'Store name is required';
    }

    if (!formData.category_id) {
      newErrors.category_id = 'Category is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.phone_number.trim()) {
      newErrors.phone_number = 'Phone number is required';
    } else if (!/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone_number.replace(/[-\s]/g, ''))) {
      newErrors.phone_number = 'Phone number is invalid';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    // Numeric validations
    if (formData.latitude && (isNaN(formData.latitude) || formData.latitude < -90 || formData.latitude > 90)) {
      newErrors.latitude = 'Latitude must be between -90 and 90';
    }

    if (formData.longitude && (isNaN(formData.longitude) || formData.longitude < -180 || formData.longitude > 180)) {
      newErrors.longitude = 'Longitude must be between -180 and 180';
    }

    if (formData.normal_discount_percentage && (isNaN(formData.normal_discount_percentage) || formData.normal_discount_percentage < 0 || formData.normal_discount_percentage > 100)) {
      newErrors.normal_discount_percentage = 'Discount must be between 0 and 100';
    }

    if (formData.vip_discount_percentage && (isNaN(formData.vip_discount_percentage) || formData.vip_discount_percentage < 0 || formData.vip_discount_percentage > 100)) {
      newErrors.vip_discount_percentage = 'VIP discount must be between 0 and 100';
    }

    if (formData.commission_percent && (isNaN(formData.commission_percent) || formData.commission_percent < 0 || formData.commission_percent > 100)) {
      newErrors.commission_percent = 'Commission must be between 0 and 100';
    }

    if (formData.minimum_order_amount && (isNaN(formData.minimum_order_amount) || formData.minimum_order_amount < 0)) {
      newErrors.minimum_order_amount = 'Minimum order amount must be a positive number';
    }

    // Date validations
    if (formData.contract_start_date && formData.contract_expiry_date) {
      const startDate = new Date(formData.contract_start_date);
      const endDate = new Date(formData.contract_expiry_date);
      if (endDate <= startDate) {
        newErrors.contract_expiry_date = 'Contract expiry date must be after start date';
      }
    }

    // URL validation
    if (formData.google_business_url && formData.google_business_url.trim() && !/^https?:\/\/.+/.test(formData.google_business_url)) {
      newErrors.google_business_url = 'Please enter a valid URL starting with http:// or https://';
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
      // Create FormData for file uploads
      const formDataToSend = new FormData();
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (formData[key] !== '') {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Add files if they exist
      Object.keys(files).forEach(key => {
        if (files[key]) {
          formDataToSend.append(key, files[key]);
        }
      });

      console.log('🔄 Creating new store with data and files');

      const response = await fetch(`${API_BASE_URL}/stores`, {
        method: 'POST',
        headers: {
          // Don't set Content-Type for FormData - browser will set it with boundary
          'Accept': 'application/json',
          ...(() => {
            const token = getAuthToken();
            return token ? { 'Authorization': `Bearer ${token}` } : {};
          })()
        },
        body: formDataToSend
      });

      console.log(`📡 Create response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Create result:', result);
      
      if (result.success) {
        alert('Store created successfully!');
        navigate('/stores');
      } else {
        throw new Error(result.message || 'Store creation failed');
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

      {/* Store Form */}
      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">Store Information</h3>
        </div>
        
        <form onSubmit={handleSubmit} style={{padding: 'var(--spacing-lg)'}}>
          {/* Basic Information */}
          <div style={{marginBottom: 'var(--spacing-xl)'}}>
            <h4 style={{fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
              <Store size={18} />
              Basic Information
            </h4>
            
            {/* Store Name | Category */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)'}}>
              <div className="form-group">
                <label className="form-label">Store Name *</label>
                <input
                  type="text"
                  name="name"
                  className="form-input"
                  placeholder="Enter store name"
                  value={formData.name}
                  onChange={handleInputChange}
                  style={{borderColor: errors.name ? 'var(--error-border)' : undefined}}
                />
                {errors.name && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.name}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Tag size={16} style={{marginRight: 'var(--spacing-sm)'}} />
                  Category *
                </label>
                <select
                  name="category_id"
                  className="form-input"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  style={{borderColor: errors.category_id ? 'var(--error-border)' : undefined}}
                  disabled={categoriesLoading}
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.category_id && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.category_id}
                  </span>
                )}
              </div>
            </div>

            {/* Sub Category */}
            <div className="form-group" style={{marginBottom: 'var(--spacing-lg)'}}>
              <label className="form-label">
                <FileText size={16} style={{marginRight: 'var(--spacing-sm)'}} />
                Sub Category
              </label>
              <input
                type="text"
                name="sub_category"
                className="form-input"
                placeholder="Enter sub category"
                value={formData.sub_category}
                onChange={handleInputChange}
              />
            </div>

            {/* Description */}
            <div className="form-group" style={{marginBottom: 'var(--spacing-lg)'}}>
              <label className="form-label">Description</label>
              <textarea
                name="description"
                className="form-input"
                placeholder="Enter store description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                style={{resize: 'vertical'}}
              />
            </div>

            {/* Email | Phone Number */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)'}}>
              <div className="form-group">
                <label className="form-label">
                  <Mail size={16} style={{marginRight: 'var(--spacing-sm)'}} />
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={handleInputChange}
                  style={{borderColor: errors.email ? 'var(--error-border)' : undefined}}
                />
                {errors.email && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.email}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Phone size={16} style={{marginRight: 'var(--spacing-sm)'}} />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone_number"
                  className="form-input"
                  placeholder="Enter phone number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  style={{borderColor: errors.phone_number ? 'var(--error-border)' : undefined}}
                />
                {errors.phone_number && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.phone_number}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Location Details */}
          <div style={{marginBottom: 'var(--spacing-xl)'}}>
            <h4 style={{fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
              <MapPin size={18} />
              Location Details
            </h4>
            
            {/* Address */}
            <div className="form-group" style={{marginBottom: 'var(--spacing-lg)'}}>
              <label className="form-label">Address *</label>
              <textarea
                name="address"
                className="form-input"
                placeholder="Enter complete address"
                value={formData.address}
                onChange={handleInputChange}
                rows="2"
                style={{resize: 'vertical', borderColor: errors.address ? 'var(--error-border)' : undefined}}
              />
              {errors.address && (
                <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                  {errors.address}
                </span>
              )}
            </div>

            {/* Latitude | Longitude */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)'}}>
              <div className="form-group">
                <label className="form-label">Latitude</label>
                <input
                  type="number"
                  name="latitude"
                  className="form-input"
                  placeholder="e.g., 19.0760"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  step="any"
                  style={{borderColor: errors.latitude ? 'var(--error-border)' : undefined}}
                />
                {errors.latitude && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.latitude}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Longitude</label>
                <input
                  type="number"
                  name="longitude"
                  className="form-input"
                  placeholder="e.g., 72.8777"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  step="any"
                  style={{borderColor: errors.longitude ? 'var(--error-border)' : undefined}}
                />
                {errors.longitude && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.longitude}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Contract Details */}
          <div style={{marginBottom: 'var(--spacing-xl)'}}>
            <h4 style={{fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
              <Calendar size={18} />
              Contract Details
            </h4>
            
            {/* Contract Start Date | Contract Expiry Date */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)'}}>
              <div className="form-group">
                <label className="form-label">
                  <Calendar size={16} style={{marginRight: 'var(--spacing-sm)'}} />
                  Contract Start Date
                </label>
                <input
                  type="date"
                  name="contract_start_date"
                  className="form-input"
                  value={formData.contract_start_date}
                  onChange={handleInputChange}
                  style={{borderColor: errors.contract_start_date ? 'var(--error-border)' : undefined}}
                />
                {errors.contract_start_date && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.contract_start_date}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Calendar size={16} style={{marginRight: 'var(--spacing-sm)'}} />
                  Contract Expiry Date
                </label>
                <input
                  type="date"
                  name="contract_expiry_date"
                  className="form-input"
                  value={formData.contract_expiry_date}
                  onChange={handleInputChange}
                  style={{borderColor: errors.contract_expiry_date ? 'var(--error-border)' : undefined}}
                />
                {errors.contract_expiry_date && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.contract_expiry_date}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Business Details */}
          <div style={{marginBottom: 'var(--spacing-xl)'}}>
            <h4 style={{fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
              <DollarSign size={18} />
              Business Details
            </h4>
            
            {/* Normal Discount | VIP Discount | Commission */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)'}}>
              <div className="form-group">
                <label className="form-label">
                  <Percent size={16} style={{marginRight: 'var(--spacing-sm)'}} />
                  Normal Discount (%)
                </label>
                <input
                  type="number"
                  name="normal_discount_percentage"
                  className="form-input"
                  placeholder="e.g., 10"
                  value={formData.normal_discount_percentage}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  step="0.01"
                  style={{borderColor: errors.normal_discount_percentage ? 'var(--error-border)' : undefined}}
                />
                {errors.normal_discount_percentage && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.normal_discount_percentage}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Award size={16} style={{marginRight: 'var(--spacing-sm)'}} />
                  VIP Discount (%)
                </label>
                <input
                  type="number"
                  name="vip_discount_percentage"
                  className="form-input"
                  placeholder="e.g., 15"
                  value={formData.vip_discount_percentage}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  step="0.01"
                  style={{borderColor: errors.vip_discount_percentage ? 'var(--error-border)' : undefined}}
                />
                {errors.vip_discount_percentage && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.vip_discount_percentage}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <DollarSign size={16} style={{marginRight: 'var(--spacing-sm)'}} />
                  Commission (%)
                </label>
                <input
                  type="number"
                  name="commission_percent"
                  className="form-input"
                  placeholder="e.g., 5"
                  value={formData.commission_percent}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  step="0.01"
                  style={{borderColor: errors.commission_percent ? 'var(--error-border)' : undefined}}
                />
                {errors.commission_percent && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.commission_percent}
                  </span>
                )}
              </div>
            </div>

            {/* Minimum Order Amount | UPI ID */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)'}}>
              <div className="form-group">
                <label className="form-label">Minimum Order Amount (₹)</label>
                <input
                  type="number"
                  name="minimum_order_amount"
                  className="form-input"
                  placeholder="e.g., 100"
                  value={formData.minimum_order_amount}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  style={{borderColor: errors.minimum_order_amount ? 'var(--error-border)' : undefined}}
                />
                {errors.minimum_order_amount && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.minimum_order_amount}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">UPI ID</label>
                <input
                  type="text"
                  name="upi_id"
                  className="form-input"
                  placeholder="e.g., store@paytm"
                  value={formData.upi_id}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Google Business URL */}
            <div className="form-group">
              <label className="form-label">
                <Globe size={16} style={{marginRight: 'var(--spacing-sm)'}} />
                Google Business URL
              </label>
              <input
                type="url"
                name="google_business_url"
                className="form-input"
                placeholder="https://goo.gl/maps/..."
                value={formData.google_business_url}
                onChange={handleInputChange}
                style={{borderColor: errors.google_business_url ? 'var(--error-border)' : undefined}}
              />
              {errors.google_business_url && (
                <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                  {errors.google_business_url}
                </span>
              )}
            </div>
          </div>

          {/* Security Details */}
          <div style={{marginBottom: 'var(--spacing-xl)'}}>
            <h4 style={{fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
              <Lock size={18} />
              Security & Management
            </h4>
            
            {/* Owner Password | Closed By */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)'}}>
              <div className="form-group">
                <label className="form-label">
                  <Lock size={16} style={{marginRight: 'var(--spacing-sm)'}} />
                  Owner Password
                </label>
                <input
                  type="password"
                  name="owner_password"
                  className="form-input"
                  placeholder="Enter owner password"
                  value={formData.owner_password}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <User size={16} style={{marginRight: 'var(--spacing-sm)'}} />
                  Closed By
                </label>
                <input
                  type="text"
                  name="closed_by"
                  className="form-input"
                  placeholder="Enter closed by user"
                  value={formData.closed_by}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          {/* Image Uploads */}
          <div style={{marginBottom: 'var(--spacing-xl)'}}>
            <h4 style={{fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
              <Image size={18} />
              Store Images
            </h4>
            
            {/* Logo Upload */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--spacing-lg)'}}>
              {/* Logo */}
              <div className="form-group">
                <label className="form-label">Store Logo</label>
                <div style={{
                  border: '2px dashed var(--border-glass)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--spacing-lg)',
                  textAlign: 'center',
                  background: 'var(--bg-glass-light)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  borderColor: errors.logo ? 'var(--error-border)' : undefined
                }}
                onClick={() => document.getElementById('logo-upload').click()}
                >
                  <input
                    type="file"
                    id="logo-upload"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'logo')}
                    style={{display: 'none'}}
                  />
                  {filePreviews.logo ? (
                    <div>
                      <img 
                        src={filePreviews.logo} 
                        alt="Logo preview" 
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100px',
                          borderRadius: 'var(--radius-md)',
                          marginBottom: 'var(--spacing-sm)'
                        }}
                      />
                      <div style={{display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'center'}}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{fontSize: '0.75rem', padding: '0.25rem 0.5rem'}}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile('logo');
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Upload size={24} style={{color: 'var(--text-disabled)', marginBottom: 'var(--spacing-sm)'}} />
                      <p style={{color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0}}>
                        Click to upload logo
                      </p>
                      <p style={{color: 'var(--text-disabled)', fontSize: '0.75rem', margin: '0.25rem 0 0 0'}}>
                        PNG, JPG up to 5MB
                      </p>
                    </div>
                  )}
                </div>
                {errors.logo && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.logo}
                  </span>
                )}
              </div>

              {/* Banner Image */}
              <div className="form-group">
                <label className="form-label">Banner Image</label>
                <div style={{
                  border: '2px dashed var(--border-glass)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--spacing-lg)',
                  textAlign: 'center',
                  background: 'var(--bg-glass-light)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  borderColor: errors.banner_image ? 'var(--error-border)' : undefined
                }}
                onClick={() => document.getElementById('banner-upload').click()}
                >
                  <input
                    type="file"
                    id="banner-upload"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'banner_image')}
                    style={{display: 'none'}}
                  />
                  {filePreviews.banner_image ? (
                    <div>
                      <img 
                        src={filePreviews.banner_image} 
                        alt="Banner preview" 
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100px',
                          borderRadius: 'var(--radius-md)',
                          marginBottom: 'var(--spacing-sm)'
                        }}
                      />
                      <div style={{display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'center'}}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{fontSize: '0.75rem', padding: '0.25rem 0.5rem'}}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile('banner_image');
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Upload size={24} style={{color: 'var(--text-disabled)', marginBottom: 'var(--spacing-sm)'}} />
                      <p style={{color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0}}>
                        Click to upload banner
                      </p>
                      <p style={{color: 'var(--text-disabled)', fontSize: '0.75rem', margin: '0.25rem 0 0 0'}}>
                        PNG, JPG up to 5MB
                      </p>
                    </div>
                  )}
                </div>
                {errors.banner_image && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.banner_image}
                  </span>
                )}
              </div>

              {/* QR Code */}
              <div className="form-group">
                <label className="form-label">QR Code</label>
                <div style={{
                  border: '2px dashed var(--border-glass)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--spacing-lg)',
                  textAlign: 'center',
                  background: 'var(--bg-glass-light)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  borderColor: errors.qr_code ? 'var(--error-border)' : undefined
                }}
                onClick={() => document.getElementById('qr-upload').click()}
                >
                  <input
                    type="file"
                    id="qr-upload"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'qr_code')}
                    style={{display: 'none'}}
                  />
                  {filePreviews.qr_code ? (
                    <div>
                      <img 
                        src={filePreviews.qr_code} 
                        alt="QR Code preview" 
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100px',
                          borderRadius: 'var(--radius-md)',
                          marginBottom: 'var(--spacing-sm)'
                        }}
                      />
                      <div style={{display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'center'}}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{fontSize: '0.75rem', padding: '0.25rem 0.5rem'}}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile('qr_code');
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Upload size={24} style={{color: 'var(--text-disabled)', marginBottom: 'var(--spacing-sm)'}} />
                      <p style={{color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0}}>
                        Click to upload QR code
                      </p>
                      <p style={{color: 'var(--text-disabled)', fontSize: '0.75rem', margin: '0.25rem 0 0 0'}}>
                        PNG, JPG up to 5MB
                      </p>
                    </div>
                  )}
                </div>
                {errors.qr_code && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.qr_code}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Store Settings */}
          <div style={{padding: 'var(--spacing-lg)', background: 'var(--bg-glass-light)', borderRadius: 'var(--radius-lg)'}}>
            <h4 style={{fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
              <Shield size={18} />
              Store Settings
            </h4>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-lg)'}}>
              {/* Premium Status */}
              <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                <input
                  type="checkbox"
                  id="is_premium"
                  name="is_premium"
                  className="checkbox-input"
                  checked={formData.is_premium === 1}
                  onChange={handleInputChange}
                />
                <label htmlFor="is_premium" style={{color: 'var(--text-secondary)', cursor: 'pointer'}}>
                  Premium Store
                </label>
              </div>

              {/* Active Status */}
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
                  Store Active
                </label>
              </div>
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
        <Link to="/stores" className="btn btn-secondary">
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
              Create Store
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default StoreForm;