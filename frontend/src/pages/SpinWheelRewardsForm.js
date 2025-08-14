// pages/SpinWheelRewardsForm.js - Spin Wheel Rewards Form (Add/Edit)
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { 
  Save, X, Gift, DollarSign, Star, Award, 
  AlertCircle, Palette, Settings, ArrowLeft, Search
} from 'lucide-react';
import '../styles/AdminStyles.css';

const SpinWheelRewardsForm = ({ isEdit = false }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get campaign_id from URL params for add mode
  const urlCampaignId = searchParams.get('campaign_id');

  // Form data state
  const [formData, setFormData] = useState({
    campaign_id: urlCampaignId || '',
    reward_type: 'cashback',
    reward_value: '',
    coupon_id: '',
    probability_weight: '',
    display_text: '',
    display_color: '#3b82f6',
    is_active: 1
  });

  // Search states for coupons
  const [couponSearch, setCouponSearch] = useState('');
  const [couponSearchResults, setCouponSearchResults] = useState([]);
  const [couponSearchLoading, setCouponSearchLoading] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);

  // Campaign options
  const [campaigns, setCampaigns] = useState([]);

  // Validation errors
  const [errors, setErrors] = useState({});

  // API Configuration
  const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';
  
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  });

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

  // Search coupons
  const searchCoupons = useCallback(async (searchTerm) => {
  if (!searchTerm || searchTerm.length < 2) {
    setCouponSearchResults([]);
    return;
  }

  try {
    setCouponSearchLoading(true);
    console.log(`🔍 Searching coupons in coupon_master for: "${searchTerm}"`);
    
    // Updated endpoints to use coupon_master search
    const endpoints = [
      `${API_BASE_URL}/transactions/search/coupons?q=${encodeURIComponent(searchTerm)}`,
      `/api/transactions/search/coupons?q=${encodeURIComponent(searchTerm)}`,
      `${API_BASE_URL}/daily-rewards/search/coupons?q=${encodeURIComponent(searchTerm)}`,
      `/api/daily-rewards/search/coupons?q=${encodeURIComponent(searchTerm)}`
    ];

    let couponData = null;

    for (const endpoint of endpoints) {
      try {
        console.log(`🔄 Trying coupon search endpoint: ${endpoint}`);
        
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: getHeaders(),
          credentials: 'include'
        });

        console.log(`📡 Coupon search response status: ${response.status}`);

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Coupon search API response:', data);
          couponData = data;
          break;
        } else {
          const errorText = await response.text();
          console.warn(`⚠️ Coupon search endpoint ${endpoint} failed:`, response.status, errorText);
        }
      } catch (err) {
        console.warn(`⚠️ Coupon search endpoint ${endpoint} error:`, err.message);
        continue;
      }
    }

    if (couponData && couponData.success) {
      // Process coupon_master data to match expected format
      const processedCoupons = (couponData.data || []).map(coupon => {
        console.log('🔍 Processing coupon from coupon_master:', coupon);
        
        return {
          id: coupon.id || coupon.coupon_id,
          code: coupon.code || coupon.coupon_name,
          title: coupon.title || coupon.coupon_name,
          name: coupon.name || coupon.title || coupon.coupon_name,
          description: coupon.description,
          discount_type: coupon.discount_type,
          discount_value: coupon.discount_value,
          // Add compatibility fields for display
          discount_amount: coupon.discount_amount || (coupon.discount_type === 'fixed' ? coupon.discount_value : null),
          discount_percentage: coupon.discount_percentage || (coupon.discount_type === 'percentage' ? coupon.discount_value : null),
          is_active: coupon.is_active,
          store_id: coupon.store_id
        };
      });
      
      console.log(`✅ Processed ${processedCoupons.length} coupons for search results`);
      console.log('📋 Sample processed coupon:', processedCoupons[0]);
      
      setCouponSearchResults(processedCoupons);
    } else {
      console.log('⚠️ No coupon data received or unsuccessful response');
      setCouponSearchResults([]);
    }
  } catch (error) {
    console.error('❌ Coupon search failed:', error);
    setCouponSearchResults([]);
  } finally {
    setCouponSearchLoading(false);
  }
}, [API_BASE_URL]);

  // Debounced coupon search
  const debouncedCouponSearch = useCallback(debounce(searchCoupons, 300), [searchCoupons]);

  // Handle coupon search input changes
  useEffect(() => {
    if (couponSearch && !selectedCoupon) {
      debouncedCouponSearch(couponSearch);
    }
  }, [couponSearch, selectedCoupon, debouncedCouponSearch]);

  // Fetch campaigns for dropdown
  const fetchCampaigns = async () => {
    try {
      const endpoints = [
        `${API_BASE_URL}/daily-rewards/campaigns?limit=100`,
        `/api/daily-rewards/campaigns?limit=100`
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

      if (campaignData && campaignData.success) {
        setCampaigns(campaignData.data.campaigns || []);
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    }
  };

  // Fetch reward data for editing
  const fetchReward = async () => {
    if (!isEdit || !id) return;

    try {
      setLoading(true);
      setError(null);

      const endpoints = [
        `${API_BASE_URL}/daily-rewards/rewards/${id}`,
        `/api/daily-rewards/rewards/${id}`
      ];

      let rewardData = null;

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: getHeaders(),
            credentials: 'include'
          });

          if (response.ok) {
            const data = await response.json();
            rewardData = data;
            break;
          }
        } catch (err) {
          continue;
        }
      }

      if (!rewardData || !rewardData.success) {
        throw new Error('Reward not found');
      }

      const reward = rewardData.data;
      
      setFormData({
        campaign_id: reward.campaign_id || '',
        reward_type: reward.reward_type || 'cashback',
        reward_value: reward.reward_value || '',
        coupon_id: reward.coupon_id || '',
        probability_weight: reward.probability_weight || '',
        display_text: reward.display_text || '',
        display_color: reward.display_color || '#3b82f6',
        is_active: reward.is_active !== undefined ? reward.is_active : 1
      });

      // Set selected coupon if exists
      if (reward.coupon_code && reward.coupon_id) {
        const coupon = {
          id: reward.coupon_id,
          code: reward.coupon_code,
          title: reward.coupon_title || reward.coupon_code
        };
        setSelectedCoupon(coupon);
        setCouponSearch(`${coupon.code} (${coupon.title})`);
      }

      console.log('✅ Reward data loaded for editing');

    } catch (error) {
      console.error('❌ Failed to fetch reward:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchCampaigns();
    if (isEdit) {
      fetchReward();
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

    // Update display text automatically based on reward type and value
    if (name === 'reward_type' || name === 'reward_value') {
      updateDisplayText(
        name === 'reward_type' ? value : formData.reward_type,
        name === 'reward_value' ? value : formData.reward_value
      );
    }
  };

  // Auto-generate display text
  const updateDisplayText = (rewardType, rewardValue) => {
    if (!rewardValue) return;

    let displayText = '';
    switch (rewardType) {
      case 'cashback':
        displayText = `₹${rewardValue} Cashback`;
        break;
      case 'coupon':
        displayText = selectedCoupon ? `${selectedCoupon.code} Coupon` : 'Coupon Reward';
        break;
      case 'points':
        displayText = `${rewardValue} Points`;
        break;
      case 'nothing':
        displayText = 'Better Luck Next Time!';
        break;
      default:
        displayText = `${rewardValue} Reward`;
    }

    setFormData(prev => ({
      ...prev,
      display_text: displayText
    }));
  };

  // Handle coupon selection
  const handleCouponSelect = (coupon) => {
    setSelectedCoupon(coupon);
    setCouponSearch(`${coupon.code} (${coupon.title || coupon.name})`);
    setFormData(prev => ({
      ...prev,
      coupon_id: coupon.id
    }));
    setCouponSearchResults([]);
    
    // Update display text
    updateDisplayText(formData.reward_type, formData.reward_value);
  };

  // Clear coupon selection
  const clearCouponSelection = () => {
    setSelectedCoupon(null);
    setCouponSearch('');
    setFormData(prev => ({
      ...prev,
      coupon_id: ''
    }));
    setCouponSearchResults([]);
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.campaign_id) {
      newErrors.campaign_id = 'Campaign is required';
    }

    if (!formData.reward_type) {
      newErrors.reward_type = 'Reward type is required';
    }

    if (!formData.display_text.trim()) {
      newErrors.display_text = 'Display text is required';
    }

    if (!formData.probability_weight || formData.probability_weight < 0 || formData.probability_weight > 100) {
      newErrors.probability_weight = 'Probability weight must be between 0 and 100';
    }

    // Reward value validation
    if (formData.reward_type !== 'nothing') {
      if (!formData.reward_value || parseFloat(formData.reward_value) <= 0) {
        newErrors.reward_value = 'Reward value must be greater than 0';
      }
    }

    // Coupon validation for coupon reward type
    if (formData.reward_type === 'coupon' && !formData.coupon_id) {
      newErrors.coupon_id = 'Coupon is required for coupon reward type';
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
        campaign_id: parseInt(formData.campaign_id),
        reward_value: formData.reward_value ? parseFloat(formData.reward_value) : null,
        coupon_id: formData.coupon_id ? parseInt(formData.coupon_id) : null,
        probability_weight: parseInt(formData.probability_weight)
      };

      console.log(`🔄 ${isEdit ? 'Updating' : 'Creating'} reward:`, submitData);

      const endpoint = isEdit 
        ? `${API_BASE_URL}/daily-rewards/rewards/${id}`
        : `${API_BASE_URL}/daily-rewards/rewards`;
      
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
        alert(`Reward ${isEdit ? 'updated' : 'created'} successfully!`);
        
        // Navigate back to campaign details if we have campaign_id
        if (formData.campaign_id) {
          navigate(`/daily-rewards/campaigns/${formData.campaign_id}`);
        } else {
          navigate('/daily-rewards');
        }
      } else {
        throw new Error(result.message || `Reward ${isEdit ? 'update' : 'creation'} failed`);
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
          <p>Loading reward...</p>
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
          {isEdit ? 'Edit Reward' : 'Add New Reward'}
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

      {/* Reward Form */}
      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">
            {isEdit ? 'Edit Spin Wheel Reward' : 'Add New Spin Wheel Reward'}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} style={{padding: 'var(--spacing-lg)'}}>
          {/* Basic Information */}
          <div style={{marginBottom: 'var(--spacing-xl)'}}>
            <h4 style={{fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
              <Settings size={18} />
              Basic Information
            </h4>
            
            {/* Campaign Selection */}
            <div className="form-group" style={{marginBottom: 'var(--spacing-lg)'}}>
              <label className="form-label">Campaign *</label>
              <select
                name="campaign_id"
                className="form-input"
                value={formData.campaign_id}
                onChange={handleInputChange}
                style={{borderColor: errors.campaign_id ? 'var(--error-border)' : undefined}}
              >
                <option value="">Select a campaign</option>
                {campaigns.map(campaign => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.title} ({campaign.campaign_type})
                  </option>
                ))}
              </select>
              {errors.campaign_id && (
                <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                  {errors.campaign_id}
                </span>
              )}
            </div>

            {/* Reward Type and Probability */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)'}}>
              <div className="form-group">
                <label className="form-label">
                  <Gift size={16} style={{marginRight: 'var(--spacing-sm)'}} />
                  Reward Type *
                </label>
                <select
                  name="reward_type"
                  className="form-input"
                  value={formData.reward_type}
                  onChange={handleInputChange}
                  style={{borderColor: errors.reward_type ? 'var(--error-border)' : undefined}}
                >
                  <option value="cashback">Cashback</option>
                  <option value="coupon">Coupon</option>
                  <option value="points">Points</option>
                  <option value="nothing">Nothing (Better Luck Next Time)</option>
                </select>
                {errors.reward_type && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.reward_type}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Probability Weight (%) *</label>
                <input
                  type="number"
                  name="probability_weight"
                  className="form-input"
                  placeholder="10"
                  value={formData.probability_weight}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  step="0.1"
                  style={{borderColor: errors.probability_weight ? 'var(--error-border)' : undefined}}
                />
                {errors.probability_weight && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.probability_weight}
                  </span>
                )}
              </div>
            </div>

            {/* Reward Value (if not "nothing") */}
            {formData.reward_type !== 'nothing' && (
              <div className="form-group" style={{marginBottom: 'var(--spacing-lg)'}}>
                <label className="form-label">
                  {formData.reward_type === 'cashback' && <DollarSign size={16} style={{marginRight: 'var(--spacing-sm)'}} />}
                  {formData.reward_type === 'points' && <Star size={16} style={{marginRight: 'var(--spacing-sm)'}} />}
                  Reward Value *
                </label>
                <input
                  type="number"
                  name="reward_value"
                  className="form-input"
                  placeholder={
                    formData.reward_type === 'cashback' ? 'Enter amount (e.g., 50)' :
                    formData.reward_type === 'points' ? 'Enter points (e.g., 100)' :
                    'Enter value'
                  }
                  value={formData.reward_value}
                  onChange={handleInputChange}
                  min="0"
                  step={formData.reward_type === 'cashback' ? '0.01' : '1'}
                  style={{borderColor: errors.reward_value ? 'var(--error-border)' : undefined}}
                />
                {errors.reward_value && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.reward_value}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Coupon Selection (if reward type is coupon) */}
          {formData.reward_type === 'coupon' && (
            <div style={{marginBottom: 'var(--spacing-xl)'}}>
              <h4 style={{fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                <Gift size={18} />
                Coupon Selection
              </h4>
              
              <div className="form-group" style={{position: 'relative'}}>
                <label className="form-label">Search Coupon *</label>
                <div style={{position: 'relative'}}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search coupon by code..."
                    value={couponSearch}
                    onChange={(e) => {
                      setCouponSearch(e.target.value);
                      if (selectedCoupon && e.target.value !== `${selectedCoupon.code} (${selectedCoupon.title})`) {
                        clearCouponSelection();
                      }
                    }}
                    style={{borderColor: errors.coupon_id ? 'var(--error-border)' : undefined}}
                  />
                  <Search size={16} style={{
                    position: 'absolute',
                    right: 'var(--spacing-md)',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-disabled)'
                  }} />
                </div>
                
                {/* Coupon Search Results */}
                {couponSearchResults.length > 0 && (
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
                    {couponSearchResults.map(coupon => (
                      <div
                        key={coupon.id}
                        style={{
                          padding: 'var(--spacing-md)',
                          cursor: 'pointer',
                          borderBottom: '1px solid var(--border-light)',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = 'var(--bg-glass-light)'}
                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                        onClick={() => handleCouponSelect(coupon)}
                      >
                        <div style={{fontWeight: '500', color: 'var(--text-primary)'}}>
                          {coupon.code}
                        </div>
                        <div style={{fontSize: '0.875rem', color: 'var(--text-secondary)'}}>
                          {coupon.name || coupon.title} • ID: {coupon.id}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {couponSearchLoading && (
                  <div style={{fontSize: '0.875rem', color: 'var(--text-disabled)', marginTop: '0.25rem'}}>
                    Searching coupons...
                  </div>
                )}

                {selectedCoupon && (
                  <div style={{marginTop: '0.5rem'}}>
                    <button
                      type="button"
                      onClick={clearCouponSelection}
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--error-text)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      Clear coupon selection
                    </button>
                  </div>
                )}
                
                {errors.coupon_id && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.coupon_id}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Display Settings */}
          <div style={{marginBottom: 'var(--spacing-xl)'}}>
            <h4 style={{fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
              <Palette size={18} />
              Display Settings
            </h4>
            
            {/* Display Text and Color */}
            <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)'}}>
              <div className="form-group">
                <label className="form-label">Display Text *</label>
                <input
                  type="text"
                  name="display_text"
                  className="form-input"
                  placeholder="Text shown on spin wheel (e.g., ₹50 Cashback)"
                  value={formData.display_text}
                  onChange={handleInputChange}
                  style={{borderColor: errors.display_text ? 'var(--error-border)' : undefined}}
                />
                {errors.display_text && (
                  <span style={{color: 'var(--error-text)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)'}}>
                    {errors.display_text}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Display Color</label>
                <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                  <input
                    type="color"
                    name="display_color"
                    value={formData.display_color}
                    onChange={handleInputChange}
                    style={{
                      width: '40px',
                      height: '40px',
                      border: '1px solid var(--border-glass)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer'
                    }}
                  />
                  <input
                    type="text"
                    name="display_color"
                    className="form-input"
                    value={formData.display_color}
                    onChange={handleInputChange}
                    placeholder="#3b82f6"
                    style={{flex: 1}}
                  />
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="form-group">
              <label className="form-label">Status</label>
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

          {/* Preview */}
          <div style={{
            padding: 'var(--spacing-lg)',
            background: 'var(--bg-glass-light)',
            border: '1px solid var(--border-glass)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: 'var(--spacing-xl)'
          }}>
            <h5 style={{fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-md)'}}>
              Preview
            </h5>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--spacing-md)',
              background: formData.display_color,
              color: 'white',
              borderRadius: 'var(--radius-md)',
              fontWeight: '600',
              fontSize: '0.875rem',
              minWidth: '120px',
              minHeight: '40px',
              textAlign: 'center'
            }}>
              {formData.display_text || 'Display Text'}
            </div>
            <div style={{fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 'var(--spacing-sm)'}}>
              This is how the reward will appear on the spin wheel
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
        <Link 
          to={formData.campaign_id ? `/daily-rewards/campaigns/${formData.campaign_id}` : '/daily-rewards'} 
          className="btn btn-secondary"
        >
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
              {isEdit ? 'Update Reward' : 'Create Reward'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SpinWheelRewardsForm;