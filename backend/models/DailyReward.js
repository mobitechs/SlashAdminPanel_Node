// pages/DailyRewardsForm.js - UPDATED with proper campaign type handling
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  Save, X, Gift, Calendar, Clock, Target, 
  AlertCircle, Settings, Activity, ArrowLeft
} from 'lucide-react';
import '../styles/AdminStyles.css';

const DailyRewardsForm = ({ isEdit = false }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form data state - FIXED: Use values that match your database
  const [formData, setFormData] = useState({
    campaign_type: 'spin_wheel', // Default to spin_wheel since that's what your DB has
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    repeat_interval: 'daily',
    custom_interval_days: '',
    max_attempts_per_interval: 1,
    is_active: 1
  });

  // Validation errors
  const [errors, setErrors] = useState({});

  // API Configuration
  const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';
  
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  });

  // FIXED: Campaign types that match your database
  const campaignTypes = [
    { value: 'spin_wheel', label: 'Spin Wheel Campaign' },
    { value: 'daily', label: 'Daily Campaign' },
    { value: 'weekly', label: 'Weekly Campaign' },
    { value: 'monthly', label: 'Monthly Campaign' },
    { value: 'custom', label: 'Custom Campaign' }
  ];

  // Fetch campaign data for editing
  const fetchCampaign = async () => {
    if (!isEdit || !id) return;

    try {
      setLoading(true);
      setError(null);

      const endpoints = [
        `${API_BASE_URL}/daily-rewards/campaigns/${id}`,
        `/api/daily-rewards/campaigns/${id}`
      ];

      let campaignData = null;

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: getHeaders(),
            credentials: 'include'
          });

          if (response.ok) {
            const data = await response.json();
            campaignData = data;
            break;
          }
        } catch (err) {
          continue;
        }
      }

      if (!campaignData || !campaignData.success) {
        throw new Error('Campaign not found');
      }

      const campaign = campaignData.data.campaign;
      
      setFormData({
        campaign_type: campaign.campaign_type || 'spin_wheel',
        title: campaign.title || '',
        description: campaign.description || '',
        start_date: campaign.start_date ? campaign.start_date.split('T')[0] : '',
        end_date: campaign.end_date ? campaign.end_date.split('T')[0] : '',
        repeat_interval: campaign.repeat_interval || 'daily',
        custom_interval_days: campaign.custom_interval_days || '',
        max_attempts_per_interval: campaign.max_attempts_per_interval || 1,
        is_active: campaign.is_active !== undefined ? campaign.is_active : 1
      });

      console.log('✅ Campaign data loaded for editing');

    } catch (error) {
      console.error('❌ Failed to fetch campaign:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Load campaign data on mount for editing
  useEffect(() => {
    if (isEdit) {
      fetchCampaign();
    }
  }, [isEdit, id]);

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
    if (!formData.title.trim()) {
      newErrors.title = 'Campaign title is required';
    }

    if (!formData.campaign_type) {
      newErrors.campaign_type = 'Campaign type is required';
    }

    if (!formData.repeat_interval) {
      newErrors.repeat_interval = 'Repeat interval is required';
    }

    if (!formData.max_attempts_per_interval || formData.max_attempts_per_interval < 1) {
      newErrors.max_attempts_per_interval = 'Max attempts must be at least 1';
    }

    // Custom interval validation
    if (formData.repeat_interval === 'custom' && (!formData.custom_interval_days || formData.custom_interval_days < 1)) {
      newErrors.custom_interval_days = 'Custom interval days must be at least 1';
    }

    // Date validation
    if (formData.start_date && formData.end_date) {
      if (new Date(formData.start_date) >= new Date(formData.end_date)) {
        newErrors.end_date = 'End date must be after start date';
      }
    }

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
        max_attempts_per_interval: parseInt(formData.max_attempts_per_interval),
        custom_interval_days: formData.custom_interval_days ? parseInt(formData.custom_interval_days) : null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null
      };

      console.log(`🔄 ${isEdit ? 'Updating' : 'Creating'} campaign:`, submitData);

      const endpoint = isEdit 
        ? `${API_BASE_URL}/daily-rewards/campaigns/${id}`
        : `${API_BASE_URL}/daily-rewards/campaigns`;
      
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ ${isEdit ? 'Update' : 'Create'} result:`, result);
      
      if (result.success) {
        alert(`Campaign ${isEdit ? 'updated' : 'created'} successfully!`);
        navigate('/daily-rewards');
      } else {
        throw new Error(result.message || `Campaign ${isEdit ? 'update' : 'creation'} failed`);
      }

    } catch (error) {
      console.error(`❌ ${isEdit ? 'Update' : 'Create'} failed:`, error);
      setError(error.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading campaign...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{paddingBottom: '100px'}}>
      {/* Breadcrumb */}
      <div style={{marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
        <Link 
          to="/daily-rewards" 
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
          Back to Daily Rewards
        </Link>
        <span style={{color: 'var(--text-disabled)'}}>•</span>
        <span style={{color: 'var(--text-primary)', fontSize: '0.875rem'}}>
          {isEdit ? `Edit Campaign ${formData.title}` : 'Create New Campaign'}
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

      {/* Campaign Form */}
      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">
            {isEdit ? 'Edit Campaign' : 'Create New Campaign'}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} style={{padding: 'var(--spacing-lg)'}}>
          {/* Basic Information */}
          <div style={{marginBottom: 'var(--spacing-xl)'}}>
            <h4 style={{fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
              <Settings size={18} />
              Basic Information
            </h4>
            
            {/* Campaign Title */}
            <div className="form-group" style={{marginBottom: 'var(--spacing-lg)'}}>
              <label className="form-label">Campaign Title *</label>
              <input
                type="text"
                name="title"
                className="form-input"
                placeholder="Enter campaign title (e.g., Daily Spin & Win)"
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

            {/* Campaign Type and Status */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)'}}>
              <div className="form-group">
                <label className="form-label">Campaign Type *</label>
                <select
                  name="campaign_type"
                  className="form-input"
                  value={formData.campaign_type}
                  onChange={handleInputChange}
                  style={{borderColor: errors.campaign_type ? 'var(--error-border)' : undefined}}
                >
                  {campaignTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.campaign_type && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.campaign_type}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Activity size={16} style={{marginRight: 'var(--spacing-sm)'}} />
                  Status
                </label>
                <select
                  name="is_active"
                  className="form-input"
                  value={formData.is_active}
                  onChange={handleInputChange}
                >
                  <option value={1}>Active</option>
                  <option value={0}>Inactive</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="form-group" style={{marginBottom: 'var(--spacing-lg)'}}>
              <label className="form-label">Description</label>
              <textarea
                name="description"
                className="form-input"
                placeholder="Enter campaign description..."
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                style={{resize: 'vertical'}}
              />
            </div>
          </div>

          {/* Campaign Configuration */}
          <div style={{marginBottom: 'var(--spacing-xl)'}}>
            <h4 style={{fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
              <Target size={18} />
              Campaign Configuration
            </h4>
            
            {/* Repeat Interval and Max Attempts */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)'}}>
              <div className="form-group">
                <label className="form-label">
                  <Clock size={16} style={{marginRight: 'var(--spacing-sm)'}} />
                  Repeat Interval *
                </label>
                <select
                  name="repeat_interval"
                  className="form-input"
                  value={formData.repeat_interval}
                  onChange={handleInputChange}
                  style={{borderColor: errors.repeat_interval ? 'var(--error-border)' : undefined}}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom</option>
                </select>
                {errors.repeat_interval && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.repeat_interval}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Max Attempts per Interval *</label>
                <input
                  type="number"
                  name="max_attempts_per_interval"
                  className="form-input"
                  placeholder="1"
                  value={formData.max_attempts_per_interval}
                  onChange={handleInputChange}
                  min="1"
                  max="10"
                  style={{borderColor: errors.max_attempts_per_interval ? 'var(--error-border)' : undefined}}
                />
                {errors.max_attempts_per_interval && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.max_attempts_per_interval}
                  </span>
                )}
              </div>
            </div>

            {/* Custom Interval Days (shown only when repeat_interval is 'custom') */}
            {formData.repeat_interval === 'custom' && (
              <div className="form-group" style={{marginBottom: 'var(--spacing-lg)'}}>
                <label className="form-label">Custom Interval (Days) *</label>
                <input
                  type="number"
                  name="custom_interval_days"
                  className="form-input"
                  placeholder="Enter number of days (e.g., 3 for every 3 days)"
                  value={formData.custom_interval_days}
                  onChange={handleInputChange}
                  min="1"
                  max="365"
                  style={{borderColor: errors.custom_interval_days ? 'var(--error-border)' : undefined}}
                />
                {errors.custom_interval_days && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.custom_interval_days}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Duration Settings */}
          <div style={{marginBottom: 'var(--spacing-xl)'}}>
            <h4 style={{fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
              <Calendar size={18} />
              Campaign Duration (Optional)
            </h4>
            
            {/* Start Date and End Date */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)'}}>
              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  name="start_date"
                  className="form-input"
                  value={formData.start_date}
                  onChange={handleInputChange}
                />
                <div style={{fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 'var(--spacing-xs)'}}>
                  Leave empty to start immediately
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">End Date</label>
                <input
                  type="date"
                  name="end_date"
                  className="form-input"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  style={{borderColor: errors.end_date ? 'var(--error-border)' : undefined}}
                />
                <div style={{fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 'var(--spacing-xs)'}}>
                  Leave empty to run indefinitely
                </div>
                {errors.end_date && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.end_date}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Configuration Summary */}
          <div style={{
            padding: 'var(--spacing-lg)',
            background: 'var(--bg-glass-light)',
            border: '1px solid var(--border-glass)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: 'var(--spacing-xl)'
          }}>
            <h5 style={{fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-md)'}}>
              Configuration Summary
            </h5>
            <div style={{fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.6'}}>
              <p>
                <strong>Campaign:</strong> {formData.title || 'Untitled Campaign'} 
                ({campaignTypes.find(t => t.value === formData.campaign_type)?.label || formData.campaign_type}, {formData.is_active ? 'Active' : 'Inactive'})
              </p>
              <p>
                <strong>Schedule:</strong> Users can spin up to {formData.max_attempts_per_interval} time(s) every {formData.repeat_interval}
                {formData.repeat_interval === 'custom' && formData.custom_interval_days && ` (${formData.custom_interval_days} days)`}
              </p>
              <p>
                <strong>Duration:</strong> 
                {formData.start_date ? ` Starts ${formData.start_date}` : ' Starts immediately'}
                {formData.end_date ? `, ends ${formData.end_date}` : ', runs indefinitely'}
              </p>
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
        <Link to="/daily-rewards" className="btn btn-secondary">
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
              {isEdit ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              <Save size={16} />
              {isEdit ? 'Update Campaign' : 'Create Campaign'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default DailyRewardsForm;