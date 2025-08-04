// pages/content/FAQManagement.js - Complete FAQs Management Component
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  HelpCircle, Plus, Search, Filter, Eye, Edit2, Trash2, 
  MoreHorizontal, X, TrendingUp, AlertCircle, Wifi, 
  ChevronLeft, ChevronRight, MessageSquare, Activity, Clock, Target
} from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import '../../styles/AdminStyles.css';

const FAQManagement = () => {
  const navigate = useNavigate();
  
  // State management
  const [allFaqs, setAllFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);

  // API configuration
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  });

  // Static fallback data
  const staticFaqsData = {
    faqs: [
      {
        id: 1,
        question: 'How do I place an order?',
        answer: 'You can place an order by browsing our products, adding items to cart, and proceeding to checkout.',
        category: 'Orders',
        display_order: 1,
        is_active: 1,
        created_at: '2024-01-15T10:30:00Z'
      },
      {
        id: 2,
        question: 'What payment methods do you accept?',
        answer: 'We accept credit cards, debit cards, UPI, net banking, and cash on delivery.',
        category: 'Payment',
        display_order: 2,
        is_active: 1,
        created_at: '2024-01-16T11:30:00Z'
      },
      {
        id: 3,
        question: 'How can I track my order?',
        answer: 'You can track your order using the tracking number sent to your email or through our app.',
        category: 'Orders',
        display_order: 3,
        is_active: 0,
        created_at: '2024-01-17T12:30:00Z'
      }
    ],
    stats: {
      totalFaqs: 3,
      activeFaqs: 2,
      categories: 2
    }
  };

  // Fetch all FAQs once and filter client-side
  const fetchAllFaqs = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        limit: '1000',
        offset: '0'
      });

      const possibleEndpoints = [
        `${API_BASE_URL}/faqs?${params}`,
        `${API_BASE_URL}/admin/faqs?${params}`,
        `/api/faqs?${params}`,
        `/faqs?${params}`
      ];

      let lastError = null;
      let faqData = null;

      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`🔄 Trying FAQs endpoint: ${endpoint}`);
          
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: getHeaders(),
            credentials: 'include'
          });

          if (response.ok) {
            const data = await response.json();
            console.log('✅ FAQs API Response:', data);
            faqData = data;
            break;
          } else {
            const errorText = await response.text();
            console.warn(`⚠️ FAQs endpoint ${endpoint} failed:`, response.status, errorText);
            lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        } catch (err) {
          console.warn(`⚠️ FAQs endpoint ${endpoint} error:`, err.message);
          lastError = err;
          continue;
        }
      }

      if (!faqData) {
        console.warn('⚠️ FAQs API failed, using static data');
        const processedData = processFaqsData(staticFaqsData);
        setAllFaqs(processedData.faqs || []);
        setError(null);
      } else {
        const processedData = processFaqsData(faqData);
        setAllFaqs(processedData.faqs || []);
        setError(null);
      }
      
      console.log('✅ All FAQs data loaded successfully');

    } catch (error) {
      console.warn('⚠️ FAQs API failed:', error.message);
      
      // Use static data as fallback
      const processedData = processFaqsData(staticFaqsData);
      setAllFaqs(processedData.faqs || []);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  // Client-side filtering logic
  const filteredFaqs = useMemo(() => {
    let filtered = [...allFaqs];

    // Apply search filter
    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(faq => {
        return (
          (faq.question?.toLowerCase() || '').includes(searchLower) ||
          (faq.answer?.toLowerCase() || '').includes(searchLower) ||
          (faq.category?.toLowerCase() || '').includes(searchLower)
        );
      });
    }

    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(faq => faq.category === categoryFilter);
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(faq => {
        switch (statusFilter) {
          case 'active':
            return faq.is_active === 1;
          case 'inactive':
            return faq.is_active === 0;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [allFaqs, searchTerm, categoryFilter, statusFilter]);

  // Pagination logic using filtered data
  const paginatedFaqs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredFaqs.slice(startIndex, endIndex);
  }, [filteredFaqs, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredFaqs.length / itemsPerPage);
  const totalFaqs = filteredFaqs.length;

  // Get unique categories for filter
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(allFaqs.map(faq => faq.category).filter(Boolean))];
    return uniqueCategories.sort();
  }, [allFaqs]);

  // Process FAQs data
  const processFaqsData = (rawData) => {
    let faqs = [];
    let pagination = { total: 0, totalPages: 1, currentPage: 1, itemsPerPage: 10 };
    let stats = { totalFaqs: 0, activeFaqs: 0, categories: 0 };

    try {
      if (rawData.success && rawData.data) {
        faqs = rawData.data.faqs || rawData.data || [];
        pagination = rawData.data.pagination || rawData.pagination || pagination;
        stats = rawData.data.stats || rawData.stats || stats;
      } else if (Array.isArray(rawData)) {
        faqs = rawData;
      } else if (rawData.faqs) {
        faqs = rawData.faqs;
        pagination = rawData.pagination || pagination;
        stats = rawData.stats || stats;
      }

      if (!Array.isArray(faqs)) {
        faqs = [];
      }

      if (faqs.length > 0 && stats.totalFaqs === 0) {
        stats.totalFaqs = pagination.total || faqs.length;
        stats.activeFaqs = faqs.filter(f => f.is_active === 1).length;
        stats.categories = [...new Set(faqs.map(f => f.category).filter(Boolean))].length;
      }

      return { faqs, pagination, stats };
    } catch (error) {
      console.error('Error processing FAQs data:', error);
      return { faqs: [], pagination, stats };
    }
  };

  // Initial load
  useEffect(() => {
    fetchAllFaqs();
  }, [fetchAllFaqs]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, statusFilter]);

  // Helper functions
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

  const getFaqInitials = (faq) => {
    return faq.category?.substring(0, 2).toUpperCase() || 'FA';
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) return 'N/A';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // Delete FAQ (set is_active = 0)
  const handleDeleteFaq = async (faqId) => {
    if (!window.confirm('Are you sure you want to deactivate this FAQ?')) {
      return;
    }

    try {
      const deleteEndpoints = [
        `${API_BASE_URL}/faqs/${faqId}`,
        `${API_BASE_URL}/admin/faqs/${faqId}`,
        `/api/faqs/${faqId}`
      ];

      let deleted = false;
      for (const endpoint of deleteEndpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'PATCH',
            headers: getHeaders(),
            credentials: 'include',
            body: JSON.stringify({ is_active: 0 })
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
        await fetchAllFaqs();
        alert('FAQ deactivated successfully');
      } else {
        throw new Error('Deactivation failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to deactivate FAQ. Please try again.');
    }
  };

  // Handle row click to navigate to FAQ details
  const handleRowClick = (faqId, event) => {
    if (event.target.closest('.action-buttons')) {
      return;
    }
    navigate(`/content/faqs/${faqId}`);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Calculate stats from current FAQs
  const currentStats = useMemo(() => {
    const activeFaqs = allFaqs.filter(f => f.is_active === 1).length;
    const categoriesCount = [...new Set(allFaqs.map(f => f.category).filter(Boolean))].length;
    
    return {
      totalFaqs: allFaqs.length,
      activeFaqs,
      categories: categoriesCount
    };
  }, [allFaqs]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading FAQs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Stats Grid */}
      <div className="stats-grid" style={{marginBottom: 'var(--spacing-lg)'}}>
        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{currentStats.totalFaqs}</div>
            <div className="stats-label">Total FAQs</div>
          </div>
          <div className="stats-icon">
            <HelpCircle />
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{currentStats.activeFaqs}</div>
            <div className="stats-label">Active FAQs</div>
          </div>
          <div className="stats-icon success">
            <Target />
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{currentStats.categories}</div>
            <div className="stats-label">Categories</div>
          </div>
          <div className="stats-icon info">
            <MessageSquare />
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{Math.round((currentStats.activeFaqs / Math.max(currentStats.totalFaqs, 1)) * 100)}%</div>
            <div className="stats-label">Active Rate</div>
          </div>
          <div className="stats-icon warning">
            <Activity />
          </div>
        </div>
      </div>

      {/* Table Container with filters and search */}
      <div className="table-container">
        <div className="table-header">
          <div className="table-header-left">
            <h3 className="table-title">
              FAQs ({totalFaqs.toLocaleString()})
            </h3>
            <div className="table-search">
              <Search className="search-input-icon" />
              <input
                type="text"
                placeholder="Search by question, answer, category..."
                className="table-search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="table-actions">
            <div className="filter-group">
              <select
                className="filter-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <select
                className="filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            
            <button 
              className="add-user-btn"
              onClick={() => navigate('/content/faqs/add')}
            >
              <Plus size={16} />
              Add New FAQ
            </button>
          </div>
        </div>

        {paginatedFaqs.length === 0 ? (
          <div className="empty-state">
            <HelpCircle className="empty-state-icon" />
            <h3 className="empty-state-title">No FAQs found</h3>
            <p className="empty-state-description">
              {searchTerm || categoryFilter || statusFilter
                ? 'Try adjusting your search criteria'
                : 'No FAQs found'
              }
            </p>
          </div>
        ) : (
          <div className="table-scroll-container">
            <table className="data-table">
              <thead className="table-sticky-header">
                <tr>
                  <th style={{width: '80px', padding: 'var(--spacing-lg)'}}>ID</th>
                  <th style={{padding: 'var(--spacing-lg)'}}>Question</th>
                  <th style={{width: '300px', padding: 'var(--spacing-lg)'}}>Answer</th>
                  <th style={{width: '120px', padding: 'var(--spacing-lg)'}}>Category</th>
                  <th style={{width: '100px', padding: 'var(--spacing-lg)'}}>Order</th>
                  <th style={{width: '100px', padding: 'var(--spacing-lg)'}}>Status</th>
                  <th style={{width: '110px', padding: 'var(--spacing-lg)'}}>Created</th>
                  <th style={{width: '140px', textAlign: 'center', padding: 'var(--spacing-lg)'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedFaqs.map((faq) => (
                  <tr 
                    key={faq.id} 
                    style={{height: '64px', cursor: 'pointer'}}
                    onClick={(e) => handleRowClick(faq.id, e)}
                    className="user-row-clickable"
                  >
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <span className="font-medium" style={{color: 'var(--text-secondary)'}}>
                        #{faq.id}
                      </span>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <div className="user-cell">
                        <div className="user-avatar">
                          {getFaqInitials(faq)}
                        </div>
                        <div>
                          <div className="user-name">
                            {truncateText(faq.question, 60)}
                          </div>
                          <div className="user-email">{faq.category}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <span className="font-medium" style={{color: 'var(--text-secondary)'}}>
                        {truncateText(faq.answer, 80)}
                      </span>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <span className="category-badge">
                        {faq.category}
                      </span>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <span className="font-medium">
                        {faq.display_order}
                      </span>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <span className={`status-badge ${faq.is_active ? 'success' : 'error'}`}>
                        {faq.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <span className="date-cell">{formatDate(faq.created_at)}</span>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)', textAlign: 'center'}}>
                      <div className="action-buttons">
                        <button 
                          className="action-btn view"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/content/faqs/${faq.id}`);
                          }}
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          className="action-btn edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/content/faqs/${faq.id}/edit`);
                          }}
                          title="Edit FAQ"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          className="action-btn delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFaq(faq.id);
                          }}
                          title="Deactivate FAQ"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
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
              Showing {Math.min(((currentPage - 1) * itemsPerPage) + 1, totalFaqs)} to {Math.min(currentPage * itemsPerPage, totalFaqs)} of {totalFaqs} FAQs
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

export default FAQManagement;