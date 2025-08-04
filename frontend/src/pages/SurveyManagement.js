// pages/SurveyManagement.js - Survey Management List Page
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Plus, Search, Filter, Eye, Edit2, Trash2, 
  MoreHorizontal, X, TrendingUp, AlertCircle, Wifi, 
  ChevronLeft, ChevronRight, Award, Activity, Clock, Target, Users
} from 'lucide-react';
import ErrorState from '../components/common/ErrorState';
import '../styles/AdminStyles.css';

const SurveyManagement = () => {
  const navigate = useNavigate();
  
  // State management
  const [allSurveys, setAllSurveys] = useState([]);
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

  // Fetch all surveys once and filter client-side
  const fetchAllSurveys = useCallback(async () => {
    try {
      setLoading(true);
      
      // Try to fetch from API with a large limit to get all surveys
      const params = new URLSearchParams({
        limit: '1000',
        offset: '0'
      });

      const possibleEndpoints = [
        `${API_BASE_URL}/surveys?${params}`,
        `${API_BASE_URL}/admin/surveys?${params}`,
        `/api/surveys?${params}`,
        `/surveys?${params}`
      ];

      let lastError = null;
      let surveyData = null;

      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`🔄 Trying surveys endpoint: ${endpoint}`);
          
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: getHeaders(),
            credentials: 'include'
          });

          if (response.ok) {
            const data = await response.json();
            console.log('✅ Surveys API Response:', data);
            surveyData = data;
            break;
          } else {
            const errorText = await response.text();
            console.warn(`⚠️ Surveys endpoint ${endpoint} failed:`, response.status, errorText);
            lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        } catch (err) {
          console.warn(`⚠️ Surveys endpoint ${endpoint} error:`, err.message);
          lastError = err;
          continue;
        }
      }

      if (!surveyData) {
        throw lastError || new Error('All surveys endpoints failed');
      }

      // Process and store all surveys
      const processedData = processSurveysData(surveyData);
      setAllSurveys(processedData.surveys || []);
      setError(null);
      
      console.log('✅ All surveys data loaded successfully');

    } catch (error) {
      console.warn('⚠️ Surveys API failed:', error.message);
      
      // Set empty data instead of static data
      setAllSurveys([]);
      setError(`Failed to load surveys: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  // Client-side filtering logic
  const filteredSurveys = useMemo(() => {
    let filtered = [...allSurveys];

    // Apply search filter
    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(survey => {
        return (
          (survey.title?.toLowerCase() || '').includes(searchLower) ||
          (survey.description?.toLowerCase() || '').includes(searchLower)
        );
      });
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(survey => {
        switch (statusFilter) {
          case 'active':
            return survey.is_active === 1;
          case 'inactive':
            return survey.is_active === 0;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [allSurveys, searchTerm, statusFilter]);

  // Pagination logic using filtered data
  const paginatedSurveys = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredSurveys.slice(startIndex, endIndex);
  }, [filteredSurveys, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredSurveys.length / itemsPerPage);
  const totalSurveys = filteredSurveys.length;

  // Process surveys data
  const processSurveysData = (rawData) => {
    let surveys = [];
    let pagination = { total: 0, totalPages: 1, currentPage: 1, itemsPerPage: 10 };
    let stats = { totalSurveys: 0, activeSurveys: 0, totalParticipants: 0, totalRewardPoints: 0 };

    try {
      if (rawData.success && rawData.data) {
        surveys = rawData.data.surveys || rawData.data || [];
        pagination = rawData.data.pagination || rawData.pagination || pagination;
        stats = rawData.data.stats || rawData.stats || stats;
      } else if (Array.isArray(rawData)) {
        surveys = rawData;
      } else if (rawData.surveys) {
        surveys = rawData.surveys;
        pagination = rawData.pagination || pagination;
      }

      if (!Array.isArray(surveys)) {
        surveys = [];
      }

      if (surveys.length > 0 && stats.totalSurveys === 0) {
        stats.totalSurveys = pagination.total || surveys.length;
        stats.activeSurveys = surveys.filter(s => s.is_active === 1).length;
        stats.totalParticipants = surveys.reduce((sum, s) => sum + (parseInt(s.total_responses) || 0), 0);
        stats.totalRewardPoints = surveys.reduce((sum, s) => sum + (parseFloat(s.reward_points) || 0), 0);
      }

      return { surveys, pagination, stats };
    } catch (error) {
      console.error('Error processing surveys data:', error);
      return { surveys: [], pagination, stats };
    }
  };

  // Initial load
  useEffect(() => {
    fetchAllSurveys();
  }, [fetchAllSurveys]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Helper functions
  const formatNumber = (value) => {
    const num = parseFloat(value) || 0;
    if (num >= 10000000) return `${(num / 10000000).toFixed(1)}Cr`;
    if (num >= 100000) return `${(num / 100000).toFixed(1)}L`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const getSurveyInitials = (survey) => {
    return survey.title?.substring(0, 2).toUpperCase() || '??';
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

  const getSurveyStatus = (survey) => {
    if (!survey.is_active) return { status: 'inactive', color: 'error' };
    return { status: 'active', color: 'success' };
  };

  // Delete survey (set is_active = 0)
  const handleDeleteSurvey = async (surveyId) => {
    if (!window.confirm('Are you sure you want to deactivate this survey? This will set its status to inactive.')) {
      return;
    }

    try {
      const deleteEndpoints = [
        `${API_BASE_URL}/surveys/${surveyId}`,
        `${API_BASE_URL}/admin/surveys/${surveyId}`,
        `/api/surveys/${surveyId}`
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
        await fetchAllSurveys();
        alert('Survey deactivated successfully');
      } else {
        throw new Error('Deactivation failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to deactivate survey. Please try again.');
    }
  };

  // Handle row click to navigate to survey details
  const handleRowClick = (surveyId, event) => {
    if (event.target.closest('.action-buttons')) {
      return;
    }
    navigate(`/surveys/${surveyId}`);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Calculate stats from current surveys
  const currentStats = useMemo(() => {
    const activeSurveys = allSurveys.filter(s => s.is_active === 1).length;
    const totalParticipants = allSurveys.reduce((sum, s) => sum + (parseInt(s.total_responses) || 0), 0);
    const totalRewardPoints = allSurveys.reduce((sum, s) => sum + (parseFloat(s.reward_points) || 0), 0);
    
    return {
      totalSurveys: allSurveys.length,
      activeSurveys,
      totalParticipants,
      totalRewardPoints
    };
  }, [allSurveys]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading surveys...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={`Failed to load surveys: ${error}`} />;
  }

  return (
    <div className="page-container">
      {/* Stats Grid */}
      <div className="stats-grid" style={{marginBottom: 'var(--spacing-lg)'}}>
        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{formatNumber(currentStats.totalSurveys)}</div>
            <div className="stats-label">Total Surveys</div>
          </div>
          <div className="stats-icon">
            <FileText />
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{formatNumber(currentStats.activeSurveys)}</div>
            <div className="stats-label">Active Surveys</div>
          </div>
          <div className="stats-icon success">
            <Target />
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{formatNumber(currentStats.totalParticipants)}</div>
            <div className="stats-label">Total Participants</div>
          </div>
          <div className="stats-icon info">
            <Users />
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{formatNumber(currentStats.totalRewardPoints)}</div>
            <div className="stats-label">Total Reward Points</div>
          </div>
          <div className="stats-icon warning">
            <Award />
          </div>
        </div>
      </div>

      {/* Table Container with filters and search */}
      <div className="table-container">
        <div className="table-header">
          <div className="table-header-left">
            <h3 className="table-title">
              Surveys ({totalSurveys.toLocaleString()})
            </h3>
            <div style={{display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center'}}>
              <div className="table-search">
                <Search className="search-input-icon" />
                <input
                  type="text"
                  placeholder="Search by title, description..."
                  className="table-search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <select 
                className="filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.875rem'
                }}
              >
                <option value="" style={{backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)'}}>All Status</option>
                <option value="active" style={{backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)'}}>Active</option>
                <option value="inactive" style={{backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)'}}>Inactive</option>
              </select>
            </div>
          </div>
          <div className="table-actions">
            <button 
              className="add-user-btn"
              onClick={() => navigate('/surveys/add')}
            >
              <Plus size={16} />
              Add New Survey
            </button>
          </div>
        </div>

        {paginatedSurveys.length === 0 ? (
          <div className="empty-state">
            <FileText className="empty-state-icon" />
            <h3 className="empty-state-title">No surveys found</h3>
            <p className="empty-state-description">
              {searchTerm || statusFilter
                ? 'Try adjusting your search criteria'
                : 'No surveys found'
              }
            </p>
          </div>
        ) : (
          <div className="table-scroll-container">
            <table className="data-table">
              <thead className="table-sticky-header">
                <tr>
                  <th style={{width: '80px', padding: 'var(--spacing-lg)'}}>ID</th>
                  <th style={{padding: 'var(--spacing-lg)'}}>Survey Details</th>
                  <th style={{width: '120px', padding: 'var(--spacing-lg)'}}>Reward Points</th>
                  <th style={{width: '100px', padding: 'var(--spacing-lg)'}}>Questions</th>
                  <th style={{width: '120px', padding: 'var(--spacing-lg)'}}>Participants</th>
                  <th style={{width: '100px', padding: 'var(--spacing-lg)'}}>Status</th>
                  <th style={{width: '110px', padding: 'var(--spacing-lg)'}}>Created</th>
                  <th style={{width: '140px', textAlign: 'center', padding: 'var(--spacing-lg)'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSurveys.map((survey) => {
                  const status = getSurveyStatus(survey);
                  return (
                    <tr 
                      key={survey.id} 
                      style={{height: '64px', cursor: 'pointer'}}
                      onClick={(e) => handleRowClick(survey.id, e)}
                      className="user-row-clickable"
                    >
                      <td style={{padding: 'var(--spacing-lg)'}}>
                        <span className="font-medium" style={{color: 'var(--text-secondary)'}}>
                          #{survey.id}
                        </span>
                      </td>
                      <td style={{padding: 'var(--spacing-lg)'}}>
                        <div className="user-cell">
                          <div className="user-avatar">
                            {getSurveyInitials(survey)}
                          </div>
                          <div>
                            <div className="user-name">
                              {survey.title}
                            </div>
                            <div className="user-email" style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '200px'
                            }}>
                              {survey.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{padding: 'var(--spacing-lg)'}}>
                        <span className="font-medium" style={{color: 'var(--warning-text)'}}>
                          {survey.reward_points || 0} pts
                        </span>
                      </td>
                      <td style={{padding: 'var(--spacing-lg)'}}>
                        <span className="transaction-count">
                          {survey.total_questions || 0}
                        </span>
                      </td>
                      <td style={{padding: 'var(--spacing-lg)'}}>
                        <span className="font-medium" style={{color: 'var(--info-text)'}}>
                          {survey.total_responses || 0}
                        </span>
                      </td>
                      <td style={{padding: 'var(--spacing-lg)'}}>
                        <span className={`status-badge ${status.color}`}>
                          {status.status}
                        </span>
                      </td>
                      <td style={{padding: 'var(--spacing-lg)'}}>
                        <span className="date-cell">{formatDate(survey.created_at)}</span>
                      </td>
                      <td style={{padding: 'var(--spacing-lg)', textAlign: 'center'}}>
                        <div className="action-buttons">
                          <button 
                            className="action-btn view"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/surveys/${survey.id}`);
                            }}
                            title="View Details"
                          >
                            <Eye size={14} />
                          </button>
                          <button 
                            className="action-btn edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/surveys/${survey.id}/edit`);
                            }}
                            title="Edit Survey"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            className="action-btn delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSurvey(survey.id);
                            }}
                            title="Deactivate Survey"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="pagination-container">
          <div className="pagination-info">
            <span>
              Showing {Math.min(((currentPage - 1) * itemsPerPage) + 1, totalSurveys)} to {Math.min(currentPage * itemsPerPage, totalSurveys)} of {totalSurveys} surveys
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

export default SurveyManagement;