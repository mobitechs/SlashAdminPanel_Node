// pages/SettlementDetails.js - Settlement Details View (Updated)
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Edit, Trash2, Mail, Phone, MapPin, Calendar,
  Calculator, Star, Clock, CheckCircle, DollarSign, TrendingUp, Building,
  Activity, Home, ChevronRight, Eye, Award,
  Users, Percent, CreditCard, Globe, AlertCircle, Store,
  XCircle, Tag, Receipt, ArrowRight, User, BarChart, FileText, List
} from 'lucide-react';
import ErrorState from '../components/common/ErrorState';
import '../styles/AdminStyles.css';

const SettlementDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [settlement, setSettlement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

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

  // Fetch settlement details
  const fetchSettlementDetails = async () => {
    try {
      setError(null);
      console.log(`🔄 Fetching settlement details for ID: ${id}`);
      
      const possibleEndpoints = [
        `${API_BASE_URL}/settlements/${id}`,
        `/api/settlements/${id}`,
        `/settlements/${id}`
      ];

      let lastError = null;
      let settlementData = null;

      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`🔄 Trying settlement details endpoint: ${endpoint}`);
          
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: getHeaders(),
            credentials: 'include'
          });

          console.log(`📡 Settlement details response status: ${response.status}`);

          if (response.ok) {
            settlementData = await response.json();
            console.log('✅ Settlement details fetched successfully');
            break;
          } else {
            const errorText = await response.text();
            lastError = new Error(`HTTP ${response.status}: ${errorText}`);
          }
        } catch (err) {
          console.warn(`⚠️ Settlement details endpoint ${endpoint} error:`, err.message);
          lastError = err;
          continue;
        }
      }

      if (!settlementData) {
        throw lastError || new Error('Settlement not found');
      }

      const processedSettlement = processSettlementData(settlementData);
      if (!processedSettlement.settlement_id) {
        throw new Error(`Invalid settlement data received for ID: ${id}`);
      }
      
      setSettlement(processedSettlement);
      console.log('✅ Settlement details loaded successfully:', processedSettlement);

    } catch (error) {
      console.error(`❌ Failed to fetch settlement ${id}:`, error.message);
      setError(error.message);
      setSettlement(null);
    } finally {
      setLoading(false);
    }
  };

  // Process settlement data from API response
  const processSettlementData = (rawData) => {
    try {
      console.log('🔍 Processing raw API data:', rawData);
      
      let settlementData = null;
      
      if (rawData.success && rawData.data) {
        settlementData = rawData.data.settlement || rawData.data;
      } else if (rawData.settlement) {
        settlementData = rawData.settlement;
      } else if (rawData.settlement_id) {
        settlementData = rawData;
      } else {
        console.error('❌ Unrecognized API response structure:', rawData);
        throw new Error('Invalid API response format - no settlement data found');
      }

      console.log('🔍 Extracted settlement data:', settlementData);

      if (!settlementData) {
        throw new Error('Settlement data is null or undefined');
      }

      if (!settlementData.settlement_id) {
        console.error('❌ Settlement data missing ID field:', settlementData);
        throw new Error('Settlement data missing required ID field');
      }

      if (settlementData.settlement_id != id) {
        throw new Error(`Settlement ID mismatch: expected ${id}, got ${settlementData.settlement_id}`);
      }

      return settlementData;
      
    } catch (error) {
      console.error('❌ Error processing settlement data:', error);
      throw error;
    }
  };

  // Load settlement data on component mount
  useEffect(() => {
    fetchSettlementDetails();
  }, [id]);

  // Helper functions
  const formatCurrency = (amount) => {
    const num = parseFloat(amount) || 0;
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getSettlementStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'pending':
        return <Clock size={16} className="text-yellow-500" />;
      case 'processing':
        return <Activity size={16} className="text-blue-500" />;
      case 'failed':
        return <XCircle size={16} className="text-red-500" />;
      default:
        return <AlertCircle size={16} className="text-gray-500" />;
    }
  };

  const getSettlementStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'var(--success-text)';
      case 'pending':
        return '#f59e0b';
      case 'processing':
        return '#3b82f6';
      case 'failed':
        return 'var(--error-text)';
      default:
        return 'var(--text-muted)';
    }
  };

  // Navigation handlers
  const handleEdit = () => {
    navigate(`/settlements/${id}/edit`);
  };

  const handleShowAllSettlements = () => {
    if (settlement?.store_id) {
      navigate(`/settlements/store/${settlement.store_id}`);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this settlement?')) {
      // TODO: Implement delete functionality
      console.log('Delete settlement:', id);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading Settlement #{id}...</p>
        </div>
      </div>
    );
  }

  // Show error state if API failed and no settlement data
  if (error && !settlement) {
    return (
      <div className="page-container">
        <div className="chart-card">
          <ErrorState
            title="Failed to Load Settlement"
            message={error}
            onRetry={fetchSettlementDetails}
            backTo="/settlements"
            backText="Back to Settlements List"
            debugInfo={{
              "Settlement ID": id,
              "API Base URL": API_BASE_URL,
              "Expected Endpoint": `${API_BASE_URL}/settlements/${id}`,
              "Error": error
            }}
          />
        </div>
      </div>
    );
  }

  if (!settlement) {
    return (
      <div className="page-container">
        <ErrorState
          title="Settlement not found"
          message={`Settlement #${id} does not exist in the database`}
          showRetry={false}
          backTo="/settlements"
          backText="Back to Settlements"
          showDebugInfo={false}
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header with Settlement Icon, Settlement ID, and Action Buttons */}
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
        <h1 style={{
          fontSize: '1.5rem', 
          fontWeight: '600', 
          color: 'var(--text-primary)',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-sm)'
        }}>
          <Calculator size={24} style={{color: 'var(--text-muted)'}} />
          Settlement #{settlement.settlement_id}
          {settlement.transaction_id && (
            <span style={{
              fontSize: '0.875rem',
              color: 'var(--text-muted)',
              fontWeight: '400',
              marginLeft: 'var(--spacing-sm)'
            }}>
              • TXN: {settlement.transaction_id}
            </span>
          )}
        </h1>
        
        <div style={{display: 'flex', gap: 'var(--spacing-md)'}}>
          <button 
            className="btn btn-secondary" 
            onClick={handleShowAllSettlements}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)',
              background: 'var(--bg-glass-hover)',
              borderColor: 'var(--border-glass)',
              color: 'var(--text-primary)'
            }}
          >
            <List size={16} />
            Show All Settlements
          </button>
          <button className="btn btn-secondary" onClick={handleEdit}>
            <Edit size={16} />
            Edit Settlement
          </button>
          <button 
            className="btn btn-secondary"
            onClick={handleDelete}
            style={{background: 'var(--error-bg)', borderColor: 'var(--error-border)', color: 'var(--error-text)'}}
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>

      {/* Settlement Stats */}
      <div className="stats-grid" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 'var(--spacing-xl)'}}>
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Settlement Amount</h3>
              <div className="stat-value">{formatCurrency(settlement.settlement_amount)}</div>
              <p className="stat-subtitle">Total to settle</p>
            </div>
            <div className="stat-icon" style={{background: 'var(--gradient-blue)'}}>
              <DollarSign />
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Commission</h3>
              <div className="stat-value">{formatCurrency(settlement.commission_amount)}</div>
              <p className="stat-subtitle">{settlement.commission_percentage}% of bill</p>
            </div>
            <div className="stat-icon" style={{background: 'var(--gradient-orange)'}}>
              <Percent />
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Settled Amount</h3>
              <div className="stat-value">{formatCurrency(settlement.settled_amount)}</div>
              <p className="stat-subtitle">Amount paid</p>
            </div>
            <div className="stat-icon" style={{background: 'var(--gradient-green)'}}>
              <CheckCircle />
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Pending Amount</h3>
              <div className="stat-value">{formatCurrency(settlement.pending_amount)}</div>
              <p className="stat-subtitle">Yet to pay</p>
            </div>
            <div className="stat-icon" style={{background: 'var(--gradient-purple)'}}>
              <Clock />
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Net Settlement</h3>
              <div className="stat-value">{formatCurrency(settlement.net_settlement_amount)}</div>
              <p className="stat-subtitle">After deductions</p>
            </div>
            <div className="stat-icon" style={{background: 'var(--gradient-emerald)'}}>
              <Calculator />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="chart-card">
        <div style={{display: 'flex', borderBottom: '1px solid var(--border-glass)', marginBottom: 'var(--spacing-lg)'}}>
          <button 
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
            style={{
              padding: 'var(--spacing-md) var(--spacing-lg)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'overview' ? '2px solid var(--text-primary)' : '2px solid transparent',
              color: activeTab === 'overview' ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            <Calculator size={16} />
            Settlement Details
          </button>
          <button 
            className={`tab-button ${activeTab === 'breakdown' ? 'active' : ''}`}
            onClick={() => setActiveTab('breakdown')}
            style={{
              padding: 'var(--spacing-md) var(--spacing-lg)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'breakdown' ? '2px solid var(--text-primary)' : '2px solid transparent',
              color: activeTab === 'breakdown' ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            <BarChart size={16} />
            Amount Breakdown
          </button>
        </div>

        <div style={{padding: 'var(--spacing-lg)'}}>
          {activeTab === 'overview' && (
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-xl)'}}>
              {/* Settlement Information */}
              <div>
                <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                  <Calculator size={18} />
                  Settlement Information
                </h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <Receipt size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Settlement ID</div>
                      <div style={{color: 'var(--text-secondary)', fontFamily: 'monospace'}}>{settlement.settlement_id}</div>
                    </div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <Activity size={16} style={{color: getSettlementStatusColor(settlement.settlement_status)}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Settlement Status</div>
                      <div style={{color: getSettlementStatusColor(settlement.settlement_status), display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)'}}>
                        {getSettlementStatusIcon(settlement.settlement_status)}
                        <span style={{textTransform: 'capitalize', fontWeight: '500'}}>
                          {settlement.settlement_status}
                        </span>
                      </div>
                    </div>
                  </div>
                  {settlement.payment_method && (
                    <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                      <CreditCard size={16} style={{color: 'var(--text-muted)'}} />
                      <div>
                        <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Payment Method</div>
                        <div style={{color: 'var(--text-secondary)', textTransform: 'capitalize'}}>
                          {settlement.payment_method}
                        </div>
                      </div>
                    </div>
                  )}
                  {settlement.payment_reference && (
                    <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                      <FileText size={16} style={{color: 'var(--text-muted)'}} />
                      <div>
                        <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Payment Reference</div>
                        <div style={{color: 'var(--text-secondary)', fontFamily: 'monospace'}}>{settlement.payment_reference}</div>
                      </div>
                    </div>
                  )}
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <Calendar size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Created Date</div>
                      <div style={{color: 'var(--text-secondary)'}}>{formatDateTime(settlement.created_at)}</div>
                    </div>
                  </div>
                  {settlement.settlement_date && (
                    <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                      <CheckCircle size={16} style={{color: 'var(--success-text)'}} />
                      <div>
                        <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Settlement Date</div>
                        <div style={{color: 'var(--success-text)'}}>{formatDateTime(settlement.settlement_date)}</div>
                      </div>
                    </div>
                  )}
                  {settlement.comments && (
                    <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                      <Activity size={16} style={{color: 'var(--text-muted)'}} />
                      <div>
                        <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Comments</div>
                        <div style={{color: 'var(--text-secondary)'}}>{settlement.comments}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Store Information */}
              <div>
                <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                  <Store size={18} />
                  Store Details
                </h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <Store size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Store Name</div>
                      <div style={{color: 'var(--text-secondary)', fontWeight: '500'}}>
                        <Link 
                          to={`/stores/${settlement.store_id}`}
                          style={{color: 'var(--primary-color)', textDecoration: 'none'}}
                        >
                          {settlement.store_name}
                        </Link>
                      </div>
                    </div>
                  </div>
                  {settlement.store_phone && (
                    <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                      <Phone size={16} style={{color: 'var(--text-muted)'}} />
                      <div>
                        <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Store Phone</div>
                        <div style={{color: 'var(--text-secondary)'}}>{settlement.store_phone}</div>
                      </div>
                    </div>
                  )}
                  {settlement.store_email && (
                    <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                      <Mail size={16} style={{color: 'var(--text-muted)'}} />
                      <div>
                        <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Store Email</div>
                        <div style={{color: 'var(--text-secondary)'}}>{settlement.store_email}</div>
                      </div>
                    </div>
                  )}
                  {settlement.bank_account && (
                    <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                      <Building size={16} style={{color: 'var(--text-muted)'}} />
                      <div>
                        <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Bank Account</div>
                        <div style={{color: 'var(--text-secondary)', fontFamily: 'monospace'}}>{settlement.bank_account}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* User Information */}
              <div>
                <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                  <User size={18} />
                  Customer Details
                </h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <User size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Customer Name</div>
                      <div style={{color: 'var(--text-secondary)', fontWeight: '500'}}>
                        <Link 
                          to={`/users/${settlement.user_id}`}
                          style={{color: 'var(--primary-color)', textDecoration: 'none'}}
                        >
                          {settlement.user_first_name} {settlement.user_last_name}
                        </Link>
                      </div>
                    </div>
                  </div>
                  {settlement.user_email && (
                    <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                      <Mail size={16} style={{color: 'var(--text-muted)'}} />
                      <div>
                        <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Email</div>
                        <div style={{color: 'var(--text-secondary)'}}>{settlement.user_email}</div>
                      </div>
                    </div>
                  )}
                  {settlement.user_phone && (
                    <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                      <Phone size={16} style={{color: 'var(--text-muted)'}} />
                      <div>
                        <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Phone</div>
                        <div style={{color: 'var(--text-secondary)'}}>{settlement.user_phone}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Processing Information */}
              {settlement.processed_by && (
                <div>
                  <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                    <Users size={18} />
                    Processing Details
                  </h3>
                  <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                      <User size={16} style={{color: 'var(--text-muted)'}} />
                      <div>
                        <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Processed By</div>
                        <div style={{color: 'var(--text-secondary)', fontWeight: '500'}}>
                          {settlement.processed_by}
                        </div>
                      </div>
                    </div>
                    {settlement.processed_at && (
                      <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                        <Clock size={16} style={{color: 'var(--text-muted)'}} />
                        <div>
                          <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Processed At</div>
                          <div style={{color: 'var(--text-secondary)'}}>{formatDateTime(settlement.processed_at)}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'breakdown' && (
            <div>
              <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)'}}>
                Settlement Breakdown
              </h3>
              
              <div style={{maxWidth: '600px'}}>
                {/* Bill Amount */}
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--spacing-md)', borderBottom: '1px solid var(--border-glass)'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                    <Receipt size={16} style={{color: 'var(--text-muted)'}} />
                    <span style={{fontWeight: '500', color: 'var(--text-primary)'}}>Original Bill Amount</span>
                  </div>
                  <span style={{fontWeight: '600', color: 'var(--text-primary)', fontSize: '1.125rem'}}>
                    {formatCurrency(settlement.bill_amount)}
                  </span>
                </div>

                {/* Commission */}
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--spacing-md)', borderBottom: '1px solid var(--border-glass)'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                    <Percent size={16} style={{color: 'var(--text-muted)'}} />
                    <span style={{color: 'var(--text-secondary)'}}>Commission ({settlement.commission_percentage}%)</span>
                  </div>
                  <span style={{color: 'var(--text-primary)', fontWeight: '600'}}>
                    {formatCurrency(settlement.commission_amount)}
                  </span>
                </div>

                {/* Tax Amount */}
                {parseFloat(settlement.tax_amount) > 0 && (
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--spacing-md)', borderBottom: '1px solid var(--border-glass)'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                      <Tag size={16} style={{color: 'var(--text-muted)'}} />
                      <span style={{color: 'var(--text-secondary)'}}>Tax Amount</span>
                    </div>
                    <span style={{color: 'var(--error-text)', fontWeight: '500'}}>
                      - {formatCurrency(settlement.tax_amount)}
                    </span>
                  </div>
                )}

                {/* Processing Fee */}
                {parseFloat(settlement.processing_fee) > 0 && (
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--spacing-md)', borderBottom: '1px solid var(--border-glass)'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                      <CreditCard size={16} style={{color: 'var(--text-muted)'}} />
                      <span style={{color: 'var(--text-secondary)'}}>Processing Fee</span>
                    </div>
                    <span style={{color: 'var(--error-text)', fontWeight: '500'}}>
                      - {formatCurrency(settlement.processing_fee)}
                    </span>
                  </div>
                )}

                {/* Settlement Amount */}
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--spacing-md)', borderBottom: '1px solid var(--border-glass)', background: 'var(--bg-glass-hover)'}}>
                  <span style={{fontWeight: '500', color: 'var(--text-primary)'}}>Settlement Amount</span>
                  <span style={{fontWeight: '600', color: 'var(--text-primary)'}}>
                    {formatCurrency(settlement.settlement_amount)}
                  </span>
                </div>

                {/* Net Settlement Amount */}
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--spacing-md)', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', marginTop: 'var(--spacing-sm)'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                    <Calculator size={18} style={{color: 'var(--success-text)'}} />
                    <span style={{fontWeight: '700', color: 'var(--text-primary)', fontSize: '1.125rem'}}>Net Settlement Amount</span>
                  </div>
                  <span style={{fontWeight: '700', color: 'var(--success-text)', fontSize: '1.5rem'}}>
                    {formatCurrency(settlement.net_settlement_amount)}
                  </span>
                </div>

                {/* Settlement Status Summary */}
                <div style={{marginTop: 'var(--spacing-lg)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)'}}>
                  <div style={{padding: 'var(--spacing-md)', background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(21, 128, 61, 0.1))', borderRadius: 'var(--radius-md)', border: '1px solid rgba(34, 197, 94, 0.3)'}}>
                    <h4 style={{color: 'var(--success-text)', marginBottom: 'var(--spacing-sm)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                      <CheckCircle size={16} />
                      Settled Amount
                    </h4>
                    <div style={{fontSize: '1.25rem', fontWeight: '700', color: 'var(--success-text)'}}>
                      {formatCurrency(settlement.settled_amount)}
                    </div>
                  </div>

                  <div style={{padding: 'var(--spacing-md)', background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.1))', borderRadius: 'var(--radius-md)', border: '1px solid rgba(251, 191, 36, 0.3)'}}>
                    <h4 style={{color: 'var(--warning-text)', marginBottom: 'var(--spacing-sm)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                      <Clock size={16} />
                      Pending Amount
                    </h4>
                    <div style={{fontSize: '1.25rem', fontWeight: '700', color: 'var(--warning-text)'}}>
                      {formatCurrency(settlement.pending_amount)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettlementDetails;