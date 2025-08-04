// pages/RewardHistoryDetails.js - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, User, Store, Receipt, Calendar, Clock,
  Gift, Shield, Target, CheckCircle, Award, Star, 
  Activity, Home, ChevronRight, Eye, Users, TrendingUp,
  Phone, Mail, MapPin, CreditCard, DollarSign
} from 'lucide-react';
import ErrorState from '../components/common/ErrorState';
import '../styles/AdminStyles.css';

const RewardHistoryDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [historyRecord, setHistoryRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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

  // Fetch reward history details
  const fetchHistoryDetails = async () => {
    try {
      setError(null);
      console.log(`🔄 Fetching reward history details for ID: ${id}`);
      
      const possibleEndpoints = [
        `${API_BASE_URL}/reward-history/${id}`,
        `/api/reward-history/${id}`,
        `/reward-history/${id}`
      ];

      let lastError = null;
      let historyData = null;

      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`🔄 Trying reward history details endpoint: ${endpoint}`);
          
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: getHeaders(),
            credentials: 'include'
          });

          console.log(`📡 Reward history details response status: ${response.status}`);

          if (response.ok) {
            const data = await response.json();
            console.log('✅ Reward History Details API Response:', JSON.stringify(data, null, 2));
            historyData = data;
            break;
          } else if (response.status === 404) {
            throw new Error(`Reward history record with ID ${id} not found`);
          } else {
            const errorText = await response.text();
            console.warn(`⚠️ Reward history details endpoint ${endpoint} failed:`, response.status, errorText);
            lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        } catch (err) {
          console.warn(`⚠️ Reward history details endpoint ${endpoint} error:`, err.message);
          lastError = err;
          
          if (err.message.includes('not found') || err.message.includes('404')) {
            throw err;
          }
          continue;
        }
      }

      if (!historyData) {
        throw lastError || new Error(`Failed to fetch reward history data for ID: ${id}. Please check if the record exists.`);
      }

      const processedHistory = processHistoryData(historyData);
      if (!processedHistory.id) {
        throw new Error(`Invalid reward history data received for ID: ${id}`);
      }
      
      setHistoryRecord(processedHistory);
      console.log('✅ Reward history details loaded successfully:', processedHistory);

    } catch (error) {
      console.error(`❌ Failed to fetch reward history ${id}:`, error.message);
      setError(error.message);
      setHistoryRecord(null);
    } finally {
      setLoading(false);
    }
  };

  // Process reward history data from API response
  const processHistoryData = (rawData) => {
    try {
      console.log('🔍 Processing raw API data:', rawData);
      
      let historyData = null;
      
      // Handle backend structure: { success: true, data: { history: {...} } }
      if (rawData.success && rawData.data) {
        historyData = rawData.data.history || rawData.data;
      } else if (rawData.history) {
        historyData = rawData.history;
      } else if (rawData.id) {
        historyData = rawData;
      } else {
        console.error('❌ Unrecognized API response structure:', rawData);
        throw new Error('Invalid API response format - no history data found');
      }

      console.log('🔍 Extracted history data:', historyData);

      if (!historyData) {
        throw new Error('History data is null or undefined');
      }

      if (!historyData.id) {
        console.error('❌ History data missing ID field:', historyData);
        throw new Error('History data missing required ID field');
      }

      if (historyData.id != id) {
        throw new Error(`History ID mismatch: expected ${id}, got ${historyData.id}`);
      }

      // Debug: Log reward type information
      console.log('🎯 Reward type debug:', {
        reward_type: historyData.reward_type,
        reward_name: historyData.reward_name,
        reward_type_category: historyData.reward_type_category
      });

      console.log('✅ Final processed history data:', historyData);
      
      return historyData;
    } catch (error) {
      console.error('❌ Error processing history data:', error);
      console.error('Raw data that caused error:', rawData);
      throw error;
    }
  };

  useEffect(() => {
    fetchHistoryDetails();
  }, [id]);

  // Helper functions
  const formatCurrency = (amount) => {
    const num = parseFloat(amount) || 0;
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  // FIXED: Function to get reward type display name
  const getRewardTypeDisplay = (history) => {
    // Use reward_name from the JOIN with reward_types table
    if (history.reward_name) {
      return history.reward_name;
    }
    
    // Fallback for cases where JOIN didn't work or reward_name is null
    return `Reward ID: ${history.reward_type}`;
  };

  const getUserInitials = (history) => {
    if (history.user_name) {
      const names = history.user_name.split(' ');
      return names.map(name => name.charAt(0)).join('').toUpperCase();
    }
    return history.user_email?.substring(0, 2).toUpperCase() || '??';
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading Reward History #{id}...</p>
        </div>
      </div>
    );
  }

  // Show error state if API failed and no history data
  if (error && !historyRecord) {
    return (
      <div className="page-container">
        <div className="chart-card">
          <ErrorState
            title="Failed to Load Reward History"
            message={error}
            onRetry={fetchHistoryDetails}
            backTo="/reward-history"
            backText="Back to Reward History List"
            debugInfo={{
              "History ID": id,
              "API Base URL": API_BASE_URL,
              "Expected Endpoint": `${API_BASE_URL}/reward-history/${id}`,
              "Error": error
            }}
          />
        </div>
      </div>
    );
  }

  if (!historyRecord) {
    return (
      <div className="page-container">
        <ErrorState
          title="Reward history record not found"
          message={`Reward history record #${id} does not exist in the database`}
          showRetry={false}
          backTo="/reward-history"
          backText="Back to Reward History"
          showDebugInfo={false}
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header with Back Button */}
      <div style={{
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 'var(--spacing-xl)',
        padding: 'var(--spacing-lg)',
        background: 'var(--bg-glass)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-glass)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
          <button 
            onClick={() => navigate('/reward-history')}
            style={{
              background: 'var(--bg-glass-hover)',
              border: '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--spacing-sm)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <h1 style={{
            fontSize: '1.5rem', 
            fontWeight: '600', 
            color: 'var(--text-primary)',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)'
          }}>
            <Gift size={24} style={{color: 'var(--text-muted)'}} />
            Reward History #{historyRecord.id}
          </h1>
        </div>
        
        <div style={{display: 'flex', gap: 'var(--spacing-md)'}}>
          <span 
            className={`status-badge ${historyRecord.credit_debit}`}
            style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
          >
            {historyRecord.credit_debit === 'credit' ? '+' : '-'}
            {formatCurrency(historyRecord.amount)}
          </span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: 'var(--spacing-xl)',
        marginBottom: 'var(--spacing-xl)'
      }}>
        
        {/* User Information Card */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
              <User size={20} />
              User Information
            </h3>
          </div>
          <div style={{ padding: 'var(--spacing-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
              <div className="user-avatar" style={{ width: '60px', height: '60px', fontSize: '1.5rem' }}>
                {getUserInitials(historyRecord)}
              </div>
              <div>
                <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.25rem' }}>
                  {historyRecord.user_name || 'Unknown User'}
                </h4>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  User ID: {historyRecord.user_id}
                </p>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                <Mail size={16} style={{ color: 'var(--text-muted)' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email</div>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    {historyRecord.user_email || 'N/A'}
                  </div>
                </div>
              </div>
              
              {historyRecord.user_phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                  <Phone size={16} style={{ color: 'var(--text-muted)' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Phone</div>
                    <div style={{ color: 'var(--text-secondary)' }}>
                      {historyRecord.user_phone}
                    </div>
                  </div>
                </div>
              )}
              
              <div style={{ marginTop: 'var(--spacing-md)' }}>
                <Link 
                  to={`/users/${historyRecord.user_id}`}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', width: 'fit-content' }}
                >
                  <Eye size={16} />
                  View User Profile
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Reward Details Card */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
              <Award size={20} />
              Reward Details
            </h3>
          </div>
          <div style={{ padding: 'var(--spacing-lg)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                <Gift size={16} style={{ color: 'var(--text-muted)' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Reward Type</div>
                  <div style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>
                    {/* FIXED: Pass the entire historyRecord object, not just reward_type */}
                    {getRewardTypeDisplay(historyRecord)}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                <DollarSign size={16} style={{ color: 'var(--text-muted)' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Amount</div>
                  <div style={{ 
                    color: historyRecord.credit_debit === 'credit' ? 'var(--success-text)' : 'var(--error-text)', 
                    fontWeight: '600',
                    fontSize: '1.125rem'
                  }}>
                    {historyRecord.credit_debit === 'credit' ? '+' : '-'}
                    {formatCurrency(historyRecord.amount)}
                  </div>
                </div>
              </div>
              
              {historyRecord.description && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-md)' }}>
                  <Activity size={16} style={{ color: 'var(--text-muted)', marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Description</div>
                    <div style={{ color: 'var(--text-secondary)' }}>
                      {historyRecord.description}
                    </div>
                  </div>
                </div>
              )}
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Date & Time</div>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    {formatDateTime(historyRecord.created_at)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction & Store Information Row */}
      <div style={{
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: 'var(--spacing-xl)',
        marginBottom: 'var(--spacing-xl)'
      }}>
        
        {/* Transaction Details Card */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
              <Receipt size={20} />
              Transaction Details
            </h3>
          </div>
          <div style={{ padding: 'var(--spacing-lg)' }}>
            {historyRecord.transaction_id && historyRecord.transaction_number ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                  <Receipt size={16} style={{ color: 'var(--text-muted)' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Transaction Number</div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                      {historyRecord.transaction_number}
                    </div>
                  </div>
                </div>
                
                {historyRecord.bill_amount && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                    <CreditCard size={16} style={{ color: 'var(--text-muted)' }} />
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Bill Amount</div>
                      <div style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>
                        {formatCurrency(historyRecord.bill_amount)}
                      </div>
                    </div>
                  </div>
                )}
                
                {historyRecord.final_amount && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                    <DollarSign size={16} style={{ color: 'var(--text-muted)' }} />
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Final Amount</div>
                      <div style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>
                        {formatCurrency(historyRecord.final_amount)}
                      </div>
                    </div>
                  </div>
                )}
                
                {historyRecord.cashback_earned && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                    <Award size={16} style={{ color: 'var(--success-text)' }} />
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cashback Earned</div>
                      <div style={{ color: 'var(--success-text)', fontWeight: '600' }}>
                        {formatCurrency(historyRecord.cashback_earned)}
                      </div>
                    </div>
                  </div>
                )}
                
                <div style={{ marginTop: 'var(--spacing-md)' }}>
                  {historyRecord.transaction_id ? (
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                      <Link 
                        to={`/transactions/${historyRecord.transaction_id}`}
                        className="btn btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}
                      >
                        <Eye size={16} />
                        View Transaction
                      </Link>
                      {/* Fallback link */}
                      <Link 
                        to="/transactions"
                        className="btn btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', opacity: 0.7 }}
                      >
                        All Transactions
                      </Link>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontStyle: 'italic' }}>
                      No transaction linked
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: 'var(--spacing-xl)', 
                color: 'var(--text-muted)',
                fontStyle: 'italic'
              }}>
                This reward is not linked to any transaction
                {process.env.NODE_ENV === 'development' && (
                  <div style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
                    Debug: transaction_id={historyRecord.transaction_id}, transaction_number={historyRecord.transaction_number}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Store Details Card */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
              <Store size={20} />
              Store Information
            </h3>
          </div>
          <div style={{ padding: 'var(--spacing-lg)' }}>
            {historyRecord.store_id && historyRecord.store_name ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                  <Store size={16} style={{ color: 'var(--text-muted)' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Store Name</div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                      {historyRecord.store_name}
                    </div>
                  </div>
                </div>
                
                {historyRecord.store_phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                    <Phone size={16} style={{ color: 'var(--text-muted)' }} />
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Store Contact</div>
                      <div style={{ color: 'var(--text-secondary)' }}>
                        {historyRecord.store_phone}
                      </div>
                    </div>
                  </div>
                )}
                
                {historyRecord.store_address && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-md)' }}>
                    <MapPin size={16} style={{ color: 'var(--text-muted)', marginTop: '2px' }} />
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Address</div>
                      <div style={{ color: 'var(--text-secondary)' }}>
                        {historyRecord.store_address}
                      </div>
                    </div>
                  </div>
                )}
                
                <div style={{ marginTop: 'var(--spacing-md)' }}>
                  {historyRecord.store_id ? (
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                      <Link 
                        to={`/stores/${historyRecord.store_id}`}
                        className="btn btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}
                      >
                        <Eye size={16} />
                        View Store Profile
                      </Link>
                      {/* Fallback link */}
                      <Link 
                        to="/stores"
                        className="btn btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', opacity: 0.7 }}
                      >
                        All Stores
                      </Link>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontStyle: 'italic' }}>
                      No store linked
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: 'var(--spacing-xl)', 
                color: 'var(--text-muted)',
                fontStyle: 'italic'
              }}>
                This reward is not linked to any store
                {process.env.NODE_ENV === 'development' && (
                  <div style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
                    Debug: store_id={historyRecord.store_id}, store_name={historyRecord.store_name}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RewardHistoryDetails;