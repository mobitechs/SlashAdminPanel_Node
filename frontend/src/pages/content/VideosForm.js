// pages/content/VideosForm.js - App Demo Videos Add/Edit Form Component
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  Save, X, Video, Play, Hash, Link as LinkIcon, Activity, AlertCircle
} from 'lucide-react';
import '../../styles/AdminStyles.css';

const VideosForm = ({ isEdit = false }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  // Form data state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_link: '',
    sequence: 0,
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

  // Fetch Video data for editing
  const fetchVideoData = async () => {
    if (!isEdit || !id) return;
    
    try {
      setError(null);
      console.log(`🔄 Fetching Video data for editing, ID: ${id}`);
      
      const response = await fetch(`${API_BASE_URL}/videos/${id}`, {
        method: 'GET',
        headers: getHeaders(),
        credentials: 'include'
      });

      console.log(`📡 Video edit response status: ${response.status}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Video with ID ${id} not found`);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Video Edit API Response:', data);

      if (!data.success || !data.data || !data.data.video) {
        throw new Error('Invalid API response format');
      }

      const videoData = data.data.video;
      
      if (!videoData.id || videoData.id != id) {
        throw new Error(`Video ID mismatch: expected ${id}, got ${videoData.id}`);
      }
      
      // Set form data with all fields
      setFormData({
        title: videoData.title || '',
        description: videoData.description || '',
        video_link: videoData.video_link || '',
        sequence: videoData.sequence || 0,
        is_active: videoData.is_active || 1
      });
      
      console.log('✅ Video edit data loaded successfully for Video:', videoData.id);

    } catch (error) {
      console.error(`❌ Failed to fetch Video ${id} for editing:`, error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isEdit) {
      fetchVideoData();
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
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.video_link.trim()) {
      newErrors.video_link = 'Video link is required';
    } else {
      // Basic URL validation
      const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      if (!urlPattern.test(formData.video_link)) {
        newErrors.video_link = 'Please enter a valid URL';
      }
    }

    // Sequence validation
    if (formData.sequence < 0) {
      newErrors.sequence = 'Sequence cannot be negative';
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
        video_link: formData.video_link.trim(),
        sequence: parseInt(formData.sequence) || 0,
        is_active: formData.is_active
      };

      console.log(`🔄 ${isEdit ? 'Updating' : 'Creating'} Video with data:`, submitData);

      const url = isEdit ? `${API_BASE_URL}/videos/${id}` : `${API_BASE_URL}/videos`;
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
        alert(`Video ${isEdit ? 'updated' : 'created'} successfully!`);
        navigate('/content/videos');
      } else {
        throw new Error(result.message || `Video ${isEdit ? 'update' : 'creation'} failed`);
      }

    } catch (error) {
      console.error(`❌ ${isEdit ? 'Update' : 'Create'} failed:`, error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  // Get video preview info
  const getVideoId = (link) => {
    if (!link) return null;
    const match = link.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const getThumbnailUrl = (link) => {
    const videoId = getVideoId(link);
    return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;
  };

  const thumbnailUrl = getThumbnailUrl(formData.video_link);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading Video...</p>
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
            {isEdit ? `Edit Video #${id}` : 'Create New App Demo Video'}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} style={{padding: 'var(--spacing-lg)'}}>
          {/* Basic Information */}
          <div style={{marginBottom: 'var(--spacing-xl)'}}>
            <h4 style={{fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
              <Video size={18} />
              Video Information
            </h4>
            
            {/* Title */}
            <div className="form-group" style={{marginBottom: 'var(--spacing-lg)'}}>
              <label className="form-label">
                <Play size={16} style={{marginRight: 'var(--spacing-sm)'}} />
                Title *
              </label>
              <input
                type="text"
                name="title"
                className="form-input"
                placeholder="e.g., Getting Started with the App"
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
              <label className="form-label">Description</label>
              <textarea
                name="description"
                className="form-input"
                placeholder="Provide a brief description of what this video covers..."
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                style={{resize: 'vertical'}}
              />
            </div>

            {/* Video Link | Sequence */}
            <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-lg)'}}>
              <div className="form-group">
                <label className="form-label">
                  <LinkIcon size={16} style={{marginRight: 'var(--spacing-sm)'}} />
                  Video Link *
                </label>
                <input
                  type="url"
                  name="video_link"
                  className="form-input"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={formData.video_link}
                  onChange={handleInputChange}
                  style={{borderColor: errors.video_link ? 'var(--error-border)' : undefined}}
                />
                <small style={{color: 'var(--text-muted)', fontSize: '0.75rem'}}>
                  YouTube, Vimeo, or any video URL
                </small>
                {errors.video_link && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.video_link}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Hash size={16} style={{marginRight: 'var(--spacing-sm)'}} />
                  Sequence Order
                </label>
                <input
                  type="number"
                  name="sequence"
                  className="form-input"
                  placeholder="0"
                  value={formData.sequence}
                  onChange={handleInputChange}
                  min="0"
                  step="1"
                  style={{borderColor: errors.sequence ? 'var(--error-border)' : undefined}}
                />
                <small style={{color: 'var(--text-muted)', fontSize: '0.75rem'}}>
                  Display order (0 = first)
                </small>
                {errors.sequence && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.sequence}
                  </span>
                )}
              </div>
            </div>

            {/* Video Preview */}
            {thumbnailUrl && (
              <div style={{marginTop: 'var(--spacing-lg)'}}>
                <label className="form-label" style={{marginBottom: 'var(--spacing-sm)'}}>
                  Video Preview
                </label>
                <div style={{
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--spacing-md)',
                  background: 'var(--bg-glass-light)'
                }}>
                  <div style={{
                    position: 'relative',
                    width: '200px',
                    height: '112px',
                    backgroundImage: `url(${thumbnailUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div style={{
                      background: 'rgba(0,0,0,0.7)',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}>
                      <Play size={20} style={{color: 'white', marginLeft: '2px'}} />
                    </div>
                  </div>
                  <p style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    marginTop: 'var(--spacing-xs)',
                    marginBottom: 0
                  }}>
                    Preview will be displayed to users
                  </p>
                </div>
              </div>
            )}
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
                Video Active
              </label>
            </div>
            <small style={{color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 'var(--spacing-sm)'}}>
              Only active videos will be shown to users in the app
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
        <Link to="/content/videos" className="btn btn-secondary">
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
              {isEdit ? 'Save Changes' : 'Create Video'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default VideosForm;