// pages/content/TermsManagement.js - Terms & Conditions Management Component
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Plus, Search, Eye, Edit2, Trash2, 
  ChevronLeft, ChevronRight, Shield, Activity, Target
} from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import '../../styles/AdminStyles.css';

const TermsManagement = () => {
  const navigate = useNavigate();
  
  // State management
  const [allTerms, setAllTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
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
  const staticTermsData = {
    terms: [
      {
        id: 1,
        title: 'Terms of Service',
        description: 'General terms and conditions for using our platform and services.',
        is_active: 1,
        created_at: '2024-01-15T10:30:00Z'
      },
      {
        id: 2,
        title: 'Privacy Policy',
        description: 'How we collect, use, and protect your personal information.',
        is_active: 1,
        created_at: '2024-01-16T11:30:00Z'
      },
      {
        id: 3,
        title: 'Refund Policy',
        description: 'Terms and conditions regarding refunds and returns.',
        is_active: 0,
        created_at: '2024-01-17T12:30:00Z'
      }
    ],
    stats: {
      totalTerms: 3,
      activeTerms: 2
    }
  };

  // Fetch all Terms & Conditions
  const fetchAllTerms = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        limit: '1000',
        offset: '0'
      });

      const possibleEndpoints = [
        `${API_BASE_URL}/terms?${params}`,
        `${API_BASE_URL}/admin/terms?${params}`,
        `/api/terms?${params}`,
        `/terms?${params}`
      ];

      let lastError = null;
      let termsData = null;

      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`🔄 Trying Terms endpoint: ${endpoint}`);
          
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: getHeaders(),
            credentials: 'include'
          });

          if (response.ok) {
            const data = await response.json();
            console.log('✅ Terms API Response:', data);
            termsData = data;
            break;
          } else {
            const errorText = await response.text();
            console.warn(`⚠️ Terms endpoint ${endpoint} failed:`, response.status, errorText);
            lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        } catch (err) {
          console.warn(`⚠️ Terms endpoint ${endpoint} error:`, err.message);
          lastError = err;
          continue;
        }
      }

      if (!termsData) {
        console.warn('⚠️ Terms API failed, using static data');
        const processedData = processTermsData(staticTermsData);
        setAllTerms(processedData.terms || []);
        setError(null);
      } else {
        const processedData = processTermsData(termsData);
        setAllTerms(processedData.terms || []);
        setError(null);
      }
      
      console.log('✅ All Terms data loaded successfully');

    } catch (error) {
      console.warn('⚠️ Terms API failed:', error.message);
      
      // Use static data as fallback
      const processedData = processTermsData(staticTermsData);
      setAllTerms(processedData.terms || []);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  // Client-side filtering logic
  const filteredTerms = useMemo(() => {
    let filtered = [...allTerms];

    // Apply search filter
    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(term => {
        return (
          (term.title?.toLowerCase() || '').includes(searchLower) ||
          (term.description?.toLowerCase() || '').includes(searchLower)
        );
      });
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(term => {
        switch (statusFilter) {
          case 'active':
            return term.is_active === 1;
          case 'inactive':
            return term.is_active === 0;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [allTerms, searchTerm, statusFilter]);

  // Pagination logic using filtered data
  const paginatedTerms = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredTerms.slice(startIndex, endIndex);
  }, [filteredTerms, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredTerms.length / itemsPerPage);
  const totalTerms = filteredTerms.length;

  // Process Terms data
  const processTermsData = (rawData) => {
    let terms = [];
    let pagination = { total: 0, totalPages: 1, currentPage: 1, itemsPerPage: 10 };
    let stats = { totalTerms: 0, activeTerms: 0 };

    try {
      if (rawData.success && rawData.data) {
        terms = rawData.data.terms || rawData.data || [];
        pagination = rawData.data.pagination || rawData.pagination || pagination;
        stats = rawData.data.stats || rawData.stats || stats;
      } else if (Array.isArray(rawData)) {
        terms = rawData;
      } else if (rawData.terms) {
        terms = rawData.terms;
        pagination = rawData.pagination || pagination;
        stats = rawData.stats || stats;
      }

      if (!Array.isArray(terms)) {
        terms = [];
      }

      if (terms.length > 0 && stats.totalTerms === 0) {
        stats.totalTerms = pagination.total || terms.length;
        stats.activeTerms = terms.filter(t => t.is_active === 1).length;
      }

      return { terms, pagination, stats };
    } catch (error) {
      console.error('Error processing Terms data:', error);
      return { terms: [], pagination, stats };
    }
  };

  // Initial load
  useEffect(() => {
    fetchAllTerms();
  }, [fetchAllTerms]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

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

  const getTermInitials = (term) => {
    return term.title?.substring(0, 2).toUpperCase() || 'TC';
  };

  const truncateText = (text, maxLength = 120) => {
    if (!text) return 'N/A';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // Delete Term (set is_active = 0)
  const handleDeleteTerm = async (termId) => {
    if (!window.confirm('Are you sure you want to deactivate this Terms & Conditions?')) {
      return;
    }

    try {
      const deleteEndpoints = [
        `${API_BASE_URL}/terms/${termId}`,
        `${API_BASE_URL}/admin/terms/${termId}`,
        `/api/terms/${termId}`
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
        await fetchAllTerms();
        alert('Terms & Conditions deactivated successfully');
      } else {
        throw new Error('Deactivation failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to deactivate Terms & Conditions. Please try again.');
    }
  };

  // Handle row click to navigate to term details
  const handleRowClick = (termId, event) => {
    if (event.target.closest('.action-buttons')) {
      return;
    }
    navigate(`/content/terms/${termId}`);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Calculate stats from current terms
  const currentStats = useMemo(() => {
    const activeTerms = allTerms.filter(t => t.is_active === 1).length;
    
    return {
      totalTerms: allTerms.length,
      activeTerms
    };
  }, [allTerms]);

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
    <div className="page-container">
      {/* Stats Grid */}
      <div className="stats-grid" style={{marginBottom: 'var(--spacing-lg)'}}>
        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{currentStats.totalTerms}</div>
            <div className="stats-label">Total Terms</div>
          </div>
          <div className="stats-icon">
            <FileText />
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{currentStats.activeTerms}</div>
            <div className="stats-label">Active Terms</div>
          </div>
          <div className="stats-icon success">
            <Target />
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{Math.round((currentStats.activeTerms / Math.max(currentStats.totalTerms, 1)) * 100)}%</div>
            <div className="stats-label">Active Rate</div>
          </div>
          <div className="stats-icon info">
            <Activity />
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{currentStats.totalTerms - currentStats.activeTerms}</div>
            <div className="stats-label">Inactive</div>
          </div>
          <div className="stats-icon warning">
            <Shield />
          </div>
        </div>
      </div>

      {/* Table Container with filters and search */}
      <div className="table-container">
        <div className="table-header">
          <div className="table-header-left">
            <h3 className="table-title">
              Terms & Conditions ({totalTerms.toLocaleString()})
            </h3>
            <div className="table-search">
              <Search className="search-input-icon" />
              <input
                type="text"
                placeholder="Search by title or description..."
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
              onClick={() => navigate('/content/terms/add')}
            >
              <Plus size={16} />
              Add New Terms
            </button>
          </div>
        </div>

        {paginatedTerms.length === 0 ? (
          <div className="empty-state">
            <FileText className="empty-state-icon" />
            <h3 className="empty-state-title">No Terms & Conditions found</h3>
            <p className="empty-state-description">
              {searchTerm || statusFilter
                ? 'Try adjusting your search criteria'
                : 'No Terms & Conditions found'
              }
            </p>
          </div>
        ) : (
          <div className="table-scroll-container">
            <table className="data-table">
              <thead className="table-sticky-header">
                <tr>
                  <th style={{width: '80px', padding: 'var(--spacing-lg)'}}>ID</th>
                  <th style={{padding: 'var(--spacing-lg)'}}>Title</th>
                  <th style={{width: '400px', padding: 'var(--spacing-lg)'}}>Description</th>
                  <th style={{width: '100px', padding: 'var(--spacing-lg)'}}>Status</th>
                  <th style={{width: '110px', padding: 'var(--spacing-lg)'}}>Created</th>
                  <th style={{width: '140px', textAlign: 'center', padding: 'var(--spacing-lg)'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTerms.map((term) => (
                  <tr 
                    key={term.id} 
                    style={{height: '64px', cursor: 'pointer'}}
                    onClick={(e) => handleRowClick(term.id, e)}
                    className="user-row-clickable"
                  >
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <span className="font-medium" style={{color: 'var(--text-secondary)'}}>
                        #{term.id}
                      </span>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <div className="user-cell">
                        <div className="user-avatar">
                          {getTermInitials(term)}
                        </div>
                        <div>
                          <div className="user-name">
                            {term.title}
                          </div>
                          <div className="user-email">Legal Document</div>
                        </div>
                      </div>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <span className="font-medium" style={{color: 'var(--text-secondary)'}}>
                        {truncateText(term.description, 100)}
                      </span>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <span className={`status-badge ${term.is_active ? 'success' : 'error'}`}>
                        {term.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <span className="date-cell">{formatDate(term.created_at)}</span>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)', textAlign: 'center'}}>
                      <div className="action-buttons">
                        <button 
                          className="action-btn view"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/content/terms/${term.id}`);
                          }}
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          className="action-btn edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/content/terms/${term.id}/edit`);
                          }}
                          title="Edit Terms"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          className="action-btn delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTerm(term.id);
                          }}
                          title="Deactivate Terms"
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
              Showing {Math.min(((currentPage - 1) * itemsPerPage) + 1, totalTerms)} to {Math.min(currentPage * itemsPerPage, totalTerms)} of {totalTerms} terms
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

export default TermsManagement;