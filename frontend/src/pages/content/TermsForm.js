// pages/content/TermsForm.js - Terms & Conditions Add/Edit Form Component
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  Save, X, FileText, Shield, Activity, AlertCircle
} from 'lucide-react';
import '../../styles/AdminStyles.css';

const TermsForm = ({ isEdit = false }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  // Form data state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
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

  // Fetch Terms data for editing
  const fetchTermsData = async () => {
    if (!isEdit || !id) return;
    
    try {
      setError(null);
      console.log(`🔄 Fetching Terms data for editing, ID: ${id}`);
      
      const response = await fetch(`${API_BASE_URL}/terms/${id}`, {
        method: 'GET',
        headers: getHeaders(),
        credentials: 'include'
      });

      console.log(`📡 Terms edit response status: ${response.status}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Terms & Conditions with ID ${id} not found`);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Terms Edit API Response:', data);

      if (!data.success || !data.data || !data.data.term) {
        throw new Error('Invalid API response format');
      }

      const termData = data.data.term;
      
      if (!termData.id || termData.id != id) {
        throw new Error(`Terms ID mismatch: expected ${id}, got ${termData.id}`);
      }
      
      // Set form data with all fields
      setFormData({
        title: termData.title || '',
        description: termData.description || '',
        is_active: termData.is_active || 1
      });
      
      console.log('✅ Terms edit data loaded successfully for Terms:', termData.id);

    } catch (error) {
      console.error(`❌ Failed to fetch Terms ${id} for editing:`, error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isEdit) {
      fetchTermsData();
    } else {
      setLoading(false);
    }
  }, [isEdit, id]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    let newValue = value;
    if (type === 'checkbox') {
      newValue = checked ? 1 : 0;
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
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
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
      // Prepare data
      const submitData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        is_active: formData.is_active
      };

      console.log(`🔄 ${isEdit ? 'Updating' : 'Creating'} Terms with data:`, submitData);

      const url = isEdit ? `${API_BASE_URL}/terms/${id}` : `${API_BASE_URL}/terms`;
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: getHeaders(),
        body: JSON.stringify(submitData)
      });

      console.log(`📡 ${isEdit ? 'Update' : 'Create'} response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Submit result:', result);
      
      if (result.success) {
        alert(`Terms & Conditions ${isEdit ? 'updated' : 'created'} successfully!`);
        navigate('/content/terms');
      } else {
        throw new Error(result.message || `Terms & Conditions ${isEdit ? 'update' : 'creation'} failed`);
      }

    } catch (error) {
      console.error(`❌ ${isEdit ? 'Update' : 'Create'} failed:`, error);
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
          <p>Loading Terms & Conditions...</p>
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

      {/* Form Layout */}
      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">
            {isEdit ? `Edit Terms & Conditions #${id}` : 'Create New Terms & Conditions'}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} style={{padding: 'var(--spacing-lg)'}}>
          {/* Basic Information */}
          <div style={{marginBottom: 'var(--spacing-xl)'}}>
            <h4 style={{fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
              <FileText size={18} />
              Document Information
            </h4>
            
            {/* Title */}
            <div className="form-group" style={{marginBottom: 'var(--spacing-lg)'}}>
              <label className="form-label">
                <Shield size={16} style={{marginRight: 'var(--spacing-sm)'}} />
                Title *
              </label>
              <input
                type="text"
                name="title"
                className="form-input"
                placeholder="e.g., Terms of Service, Privacy Policy"
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

            {/* Description */}
            <div className="form-group" style={{marginBottom: 'var(--spacing-lg)'}}>
              <label className="form-label">Description *</label>
              <textarea
                name="description"
                className="form-input"
                placeholder="Provide detailed terms and conditions content..."
                value={formData.description}
                onChange={handleInputChange}
                rows="12"
                style={{
                  resize: 'vertical',
                  borderColor: errors.description ? 'var(--error-border)' : undefined,
                  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                  fontSize: '0.875rem',
                  lineHeight: 1.6
                }}
              />
              <small style={{color: 'var(--text-muted)', fontSize: '0.75rem'}}>
                You can include HTML formatting, lists, and links in the description
              </small>
              {errors.description && (
                <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                  {errors.description}
                </span>
              )}
            </div>
          </div>

          {/* Status Settings */}
          <div style={{padding: 'var(--spacing-lg)', background: 'var(--bg-glass-light)', borderRadius: 'var(--radius-lg)'}}>
            <h4 style={{fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
              <Activity size={18} />
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
                Terms & Conditions Active
              </label>
            </div>
            <small style={{color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 'var(--spacing-sm)'}}>
              Only active terms will be displayed to users
            </small>
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
        <Link to="/content/terms" className="btn btn-secondary">
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
              {isEdit ? 'Saving...' : 'Creating...'}
            </>
          ) : (
            <>
              <Save size={16} />
              {isEdit ? 'Save Changes' : 'Create Terms'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default TermsForm;