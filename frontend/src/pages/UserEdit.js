// pages/UserEdit.js - Optimized Layout matching UserForm + VIP Fields
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Save, X, User, Mail, Phone, Calendar,
  Shield, Home, AlertCircle, Crown
} from 'lucide-react';
import ErrorState from '../components/common/ErrorState';
import '../styles/AdminStyles.css';

const UserEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  // Form data state with actual profile fields + VIP fields
  const [formData, setFormData] = useState({
    // User table fields
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    is_active: 1,
    is_email_verified: 0,
    is_phone_verified: 0,
    
    // VIP fields
    is_vip: 0,
    vip_start_date: '',
    vip_end_date: '',
    
    // Profile table fields
    gender: '',
    date_of_birth: '',
    anniversary_date: '',
    spouse_birth_date: '',
    address_building: '',
    address_street: '',
    address_city: '',
    address_state: '',
    address_pincode: ''
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

  // Fetch user data for editing
  const fetchUserData = async () => {
    try {
      setError(null);
      console.log(`🔄 Fetching user data for editing, ID: ${id}`);
      
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'GET',
        headers: getHeaders(),
        credentials: 'include'
      });

      console.log(`📡 User edit response status: ${response.status}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`User with ID ${id} not found`);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ User Edit API Response:', data);

      if (!data.success || !data.data || !data.data.user) {
        throw new Error('Invalid API response format');
      }

      const userData = data.data.user;
      
      if (!userData.id || userData.id != id) {
        throw new Error(`User ID mismatch: expected ${id}, got ${userData.id}`);
      }
      
      // Set form data with all fields including VIP
      setFormData({
        // User table fields
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        email: userData.email || '',
        phone_number: userData.phone_number || '',
        is_active: userData.is_active || 1,
        is_email_verified: userData.is_email_verified || 0,
        is_phone_verified: userData.is_phone_verified || 0,
        
        // VIP fields
        is_vip: userData.is_vip || 0,
        vip_start_date: userData.vip_start_date ? userData.vip_start_date.split('T')[0] : '',
        vip_end_date: userData.vip_end_date ? userData.vip_end_date.split('T')[0] : '',
        
        // Profile table fields
        gender: userData.gender || '',
        date_of_birth: userData.date_of_birth ? userData.date_of_birth.split('T')[0] : '',
        anniversary_date: userData.anniversary_date ? userData.anniversary_date.split('T')[0] : '',
        spouse_birth_date: userData.spouse_birth_date ? userData.spouse_birth_date.split('T')[0] : '',
        address_building: userData.address_building || '',
        address_street: userData.address_street || '',
        address_city: userData.address_city || '',
        address_state: userData.address_state || '',
        address_pincode: userData.address_pincode || ''
      });
      
      console.log('✅ User edit data loaded successfully for user:', userData.id);

    } catch (error) {
      console.error(`❌ Failed to fetch user ${id} for editing:`, error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [id]);

  // Handle form input changes
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
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (formData.phone_number && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone_number.replace(/[-\s]/g, ''))) {
      newErrors.phone_number = 'Phone number is invalid';
    }

    // Date validations
    if (formData.date_of_birth && new Date(formData.date_of_birth) > new Date()) {
      newErrors.date_of_birth = 'Date of birth cannot be in the future';
    }

    if (formData.anniversary_date && new Date(formData.anniversary_date) > new Date()) {
      newErrors.anniversary_date = 'Anniversary date cannot be in the future';
    }

    if (formData.spouse_birth_date && new Date(formData.spouse_birth_date) > new Date()) {
      newErrors.spouse_birth_date = 'Spouse birth date cannot be in the future';
    }

    // VIP date validation
    if (formData.is_vip === 1) {
      if (!formData.vip_start_date) {
        newErrors.vip_start_date = 'VIP start date is required for VIP users';
      }
      if (!formData.vip_end_date) {
        newErrors.vip_end_date = 'VIP end date is required for VIP users';
      }
      if (formData.vip_start_date && formData.vip_end_date && 
          new Date(formData.vip_start_date) >= new Date(formData.vip_end_date)) {
        newErrors.vip_end_date = 'VIP end date must be after start date';
      }
    }

    // PIN code validation
    if (formData.address_pincode && !/^\d{6}$/.test(formData.address_pincode)) {
      newErrors.address_pincode = 'PIN code must be 6 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSaving(true);
    setError(null);

    try {
      const updateData = { ...formData };

      console.log(`🔄 Updating user ${id} with data:`, updateData);

      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updateData)
      });

      console.log(`📡 Update response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Update result:', result);
      
      if (result.success) {
        alert('User updated successfully!');
        navigate(`/users/${id}`);
      } else {
        throw new Error(result.message || 'Update failed');
      }

    } catch (error) {
      console.error('❌ Update failed:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading User #{id}...</p>
        </div>
      </div>
    );
  }

  // Show error state if API failed and no form data loaded
  if (error && (!formData.first_name && !formData.email)) {
    return (
      <div className="page-container">
        <div className="chart-card">
          <ErrorState
            title="Cannot Edit User"
            message={error}
            onRetry={fetchUserData}
            backTo="/users"
            backText="Back to Users List"
            debugInfo={{
              "User ID": id,
              "API Base URL": API_BASE_URL,
              "Expected Endpoint": `${API_BASE_URL}/users/${id}`,
              "Error": error
            }}
          />
        </div>
      </div>
    );
  }

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

      {/* FIXED: Optimized Edit Form Layout */}
      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">Edit User #{id}</h3>
        </div>
        
        <form onSubmit={handleSubmit} style={{padding: 'var(--spacing-lg)'}}>
          {/* FIXED: Basic Information - Side by Side Layout */}
          <div style={{marginBottom: 'var(--spacing-xl)'}}>
            <h4 style={{fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
              <User size={18} />
              Basic Information
            </h4>
            
            {/* First Name | Last Name */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)'}}>
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input
                  type="text"
                  name="first_name"
                  className="form-input"
                  placeholder="Enter first name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  style={{borderColor: errors.first_name ? 'var(--error-border)' : undefined}}
                />
                {errors.first_name && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.first_name}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Last Name *</label>
                <input
                  type="text"
                  name="last_name"
                  className="form-input"
                  placeholder="Enter last name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  style={{borderColor: errors.last_name ? 'var(--error-border)' : undefined}}
                />
                {errors.last_name && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.last_name}
                  </span>
                )}
              </div>
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
                  Phone Number
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

          {/* NEW: VIP Settings Section */}
          <div style={{marginBottom: 'var(--spacing-xl)'}}>
            <h4 style={{fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
              <Crown size={18} />
              VIP Settings
            </h4>
            
            {/* VIP Status Checkbox */}
            <div style={{marginBottom: 'var(--spacing-lg)'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                <input
                  type="checkbox"
                  id="is_vip"
                  name="is_vip"
                  className="checkbox-input"
                  checked={formData.is_vip === 1}
                  onChange={handleInputChange}
                />
                <label htmlFor="is_vip" style={{color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: '500'}}>
                  Enable VIP Status
                </label>
              </div>
            </div>

            {/* VIP Dates - Only show if VIP is enabled */}
            {formData.is_vip === 1 && (
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)'}}>
                <div className="form-group">
                  <label className="form-label">VIP Start Date *</label>
                  <input
                    type="date"
                    name="vip_start_date"
                    className="form-input"
                    value={formData.vip_start_date}
                    onChange={handleInputChange}
                    style={{borderColor: errors.vip_start_date ? 'var(--error-border)' : undefined}}
                  />
                  {errors.vip_start_date && (
                    <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                      {errors.vip_start_date}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">VIP End Date *</label>
                  <input
                    type="date"
                    name="vip_end_date"
                    className="form-input"
                    value={formData.vip_end_date}
                    onChange={handleInputChange}
                    min={formData.vip_start_date || undefined}
                    style={{borderColor: errors.vip_end_date ? 'var(--error-border)' : undefined}}
                  />
                  {errors.vip_end_date && (
                    <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                      {errors.vip_end_date}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* FIXED: Profile Details - Side by Side Layout */}
          <div style={{marginBottom: 'var(--spacing-xl)'}}>
            <h4 style={{fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
              <Calendar size={18} />
              Profile Details
            </h4>
            
            {/* Gender | Date of Birth */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)'}}>
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select
                  name="gender"
                  className="form-input"
                  value={formData.gender}
                  onChange={handleInputChange}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="others">Others</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input
                  type="date"
                  name="date_of_birth"
                  className="form-input"
                  value={formData.date_of_birth}
                  onChange={handleInputChange}
                  max={new Date().toISOString().split('T')[0]}
                  style={{borderColor: errors.date_of_birth ? 'var(--error-border)' : undefined}}
                />
                {errors.date_of_birth && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.date_of_birth}
                  </span>
                )}
              </div>
            </div>

            {/* Anniversary Date | Spouse Birth Date */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)'}}>
              <div className="form-group">
                <label className="form-label">Anniversary Date</label>
                <input
                  type="date"
                  name="anniversary_date"
                  className="form-input"
                  value={formData.anniversary_date}
                  onChange={handleInputChange}
                  max={new Date().toISOString().split('T')[0]}
                  style={{borderColor: errors.anniversary_date ? 'var(--error-border)' : undefined}}
                />
                {errors.anniversary_date && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.anniversary_date}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Spouse Birth Date</label>
                <input
                  type="date"
                  name="spouse_birth_date"
                  className="form-input"
                  value={formData.spouse_birth_date}
                  onChange={handleInputChange}
                  max={new Date().toISOString().split('T')[0]}
                  style={{borderColor: errors.spouse_birth_date ? 'var(--error-border)' : undefined}}
                />
                {errors.spouse_birth_date && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.spouse_birth_date}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* FIXED: Address - Optimized Layout */}
          <div style={{marginBottom: 'var(--spacing-xl)'}}>
            <h4 style={{fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
              <Home size={18} />
              Address
            </h4>
            
            {/* Building/House Number | Street Address */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)'}}>
              <div className="form-group">
                <label className="form-label">Building/House Number</label>
                <input
                  type="text"
                  name="address_building"
                  className="form-input"
                  placeholder="Enter building or house number"
                  value={formData.address_building}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Street Address</label>
                <input
                  type="text"
                  name="address_street"
                  className="form-input"
                  placeholder="Enter street address"
                  value={formData.address_street}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* City | State | PIN Code */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--spacing-lg)'}}>
              <div className="form-group">
                <label className="form-label">City</label>
                <input
                  type="text"
                  name="address_city"
                  className="form-input"
                  placeholder="Enter city"
                  value={formData.address_city}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">State</label>
                <input
                  type="text"
                  name="address_state"
                  className="form-input"
                  placeholder="Enter state"
                  value={formData.address_state}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">PIN Code</label>
                <input
                  type="text"
                  name="address_pincode"
                  className="form-input"
                  placeholder="6-digit PIN"
                  value={formData.address_pincode}
                  onChange={handleInputChange}
                  maxLength="6"
                  style={{borderColor: errors.address_pincode ? 'var(--error-border)' : undefined}}
                />
                {errors.address_pincode && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.address_pincode}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Account Settings Section */}
          <div style={{padding: 'var(--spacing-lg)', background: 'var(--bg-glass-light)', borderRadius: 'var(--radius-lg)'}}>
            <h4 style={{fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
              <Shield size={18} />
              Account Settings
            </h4>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-lg)'}}>
              {/* Account Status */}
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
                  Account Active
                </label>
              </div>

              {/* Email Verification */}
              <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                <input
                  type="checkbox"
                  id="is_email_verified"
                  name="is_email_verified"
                  className="checkbox-input"
                  checked={formData.is_email_verified === 1}
                  onChange={handleInputChange}
                />
                <label htmlFor="is_email_verified" style={{color: 'var(--text-secondary)', cursor: 'pointer'}}>
                  Email Verified
                </label>
              </div>

              {/* Phone Verification */}
              <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                <input
                  type="checkbox"
                  id="is_phone_verified"
                  name="is_phone_verified"
                  className="checkbox-input"
                  checked={formData.is_phone_verified === 1}
                  onChange={handleInputChange}
                />
                <label htmlFor="is_phone_verified" style={{color: 'var(--text-secondary)', cursor: 'pointer'}}>
                  Phone Verified
                </label>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* FIXED: Floating Action Buttons */}
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
        <Link to={`/users/${id}`} className="btn btn-secondary">
          <X size={16} />
          Cancel
        </Link>
        <button 
          type="button"
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving ? (
            <>
              <div className="spinner-ring" style={{
                width: '16px', 
                height: '16px', 
                border: '2px solid rgba(255,255,255,0.3)', 
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              Saving...
            </>
          ) : (
            <>
              <Save size={16} />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default UserEdit;