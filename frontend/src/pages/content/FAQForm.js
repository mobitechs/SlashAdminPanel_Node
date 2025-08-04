// pages/content/FAQForm.js - FAQ Add/Edit Form Component
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  Save, X, HelpCircle, MessageSquare, Hash, Activity,
  AlertCircle, Target
} from 'lucide-react';
import '../../styles/AdminStyles.css';

const FAQForm = ({ isEdit = false }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  // Form data state
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: '',
    display_order: 0,
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

  // Fetch FAQ data for editing
  const fetchFaqData = async () => {
    if (!isEdit || !id) return;
    
    try {
      setError(null);
      console.log(`🔄 Fetching FAQ data for editing, ID: ${id}`);
      
      const response = await fetch(`${API_BASE_URL}/faqs/${id}`, {
        method: 'GET',
        headers: getHeaders(),
        credentials: 'include'
      });

      console.log(`📡 FAQ edit response status: ${response.status}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`FAQ with ID ${id} not found`);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ FAQ Edit API Response:', data);

      if (!data.success || !data.data || !data.data.faq) {
        throw new Error('Invalid API response format');
      }

      const faqData = data.data.faq;
      
      if (!faqData.id || faqData.id != id) {
        throw new Error(`FAQ ID mismatch: expected ${id}, got ${faqData.id}`);
      }
      
      // Set form data with all fields
      setFormData({
        question: faqData.question || '',
        answer: faqData.answer || '',
        category: faqData.category || '',
        display_order: faqData.display_order || 0,
        is_active: faqData.is_active || 1
      });
      
      console.log('✅ FAQ edit data loaded successfully for FAQ:', faqData.id);

    } catch (error) {
      console.error(`❌ Failed to fetch FAQ ${id} for editing:`, error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isEdit) {
      fetchFaqData();
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
    } else if (type === 'number') {
      newValue = value === '' ? '' : parseInt(value);
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
    if (!formData.question.trim()) {
      newErrors.question = 'Question is required';
    }

    if (!formData.answer.trim()) {
      newErrors.answer = 'Answer is required';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    // Display order validation
    if (formData.display_order < 0) {
      newErrors.display_order = 'Display order cannot be negative';
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
        question: formData.question.trim(),
        answer: formData.answer.trim(),
        category: formData.category.trim(),
        display_order: parseInt(formData.display_order) || 0,
        is_active: formData.is_active
      };

      console.log(`🔄 ${isEdit ? 'Updating' : 'Creating'} FAQ with data:`, submitData);

      const url = isEdit ? `${API_BASE_URL}/faqs/${id}` : `${API_BASE_URL}/faqs`;
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
        alert(`FAQ ${isEdit ? 'updated' : 'created'} successfully!`);
        navigate('/content/faqs');
      } else {
        throw new Error(result.message || `FAQ ${isEdit ? 'update' : 'creation'} failed`);
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
          <p>Loading FAQ...</p>
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
            {isEdit ? `Edit FAQ #${id}` : 'Create New FAQ'}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} style={{padding: 'var(--spacing-lg)'}}>
          {/* Basic Information */}
          <div style={{marginBottom: 'var(--spacing-xl)'}}>
            <h4 style={{fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
              <HelpCircle size={18} />
              FAQ Information
            </h4>
            
            {/* Question */}
            <div className="form-group" style={{marginBottom: 'var(--spacing-lg)'}}>
              <label className="form-label">
                <MessageSquare size={16} style={{marginRight: 'var(--spacing-sm)'}} />
                Question *
              </label>
              <input
                type="text"
                name="question"
                className="form-input"
                placeholder="Enter the frequently asked question"
                value={formData.question}
                onChange={handleInputChange}
                style={{borderColor: errors.question ? 'var(--error-border)' : undefined}}
              />
              {errors.question && (
                <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                  {errors.question}
                </span>
              )}
            </div>

            {/* Answer */}
            <div className="form-group" style={{marginBottom: 'var(--spacing-lg)'}}>
              <label className="form-label">Answer *</label>
              <textarea
                name="answer"
                className="form-input"
                placeholder="Provide a detailed answer to the question"
                value={formData.answer}
                onChange={handleInputChange}
                rows="4"
                style={{
                  resize: 'vertical',
                  borderColor: errors.answer ? 'var(--error-border)' : undefined
                }}
              />
              {errors.answer && (
                <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                  {errors.answer}
                </span>
              )}
            </div>

            {/* Category | Display Order */}
            <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-lg)'}}>
              <div className="form-group">
                <label className="form-label">
                  <Target size={16} style={{marginRight: 'var(--spacing-sm)'}} />
                  Category *
                </label>
                <input
                  type="text"
                  name="category"
                  className="form-input"
                  placeholder="e.g., Orders, Payment, Delivery"
                  value={formData.category}
                  onChange={handleInputChange}
                  style={{borderColor: errors.category ? 'var(--error-border)' : undefined}}
                />
                {errors.category && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.category}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Hash size={16} style={{marginRight: 'var(--spacing-sm)'}} />
                  Display Order
                </label>
                <input
                  type="number"
                  name="display_order"
                  className="form-input"
                  placeholder="0"
                  value={formData.display_order}
                  onChange={handleInputChange}
                  min="0"
                  step="1"
                  style={{borderColor: errors.display_order ? 'var(--error-border)' : undefined}}
                />
                <small style={{color: 'var(--text-muted)', fontSize: '0.75rem'}}>
                  Lower numbers appear first
                </small>
                {errors.display_order && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.display_order}
                  </span>
                )}
              </div>
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
                FAQ Active
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
        <Link to="/content/faqs" className="btn btn-secondary">
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
              {isEdit ? 'Save Changes' : 'Create FAQ'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default FAQForm;