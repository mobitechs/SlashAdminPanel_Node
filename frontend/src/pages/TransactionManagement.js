// pages/TransactionManagement.js - Complete Transaction Management Frontend
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, Plus, Search, Filter, Eye, Edit2, Trash2, 
  MapPin, Star, Phone, Mail, Award, TrendingUp,
  ChevronLeft, ChevronRight, Activity, Users,
  ShoppingBag, Store, DollarSign, BarChart, 
  CheckCircle, XCircle, Clock, AlertCircle
} from 'lucide-react';
import ErrorState from '../components/common/ErrorState';
import '../styles/AdminStyles.css';

const TransactionManagement = () => {
  const navigate = useNavigate();
  
  // State management
  const [allTransactions, setAllTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);

  // API configuration
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  });

  // Fetch all transactions
  const fetchAllTransactions = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        limit: '1000',
        offset: '0'
      });

      const possibleEndpoints = [
        `${API_BASE_URL}/transactions?${params}`,
        `${API_BASE_URL}/admin/transactions?${params}`,
        `/api/transactions?${params}`,
        `/transactions?${params}`
      ];

      let lastError = null;
      let transactionData = null;

      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`🔄 Trying transactions endpoint: ${endpoint}`);
          
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: getHeaders(),
            credentials: 'include'
          });

          if (response.ok) {
            const data = await response.json();
            console.log('✅ Transactions API Response:', data);
            transactionData = data;
            break;
          } else {
            const errorText = await response.text();
            console.warn(`⚠️ Transactions endpoint ${endpoint} failed:`, response.status, errorText);
            lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        } catch (err) {
          console.warn(`⚠️ Transactions endpoint ${endpoint} error:`, err.message);
          lastError = err;
          continue;
        }
      }

      if (!transactionData) {
        throw lastError || new Error('All transactions endpoints failed');
      }

      const processedData = processTransactionsData(transactionData);
      setAllTransactions(processedData.transactions || []);
      setError(null);
      
      console.log('✅ All transactions data loaded successfully');

    } catch (error) {
      console.error('⚠️ Transactions API failed:', error.message);
      setError(error.message);
      setAllTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  // Client-side filtering logic
  const filteredTransactions = useMemo(() => {
    let filtered = [...allTransactions];

    // Apply search filter
    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(transaction => {
        return (
          (transaction.transaction_number?.toLowerCase() || '').includes(searchLower) ||
          (transaction.store_name?.toLowerCase() || '').includes(searchLower) ||
          (transaction.user_first_name?.toLowerCase() || '').includes(searchLower) ||
          (transaction.user_last_name?.toLowerCase() || '').includes(searchLower) ||
          (transaction.user_email?.toLowerCase() || '').includes(searchLower) ||
          (transaction.store_email?.toLowerCase() || '').includes(searchLower) ||
          (transaction.coupon_code?.toLowerCase() || '').includes(searchLower) ||
          (transaction.payment_status?.toLowerCase() || '').includes(searchLower)
        );
      });
    }

    return filtered;
  }, [allTransactions, searchTerm]);

  // Pagination logic
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredTransactions.slice(startIndex, endIndex);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const totalTransactions = filteredTransactions.length;

  // Process transactions data
  const processTransactionsData = (rawData) => {
    let transactions = [];
    let pagination = { total: 0, totalPages: 1, currentPage: 1, itemsPerPage: 10 };
    let stats = { totalTransactions: 0, uniqueStores: 0, uniqueUsers: 0, totalBillAmount: 0, totalFinalAmount: 0 };

    try {
      if (rawData.success && rawData.data) {
        transactions = rawData.data.transactions || rawData.data || [];
        pagination = rawData.data.pagination || rawData.pagination || pagination;
        stats = rawData.data.stats || rawData.stats || stats;
      } else if (Array.isArray(rawData)) {
        transactions = rawData;
      } else if (rawData.transactions) {
        transactions = rawData.transactions;
      }

      if (!Array.isArray(transactions)) {
        transactions = [];
      }

      if (transactions.length > 0 && stats.totalTransactions === 0) {
        stats.totalTransactions = transactions.length;
        stats.uniqueStores = new Set(transactions.map(t => t.store_id)).size;
        stats.uniqueUsers = new Set(transactions.map(t => t.user_id)).size;
        stats.totalBillAmount = transactions.reduce((sum, t) => sum + (parseFloat(t.bill_amount) || 0), 0);
        stats.totalFinalAmount = transactions.reduce((sum, t) => sum + (parseFloat(t.final_amount) || 0), 0);
      }

      return { transactions, pagination, stats };
    } catch (error) {
      console.error('Error processing transactions data:', error);
      return { transactions: [], pagination, stats };
    }
  };

  // Initial load
  useEffect(() => {
    fetchAllTransactions();
  }, [fetchAllTransactions]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Helper functions
  const formatCurrency = (amount) => {
    const num = parseFloat(amount) || 0;
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatNumber = (value) => {
    const num = parseFloat(value) || 0;
    if (num >= 10000000) return `${(num / 10000000).toFixed(1)}Cr`;
    if (num >= 100000) return `${(num / 100000).toFixed(1)}L`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const getUserInitials = (transaction) => {
    const firstName = transaction.user_first_name || '';
    const lastName = transaction.user_last_name || '';
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    return `${firstName[0] || ''}${firstName[1] || ''}`.toUpperCase() || '??';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
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
        return <CheckCircle size={14} className="text-green-500" />;
      case 'pending':
        return <Clock size={14} className="text-yellow-500" />;
      case 'failed':
        return <XCircle size={14} className="text-red-500" />;
      default:
        return <AlertCircle size={14} className="text-gray-500" />;
    }
  };

  const getPaymentStatusBadge = (status) => {
    const statusClass = {
      completed: 'success',
      pending: 'warning',
      failed: 'error',
      cancelled: 'error'
    }[status?.toLowerCase()] || 'default';

    return (
      <span className={`status-badge ${statusClass}`}>
        {getPaymentStatusIcon(status)}
        <span style={{ marginLeft: '0.25rem' }}>
          {status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown'}
        </span>
      </span>
    );
  };

  const handleRowClick = (transactionId, event) => {
    if (event.target.closest('.action-buttons')) {
      return;
    }
    navigate(`/transactions/${transactionId}`);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleDeleteTransaction = async (transactionId, transactionNumber) => {
  if (!window.confirm(`Are you sure you want to delete transaction ${transactionNumber}? This action cannot be undone.`)) {
    return;
  }

  try {
    const endpoints = [
      `${API_BASE_URL}/transactions/${transactionId}`,
      `/api/transactions/${transactionId}`
    ];

    let deleted = false;

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'DELETE',
          headers: getHeaders(),
          credentials: 'include'
        });

        if (response.ok) {
          deleted = true;
          break;
        }
      } catch (err) {
        continue;
      }
    }

    if (deleted) {
      alert('Transaction deleted successfully');
      // Refresh the transactions list
      fetchAllTransactions();
    } else {
      alert('Failed to delete transaction');
    }
  } catch (error) {
    console.error('Delete failed:', error);
    alert('Failed to delete transaction');
  }
};

  // Calculate stats from current transactions
  const currentStats = useMemo(() => {
    const totalBillAmount = allTransactions.reduce((sum, t) => sum + (parseFloat(t.bill_amount) || 0), 0);
    const totalFinalAmount = allTransactions.reduce((sum, t) => sum + (parseFloat(t.final_amount) || 0), 0);
    const uniqueStores = new Set(allTransactions.map(t => t.store_id)).size;
    const uniqueUsers = new Set(allTransactions.map(t => t.user_id)).size;
    
    return {
      totalTransactions: allTransactions.length,
      uniqueStores,
      uniqueUsers,
      totalBillAmount,
      totalFinalAmount
    };
  }, [allTransactions]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading transactions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={`Failed to load transactions: ${error}`} />;
  }

  return (
    <div className="page-container">
      {/* Stats Grid */}
      <div className="stats-grid" style={{marginBottom: 'var(--spacing-lg)'}}>
        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{formatNumber(currentStats.totalTransactions)}</div>
            <div className="stats-label">Total Transactions</div>
          </div>
          <div className="stats-icon">
            <CreditCard />
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{formatNumber(currentStats.uniqueStores)}</div>
            <div className="stats-label">Unique Stores</div>
          </div>
          <div className="stats-icon success">
            <Store />
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{formatNumber(currentStats.uniqueUsers)}</div>
            <div className="stats-label">Unique Users</div>
          </div>
          <div className="stats-icon info">
            <Users />
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{formatCurrency(currentStats.totalBillAmount)}</div>
            <div className="stats-label">Total Bill Amount</div>
          </div>
          <div className="stats-icon warning">
            <BarChart />
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{formatCurrency(currentStats.totalFinalAmount)}</div>
            <div className="stats-label">Total Final Amount</div>
          </div>
          <div className="stats-icon" style={{background: 'linear-gradient(135deg, #10b981, #059669)'}}>
            <DollarSign />
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="table-container">
        <div className="table-header">
          <div className="table-header-left">
            <h3 className="table-title">
              Transactions ({totalTransactions.toLocaleString()})
            </h3>
            <div className="table-search">
              <Search className="search-input-icon" />
              <input
                type="text"
                placeholder="Search by transaction number, store, user, email, coupon..."
                className="table-search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="table-actions">
            <button 
              className="add-user-btn"
              onClick={() => navigate('/transactions/add')}
            >
              <Plus size={16} />
              Add Transaction
            </button>
          </div>
        </div>

        {paginatedTransactions.length === 0 ? (
          <div className="empty-state">
            <CreditCard className="empty-state-icon" />
            <h3 className="empty-state-title">No transactions found</h3>
            <p className="empty-state-description">
              {searchTerm 
                ? 'Try adjusting your search criteria'
                : 'No transactions found'
              }
            </p>
          </div>
        ) : (
          <div className="table-scroll-container">
            <table className="data-table">
              <thead className="table-sticky-header">
                <tr>
                  <th style={{width: '140px', padding: 'var(--spacing-lg)'}}>Transaction #</th>
                  <th style={{padding: 'var(--spacing-lg)'}}>Store Details</th>
                  <th style={{padding: 'var(--spacing-lg)'}}>User Details</th>
                  <th style={{width: '140px', padding: 'var(--spacing-lg)'}}>Bill Amount</th>
                  <th style={{width: '140px', padding: 'var(--spacing-lg)'}}>Discounts</th>
                  <th style={{width: '140px', padding: 'var(--spacing-lg)'}}>Coupon</th>
                  <th style={{width: '140px', padding: 'var(--spacing-lg)'}}>Final Amount</th>
                  <th style={{width: '120px', padding: 'var(--spacing-lg)'}}>Payment</th>
                  <th style={{width: '110px', padding: 'var(--spacing-lg)'}}>Date</th>
                  <th style={{width: '140px', textAlign: 'center', padding: 'var(--spacing-lg)'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.map((transaction) => (
                  <tr 
                    key={transaction.id} 
                    style={{height: '64px', cursor: 'pointer'}}
                    onClick={(e) => handleRowClick(transaction.id, e)}
                    className="user-row-clickable"
                  >
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <div style={{fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)'}}>
                        {transaction.transaction_number}
                      </div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-secondary)'}}>
                        #{transaction.id}
                      </div>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <div style={{fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.25rem'}}>
                        {transaction.store_name}
                      </div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.125rem'}}>
                        <Phone size={10} />
                        {transaction.store_phone}
                      </div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                        <Mail size={10} />
                        <span style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px'}}>
                          {transaction.store_email}
                        </span>
                      </div>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <div className="user-cell">
                        <div className="user-avatar">
                          {getUserInitials(transaction)}
                        </div>
                        <div>
                          <div className="user-name">
                            {transaction.user_first_name} {transaction.user_last_name}
                          </div>
                          <div style={{fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.125rem'}}>
                            {transaction.user_email}
                          </div>
                          <div style={{fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                            <Phone size={10} />
                            {transaction.user_phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <div style={{fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)'}}>
                        {formatCurrency(transaction.bill_amount)}
                      </div>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <div style={{fontSize: '0.75rem'}}>
                        <div style={{marginBottom: '0.25rem', color: 'var(--text-secondary)'}}>
                          Vendor: {formatCurrency(transaction.vendor_discount)}
                        </div>
                        <div style={{color: 'var(--success-text)'}}>
                          Cashback: {formatCurrency(transaction.cashback_used)}
                        </div>
                      </div>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      {transaction.coupon_code ? (
                        <div style={{fontSize: '0.75rem'}}>
                          <div style={{fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem'}}>
                            {transaction.coupon_code}
                          </div>
                          <div style={{color: 'var(--text-secondary)', marginBottom: '0.125rem'}}>
                            ID: {transaction.coupon_id}
                          </div>
                          <div style={{color: 'var(--success-text)'}}>
                            {formatCurrency(transaction.coupon_discount)}
                          </div>
                        </div>
                      ) : (
                        <span style={{fontSize: '0.75rem', color: 'var(--text-disabled)'}}>
                          No coupon
                        </span>
                      )}
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <div className="cashback-amount success" style={{fontSize: '0.875rem', fontWeight: '600'}}>
                        {formatCurrency(transaction.final_amount)}
                      </div>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <div style={{fontSize: '0.75rem'}}>
                        {getPaymentStatusBadge(transaction.payment_status)}
                        <div style={{color: 'var(--text-secondary)', marginTop: '0.25rem', textTransform: 'capitalize'}}>
                          {transaction.payment_method}
                        </div>
                      </div>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <span className="date-cell">{formatDate(transaction.created_at)}</span>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)', textAlign: 'center'}}>
                      <div className="action-buttons">
                        <button 
                          className="action-btn view"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/transactions/${transaction.id}`);
                          }}
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          className="action-btn edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/transactions/${transaction.id}/edit`);
                          }}
                          title="Edit Transaction"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          className="action-btn delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTransaction(transaction.id, transaction.transaction_number);
                          }}
                          title="Delete Transaction"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>l̥
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="pagination-container">
          <div className="pagination-info">
            <span>
              Showing {Math.min(((currentPage - 1) * itemsPerPage) + 1, totalTransactions)} to {Math.min(currentPage * itemsPerPage, totalTransactions)} of {totalTransactions} transactions
            </span>
          </div>
          <div className="pagination-controls">
            <button 
              className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
            </button>
            
            {totalPages > 1 ? (
              [...Array(Math.min(5, totalPages))].map((_, index) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = index + 1;
                } else if (currentPage <= 3) {
                  pageNum = index + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + index;
                } else {
                  pageNum = currentPage - 2 + index;
                }
                
                return (
                  <button 
                    key={pageNum}
                    className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })
            ) : (
              <button className="pagination-btn active">
                1
              </button>
            )}
            
            <button 
              className={`pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div style={{height: '16px'}}></div>
    </div>
  );
};

export default TransactionManagement;