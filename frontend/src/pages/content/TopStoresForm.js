// pages/content/TopStoresForm.js - Top Stores Add/Edit Form Component
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  Save, X, Star, Store, Hash, Activity, AlertCircle
} from 'lucide-react';
import '../../styles/AdminStyles.css';

const TopStoresForm = ({ isEdit = false }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [availableStores, setAvailableStores] = useState([]);
  
  // Form data state
  const [formData, setFormData] = useState({
    store_id: '',
    sequence_no: 0,
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

  // Fetch available stores for dropdown
  const fetchAvailableStores = async () => {
    try {
      console.log('🔄 Fetching available stores');
      
      const response = await fetch(`${API_BASE_URL}/stores-sequence/available/stores`, {
        method: 'GET',
        headers: getHeaders(),
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Available stores fetched:', data);
        
        if (data.success && data.data?.stores) {
          setAvailableStores(data.data.stores);
        }
      } else {
        console.warn('Failed to fetch available stores, using fallback');
        // Static fallback stores
        setAvailableStores([
          { id: 1, name: 'TechMart Electronics', address: '123 Main St, Mumbai' },
          { id: 2, name: 'Fashion Hub', address: '456 Fashion Ave, Delhi' },
          { id: 3, name: 'Fresh Grocers', address: '789 Market St, Bangalore' }
        ]);
      }
    } catch (error) {
      console.error('Error fetching available stores:', error);
      // Static fallback stores
      setAvailableStores([
        { id: 1, name: 'TechMart Electronics', address: '123 Main St, Mumbai' },
        { id: 2, name: 'Fashion Hub', address: '456 Fashion Ave, Delhi' },
        { id: 3, name: 'Fresh Grocers', address: '789 Market St, Bangalore' }
      ]);
    }
  };

  // Fetch Store Sequence data for editing
  const fetchStoreSequenceData = async () => {
    if (!isEdit || !id) return;
    
    try {
      setError(null);
      console.log(`🔄 Fetching Store Sequence data for editing, ID: ${id}`);
      
      const response = await fetch(`${API_BASE_URL}/stores-sequence/${id}`, {
        method: 'GET',
        headers: getHeaders(),
        credentials: 'include'
      });

      console.log(`📡 Store Sequence edit response status: ${response.status}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Store Sequence with ID ${id} not found`);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Store Sequence Edit API Response:', data);

      if (!data.success || !data.data || !data.data.storeSequence) {
        throw new Error('Invalid API response format');
      }

      const storeSequenceData = data.data.storeSequence;
      
      if (!storeSequenceData.id || storeSequenceData.id != id) {
        throw new Error(`Store Sequence ID mismatch: expected ${id}, got ${storeSequenceData.id}`);
      }
      
      // Set form data with all fields
      setFormData({
        store_id: storeSequenceData.store_id || '',
        sequence_no: storeSequenceData.sequence_no || 0,
        is_active: storeSequenceData.is_active || 1
      });
      
      console.log('✅ Store Sequence edit data loaded successfully for Store Sequence:', storeSequenceData.id);

    } catch (error) {
      console.error(`❌ Failed to fetch Store Sequence ${id} for editing:`, error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailableStores();
    if (isEdit) {
      fetchStoreSequenceData();
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
    if (!formData.store_id) {
      newErrors.store_id = 'Store selection is required';
    }

    // Sequence validation
    if (formData.sequence_no < 0) {
      newErrors.sequence_no = 'Sequence number cannot be negative';
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
        store_id: parseInt(formData.store_id),
        sequence_no: parseInt(formData.sequence_no) || 0,
        is_active: formData.is_active
      };

      console.log(`🔄 ${isEdit ? 'Updating' : 'Creating'} Store Sequence with data:`, submitData);

      const url = isEdit ? `${API_BASE_URL}/stores-sequence/${id}` : `${API_BASE_URL}/stores-sequence`;
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
        alert(`Top Store ${isEdit ? 'updated' : 'added'} successfully!`);
        navigate('/content/top-stores');
      } else {
        throw new Error(result.message || `Top Store ${isEdit ? 'update' : 'creation'} failed`);
      }

    } catch (error) {
      console.error(`❌ ${isEdit ? 'Update' : 'Create'} failed:`, error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  // Get selected store details
  const selectedStore = availableStores.find(store => store.id == formData.store_id);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading Top Store...</p>
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
            {isEdit ? `Edit Top Store #${id}` : 'Add Store to Top Stores'}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} style={{padding: 'var(--spacing-lg)'}}>
          {/* Store Selection */}
          <div style={{marginBottom: 'var(--spacing-xl)'}}>
            <h4 style={{fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
              <Star size={18} />
              Store Selection
            </h4>
            
            {/* Store Dropdown */}
            <div className="form-group" style={{marginBottom: 'var(--spacing-lg)'}}>
              <label className="form-label">
                <Store size={16} style={{marginRight: 'var(--spacing-sm)'}} />
                Select Store *
              </label>
              <select
                name="store_id"
                className="form-input"
                value={formData.store_id}
                onChange={handleInputChange}
                style={{borderColor: errors.store_id ? 'var(--error-border)' : undefined}}
              >
                <option value="">Choose a store...</option>
                {availableStores.map(store => (
                  <option key={store.id} value={store.id}>
                    {store.name} - {store.address}
                  </option>
                ))}
              </select>
              {errors.store_id && (
                <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                  {errors.store_id}
                </span>
              )}
            </div>

            {/* Selected Store Preview */}
            {selectedStore && (
              <div style={{
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--spacing-md)',
                background: 'var(--bg-glass-light)',
                marginBottom: 'var(--spacing-lg)'
              }}>
                <h5 style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--spacing-sm)'
                }}>
                  Selected Store Preview
                </h5>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr',
                  gap: 'var(--spacing-md)',
                  alignItems: 'center'
                }}>
                  <div className="user-avatar">
                    {selectedStore.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: 'var(--text-primary)'
                    }}>
                      {selectedStore.name}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)'
                    }}>
                      {selectedStore.address}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sequence Number */}
            <div className="form-group">
              <label className="form-label">
                <Hash size={16} style={{marginRight: 'var(--spacing-sm)'}} />
                Sequence Number
              </label>
              <input
                type="number"
                name="sequence_no"
                className="form-input"
                placeholder="0"
                value={formData.sequence_no}
                onChange={handleInputChange}
                min="0"
                step="1"
                style={{borderColor: errors.sequence_no ? 'var(--error-border)' : undefined}}
              />
              <small style={{color: 'var(--text-muted)', fontSize: '0.75rem'}}>
                Lower numbers appear first in the top stores list (0 = first position)
              </small>
              {errors.sequence_no && (
                <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                  {errors.sequence_no}
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
                Show in Top Stores
              </label>
            </div>
            <small style={{color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 'var(--spacing-sm)'}}>
              Only active stores will be displayed in the top stores section
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
        <Link to="/content/top-stores" className="btn btn-secondary">
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
              {isEdit ? 'Saving...' : 'Adding...'}
            </>
          ) : (
            <>
              <Save size={16} />
              {isEdit ? 'Save Changes' : 'Add to Top Stores'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default TopStoresForm;