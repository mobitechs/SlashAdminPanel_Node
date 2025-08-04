// pages/TransactionDetails.js - Transaction Details View (Updated to match UserDetails layout)
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Edit, Trash2, Mail, Phone, MapPin, Calendar,
  CreditCard, Star, Clock, CheckCircle, DollarSign, TrendingUp, Wallet,
  Gift, Activity, Home, ChevronRight, Eye, Award,
  Users, Percent, QrCode, Globe, AlertCircle, Building, Store,
  XCircle, Tag, Receipt, ArrowRight, User, BarChart
} from 'lucide-react';
import ErrorState from '../components/common/ErrorState';
import '../styles/AdminStyles.css';

const TransactionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState(null);
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

  // Fetch transaction details
  const fetchTransactionDetails = async () => {
    try {
      setError(null);
      console.log(`🔄 Fetching transaction details for ID: ${id}`);
      
      const possibleEndpoints = [
        `${API_BASE_URL}/transactions/${id}`,
        `/api/transactions/${id}`,
        `/transactions/${id}`
      ];

      let lastError = null;
      let transactionData = null;

      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`🔄 Trying transaction details endpoint: ${endpoint}`);
          
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: getHeaders(),
            credentials: 'include'
          });

          console.log(`📡 Transaction details response status: ${response.status}`);

          if (response.ok) {
            transactionData = await response.json();
            console.log('✅ Transaction details fetched successfully');
            break;
          } else {
            const errorText = await response.text();
            lastError = new Error(`HTTP ${response.status}: ${errorText}`);
          }
        } catch (err) {
          console.warn(`⚠️ Transaction details endpoint ${endpoint} error:`, err.message);
          lastError = err;
          continue;
        }
      }

      if (!transactionData) {
        throw lastError || new Error('Transaction not found');
      }

      const processedTransaction = processTransactionData(transactionData);
      if (!processedTransaction.id) {
        throw new Error(`Invalid transaction data received for ID: ${id}`);
      }
      
      setTransaction(processedTransaction);
      console.log('✅ Transaction details loaded successfully:', processedTransaction);

    } catch (error) {
      console.error(`❌ Failed to fetch transaction ${id}:`, error.message);
      setError(error.message);
      setTransaction(null);
    } finally {
      setLoading(false);
    }
  };

  // Process transaction data from API response
  const processTransactionData = (rawData) => {
    try {
      console.log('🔍 Processing raw API data:', rawData);
      
      let transactionData = null;
      
      if (rawData.success && rawData.data) {
        transactionData = rawData.data.transaction || rawData.data;
      } else if (rawData.transaction) {
        transactionData = rawData.transaction;
      } else if (rawData.id) {
        transactionData = rawData;
      } else {
        console.error('❌ Unrecognized API response structure:', rawData);
        throw new Error('Invalid API response format - no transaction data found');
      }

      console.log('🔍 Extracted transaction data:', transactionData);

      if (!transactionData) {
        throw new Error('Transaction data is null or undefined');
      }

      if (!transactionData.id) {
        console.error('❌ Transaction data missing ID field:', transactionData);
        throw new Error('Transaction data missing required ID field');
      }

      if (transactionData.id != id) {
        throw new Error(`Transaction ID mismatch: expected ${id}, got ${transactionData.id}`);
      }

      return transactionData;
      
    } catch (error) {
      console.error('❌ Error processing transaction data:', error);
      throw error;
    }
  };

  // Load transaction data on component mount
  useEffect(() => {
    fetchTransactionDetails();
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

  const getPaymentStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'pending':
        return <Clock size={16} className="text-yellow-500" />;
      case 'failed':
        return <XCircle size={16} className="text-red-500" />;
      default:
        return <AlertCircle size={16} className="text-gray-500" />;
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'var(--success-text)';
      case 'pending':
        return '#f59e0b';
      case 'failed':
        return 'var(--error-text)';
      default:
        return 'var(--text-muted)';
    }
  };

  // Navigation handlers
  const handleEdit = () => {
    navigate(`/transactions/${id}/edit`);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      // TODO: Implement delete functionality
      console.log('Delete transaction:', id);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading Transaction #{id}...</p>
        </div>
      </div>
    );
  }

  // Show error state if API failed and no transaction data
  if (error && !transaction) {
    return (
      <div className="page-container">
        <div className="chart-card">
          <ErrorState
            title="Failed to Load Transaction"
            message={error}
            onRetry={fetchTransactionDetails}
            backTo="/transactions"
            backText="Back to Transactions List"
            debugInfo={{
              "Transaction ID": id,
              "API Base URL": API_BASE_URL,
              "Expected Endpoint": `${API_BASE_URL}/transactions/${id}`,
              "Error": error
            }}
          />
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="page-container">
        <ErrorState
          title="Transaction not found"
          message={`Transaction #${id} does not exist in the database`}
          showRetry={false}
          backTo="/transactions"
          backText="Back to Transactions"
          showDebugInfo={false}
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header with Transaction Icon, Transaction ID, Number, and Action Buttons */}
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
          <CreditCard size={24} style={{color: 'var(--text-muted)'}} />
          #{transaction.transaction_number}
          <span style={{
            fontSize: '0.875rem',
            color: 'var(--text-muted)',
            fontWeight: '400',
            marginLeft: 'var(--spacing-sm)'
          }}>
            • ID: {transaction.id}
          </span>
        </h1>
        
        <div style={{display: 'flex', gap: 'var(--spacing-md)'}}>
          <button className="btn btn-secondary" onClick={handleEdit}>
            <Edit size={16} />
            Edit Transaction
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

      {/* Transaction Stats */}
      <div className="stats-grid" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 'var(--spacing-xl)'}}>
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Bill Amount</h3>
              <div className="stat-value">{formatCurrency(transaction.bill_amount)}</div>
              <p className="stat-subtitle">Original amount</p>
            </div>
            <div className="stat-icon" style={{background: 'var(--gradient-blue)'}}>
              <Receipt />
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Total Discounts</h3>
              <div className="stat-value">
                {formatCurrency((parseFloat(transaction.vendor_discount) || 0) + (parseFloat(transaction.coupon_discount) || 0))}
              </div>
              <p className="stat-subtitle">Vendor + Coupon</p>
            </div>
            <div className="stat-icon" style={{background: 'var(--gradient-orange)'}}>
              <Tag />
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Cashback Used</h3>
              <div className="stat-value">{formatCurrency(transaction.cashback_used)}</div>
              <p className="stat-subtitle">From wallet</p>
            </div>
            <div className="stat-icon" style={{background: 'var(--gradient-purple)'}}>
              <Wallet />
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <h3>Final Amount</h3>
              <div className="stat-value">{formatCurrency(transaction.final_amount)}</div>
              <p className="stat-subtitle">Amount paid</p>
            </div>
            <div className="stat-icon" style={{background: 'var(--gradient-green)'}}>
              <DollarSign />
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
            <CreditCard size={16} />
            Transaction Details
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
              {/* Transaction Information */}
              <div>
                <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                  <CreditCard size={18} />
                  Transaction Information
                </h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <Receipt size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Transaction Number</div>
                      <div style={{color: 'var(--text-secondary)', fontFamily: 'monospace'}}>{transaction.transaction_number}</div>
                    </div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <Activity size={16} style={{color: getPaymentStatusColor(transaction.payment_status)}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Payment Status</div>
                      <div style={{color: getPaymentStatusColor(transaction.payment_status), display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)'}}>
                        {getPaymentStatusIcon(transaction.payment_status)}
                        <span style={{textTransform: 'capitalize', fontWeight: '500'}}>
                          {transaction.payment_status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <CreditCard size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Payment Method</div>
                      <div style={{color: 'var(--text-secondary)', textTransform: 'capitalize'}}>
                        {transaction.payment_method}
                      </div>
                    </div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                    <Calendar size={16} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Transaction Date</div>
                      <div style={{color: 'var(--text-secondary)'}}>{formatDateTime(transaction.created_at)}</div>
                    </div>
                  </div>
                  {transaction.comment && (
                    <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                      <Activity size={16} style={{color: 'var(--text-muted)'}} />
                      <div>
                        <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Comment</div>
                        <div style={{color: 'var(--text-secondary)'}}>{transaction.comment}</div>
                      </div>
                    </div>
                  )}
                  {transaction.updated_at && transaction.updated_at !== transaction.created_at && (
                    <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                      <Clock size={16} style={{color: 'var(--text-muted)'}} />
                      <div>
                        <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Last Updated</div>
                        <div style={{color: 'var(--text-secondary)'}}>{formatDateTime(transaction.updated_at)}</div>
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
                          to={`/stores/${transaction.store_id}`}
                          style={{color: 'var(--primary-color)', textDecoration: 'none'}}
                        >
                          {transaction.store_name}
                        </Link>
                      </div>
                    </div>
                  </div>
                  {transaction.store_phone && (
                    <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                      <Phone size={16} style={{color: 'var(--text-muted)'}} />
                      <div>
                        <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Store Phone</div>
                        <div style={{color: 'var(--text-secondary)'}}>{transaction.store_phone}</div>
                      </div>
                    </div>
                  )}
                  {transaction.store_email && (
                    <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                      <Mail size={16} style={{color: 'var(--text-muted)'}} />
                      <div>
                        <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Store Email</div>
                        <div style={{color: 'var(--text-secondary)'}}>{transaction.store_email}</div>
                      </div>
                    </div>
                  )}
                  {transaction.store_address && (
                    <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                      <MapPin size={16} style={{color: 'var(--text-muted)'}} />
                      <div>
                        <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Store Address</div>
                        <div style={{color: 'var(--text-secondary)'}}>{transaction.store_address}</div>
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
                          to={`/users/${transaction.user_id}`}
                          style={{color: 'var(--primary-color)', textDecoration: 'none'}}
                        >
                          {transaction.user_first_name} {transaction.user_last_name}
                        </Link>
                      </div>
                    </div>
                  </div>
                  {transaction.user_email && (
                    <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                      <Mail size={16} style={{color: 'var(--text-muted)'}} />
                      <div>
                        <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Email</div>
                        <div style={{color: 'var(--text-secondary)'}}>{transaction.user_email}</div>
                      </div>
                    </div>
                  )}
                  {transaction.user_phone && (
                    <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                      <Phone size={16} style={{color: 'var(--text-muted)'}} />
                      <div>
                        <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Phone</div>
                        <div style={{color: 'var(--text-secondary)'}}>{transaction.user_phone}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Coupon Information */}
              {transaction.coupon_code && (
                <div>
                  <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                    <Gift size={18} />
                    Coupon Applied
                  </h3>
                  <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                      <Tag size={16} style={{color: 'var(--text-muted)'}} />
                      <div>
                        <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Coupon Code</div>
                        <div style={{color: 'var(--text-secondary)', fontWeight: '600', fontFamily: 'monospace'}}>
                          {transaction.coupon_code}
                        </div>
                      </div>
                    </div>
                    {transaction.coupon_title && (
                      <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                        <Gift size={16} style={{color: 'var(--text-muted)'}} />
                        <div>
                          <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Coupon Title</div>
                          <div style={{color: 'var(--text-secondary)'}}>{transaction.coupon_title}</div>
                        </div>
                      </div>
                    )}
                    {transaction.coupon_id && (
                      <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                        <Receipt size={16} style={{color: 'var(--text-muted)'}} />
                        <div>
                          <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Coupon ID</div>
                          <div style={{color: 'var(--text-secondary)'}}>{transaction.coupon_id}</div>
                        </div>
                      </div>
                    )}
                    <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)'}}>
                      <DollarSign size={16} style={{color: 'var(--success-text)'}} />
                      <div>
                        <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Discount Amount</div>
                        <div style={{color: 'var(--success-text)', fontWeight: '600'}}>
                          {formatCurrency(transaction.coupon_discount)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'breakdown' && (
            <div>
              <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)'}}>
                Payment Breakdown
              </h3>
              
              <div style={{maxWidth: '600px'}}>
                {/* Bill Amount */}
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--spacing-md)', borderBottom: '1px solid var(--border-glass)'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                    <Receipt size={16} style={{color: 'var(--text-muted)'}} />
                    <span style={{fontWeight: '500', color: 'var(--text-primary)'}}>Original Bill Amount</span>
                  </div>
                  <span style={{fontWeight: '600', color: 'var(--text-primary)', fontSize: '1.125rem'}}>
                    {formatCurrency(transaction.bill_amount)}
                  </span>
                </div>

                {/* Vendor Discount */}
                {parseFloat(transaction.vendor_discount) > 0 && (
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--spacing-md)', borderBottom: '1px solid var(--border-glass)'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                      <Tag size={16} style={{color: 'var(--text-muted)'}} />
                      <span style={{color: 'var(--text-secondary)'}}>Store Discount</span>
                    </div>
                    <span style={{color: 'var(--error-text)', fontWeight: '500'}}>
                      - {formatCurrency(transaction.vendor_discount)}
                    </span>
                  </div>
                )}

                {/* Coupon Discount */}
                {parseFloat(transaction.coupon_discount) > 0 && (
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--spacing-md)', borderBottom: '1px solid var(--border-glass)'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                      <Gift size={16} style={{color: 'var(--text-muted)'}} />
                      <span style={{color: 'var(--text-secondary)'}}>Coupon Discount ({transaction.coupon_code})</span>
                    </div>
                    <span style={{color: 'var(--error-text)', fontWeight: '500'}}>
                      - {formatCurrency(transaction.coupon_discount)}
                    </span>
                  </div>
                )}

                {/* Amount Before Cashback */}
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--spacing-md)', borderBottom: '1px solid var(--border-glass)', background: 'var(--bg-glass-hover)'}}>
                  <span style={{fontWeight: '500', color: 'var(--text-primary)'}}>Amount After Discounts</span>
                  <span style={{fontWeight: '600', color: 'var(--text-primary)'}}>
                    {formatCurrency(
                      parseFloat(transaction.bill_amount) - 
                      parseFloat(transaction.vendor_discount || 0) - 
                      parseFloat(transaction.coupon_discount || 0)
                    )}
                  </span>
                </div>

                {/* Cashback Used */}
                {parseFloat(transaction.cashback_used) > 0 && (
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--spacing-md)', borderBottom: '1px solid var(--border-glass)'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                      <Wallet size={16} style={{color: 'var(--text-muted)'}} />
                      <span style={{color: 'var(--text-secondary)'}}>Cashback Used</span>
                    </div>
                    <span style={{color: 'var(--error-text)', fontWeight: '500'}}>
                      - {formatCurrency(transaction.cashback_used)}
                    </span>
                  </div>
                )}

                {/* Final Amount */}
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--spacing-md)', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', marginTop: 'var(--spacing-sm)'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                    <DollarSign size={18} style={{color: 'var(--success-text)'}} />
                    <span style={{fontWeight: '700', color: 'var(--text-primary)', fontSize: '1.125rem'}}>Final Amount Paid</span>
                  </div>
                  <span style={{fontWeight: '700', color: 'var(--success-text)', fontSize: '1.5rem'}}>
                    {formatCurrency(transaction.final_amount)}
                  </span>
                </div>

                {/* Savings Summary */}
                <div style={{marginTop: 'var(--spacing-lg)', padding: 'var(--spacing-md)', background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(21, 128, 61, 0.1))', borderRadius: 'var(--radius-md)', border: '1px solid rgba(34, 197, 94, 0.3)'}}>
                  <h4 style={{color: 'var(--success-text)', marginBottom: 'var(--spacing-sm)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)'}}>
                    <TrendingUp size={16} />
                    Total Savings
                  </h4>
                  <div style={{fontSize: '1.25rem', fontWeight: '700', color: 'var(--success-text)'}}>
                    {formatCurrency(
                      parseFloat(transaction.bill_amount) - parseFloat(transaction.final_amount)
                    )}
                  </div>
                  <div style={{fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem'}}>
                    You saved {(((parseFloat(transaction.bill_amount) - parseFloat(transaction.final_amount)) / parseFloat(transaction.bill_amount)) * 100).toFixed(1)}% on this transaction
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

export default TransactionDetails;