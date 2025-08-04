// pages/RewardForm.js - Create New Reward Page
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Save, X, Gift, Tag, Award, Star,
  Target, AlertCircle
} from 'lucide-react';
import '../styles/AdminStyles.css';

const RewardForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Form data state
  const [formData, setFormData] = useState({
    reward_name: '',
    reward_type: 'signup',
    normal_users_reward_value: '',
    vip_users_reward_value: '',
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

  // Reward type options - simplified labels
  const rewardTypeOptions = [
    { value: 'Amount', label: 'Amount' },
    { value: 'Percent', label: 'Percent' },
  ];

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

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.reward_name.trim()) {
      newErrors.reward_name = 'Reward name is required';
    } else if (formData.reward_name.length > 100) {
      newErrors.reward_name = 'Reward name must be 100 characters or less';
    }

    if (!formData.reward_type) {
      newErrors.reward_type = 'Reward type is required';
    }

    // Normal user reward value validation
    if (!formData.normal_users_reward_value || formData.normal_users_reward_value <= 0) {
      newErrors.normal_users_reward_value = 'Normal users reward value is required and must be greater than 0';
    }

    // VIP user reward value validation (optional but must be positive if provided)
    if (formData.vip_users_reward_value && formData.vip_users_reward_value <= 0) {
      newErrors.vip_users_reward_value = 'VIP users reward value must be greater than 0 if provided';
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
        reward_name: formData.reward_name.trim(),
        reward_type: formData.reward_type,
        normal_users_reward_value: parseFloat(formData.normal_users_reward_value),
        vip_users_reward_value: formData.vip_users_reward_value ? parseFloat(formData.vip_users_reward_value) : null,
        is_active: formData.is_active
      };

      console.log('🔄 Creating new reward with data:', createData);

      const response = await fetch(`${API_BASE_URL}/rewards`, {
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
        alert('Reward created successfully!');
        navigate('/rewards');
      } else {
        throw new Error(result.message || 'Reward creation failed');
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
          <h3 className="chart-title">Create New Reward</h3>
        </div>
        
        <form onSubmit={handleSubmit} style={{padding: 'var(--spacing-lg)'}}>
          {/* Basic Information */}
          <div style={{marginBottom: 'var(--spacing-xl)'}}>
            <h4 style={{fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
              <Gift size={18} />
              Basic Information
            </h4>
            
            {/* Reward Name */}
            <div className="form-group" style={{marginBottom: 'var(--spacing-lg)'}}>
              <label className="form-label">Reward Name *</label>
              <input
                type="text"
                name="reward_name"
                className="form-input"
                placeholder="e.g., Sign Up Bonus, Profile Completion Reward"
                value={formData.reward_name}
                onChange={handleInputChange}
                maxLength="100"
                style={{borderColor: errors.reward_name ? 'var(--error-border)' : undefined}}
              />
              {errors.reward_name && (
                <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                  {errors.reward_name}
                </span>
              )}
            </div>

            {/* Reward Type */}
            <div className="form-group">
              <label className="form-label">Reward Type *</label>
              <select
                name="reward_type"
                className="form-input"
                value={formData.reward_type}
                onChange={handleInputChange}
                style={{
                  borderColor: errors.reward_type ? 'var(--error-border)' : undefined,
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)'
                }}
              >
                {rewardTypeOptions.map(option => (
                  <option 
                    key={option.value} 
                    value={option.value}
                    style={{
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.reward_type && (
                <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                  {errors.reward_type}
                </span>
              )}
            </div>
          </div>

          {/* Reward Values */}
          <div style={{marginBottom: 'var(--spacing-xl)'}}>
            <h4 style={{fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
              <Award size={18} />
              Reward Values
            </h4>
            
            {/* Normal Users | VIP Users */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)'}}>
              <div className="form-group">
                <label className="form-label">
                  <Target size={16} style={{marginRight: 'var(--spacing-sm)'}} />
                  Normal Users Reward Value (₹) *
                </label>
                <input
                  type="number"
                  name="normal_users_reward_value"
                  className="form-input"
                  placeholder="e.g., 100"
                  value={formData.normal_users_reward_value}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  style={{borderColor: errors.normal_users_reward_value ? 'var(--error-border)' : undefined}}
                />
                {errors.normal_users_reward_value && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.normal_users_reward_value}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Star size={16} style={{marginRight: 'var(--spacing-sm)'}} />
                  VIP Users Reward Value (₹)
                </label>
                <input
                  type="number"
                  name="vip_users_reward_value"
                  className="form-input"
                  placeholder="e.g., 200"
                  value={formData.vip_users_reward_value}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  style={{borderColor: errors.vip_users_reward_value ? 'var(--error-border)' : undefined}}
                />
                <small style={{color: 'var(--text-muted)', fontSize: '0.75rem'}}>
                  Leave empty if same as normal users
                </small>
                {errors.vip_users_reward_value && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.vip_users_reward_value}
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
                Reward Active
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
        <Link to="/rewards" className="btn btn-secondary">
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
              Create Reward
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default RewardForm;