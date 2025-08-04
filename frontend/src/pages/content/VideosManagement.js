// pages/content/VideosManagement.js - App Demo Videos Management Component
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Video, Plus, Search, Eye, Edit2, Trash2, 
  ChevronLeft, ChevronRight, Play, Activity, Target, Hash
} from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import '../../styles/AdminStyles.css';

const VideosManagement = () => {
  const navigate = useNavigate();
  
  // State management
  const [allVideos, setAllVideos] = useState([]);
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
  const staticVideosData = {
    videos: [
      {
        id: 1,
        title: 'Getting Started',
        description: 'Learn how to set up your account and get started with the app.',
        video_link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        sequence: 1,
        is_active: 1,
        created_at: '2024-01-15T10:30:00Z'
      },
      {
        id: 2,
        title: 'How to Place an Order',
        description: 'Step-by-step guide on placing your first order through the app.',
        video_link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        sequence: 2,
        is_active: 1,
        created_at: '2024-01-16T11:30:00Z'
      },
      {
        id: 3,
        title: 'Payment Methods',
        description: 'Learn about different payment options available in the app.',
        video_link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        sequence: 3,
        is_active: 0,
        created_at: '2024-01-17T12:30:00Z'
      }
    ],
    stats: {
      totalVideos: 3,
      activeVideos: 2
    }
  };

  // Fetch all App Demo Videos
  const fetchAllVideos = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        limit: '1000',
        offset: '0'
      });

      const possibleEndpoints = [
        `${API_BASE_URL}/videos?${params}`,
        `${API_BASE_URL}/admin/videos?${params}`,
        `/api/videos?${params}`,
        `/videos?${params}`
      ];

      let lastError = null;
      let videoData = null;

      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`🔄 Trying Videos endpoint: ${endpoint}`);
          
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: getHeaders(),
            credentials: 'include'
          });

          if (response.ok) {
            const data = await response.json();
            console.log('✅ Videos API Response:', data);
            videoData = data;
            break;
          } else {
            const errorText = await response.text();
            console.warn(`⚠️ Videos endpoint ${endpoint} failed:`, response.status, errorText);
            lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        } catch (err) {
          console.warn(`⚠️ Videos endpoint ${endpoint} error:`, err.message);
          lastError = err;
          continue;
        }
      }

      if (!videoData) {
        console.warn('⚠️ Videos API failed, using static data');
        const processedData = processVideosData(staticVideosData);
        setAllVideos(processedData.videos || []);
        setError(null);
      } else {
        const processedData = processVideosData(videoData);
        setAllVideos(processedData.videos || []);
        setError(null);
      }
      
      console.log('✅ All Videos data loaded successfully');

    } catch (error) {
      console.warn('⚠️ Videos API failed:', error.message);
      
      // Use static data as fallback
      const processedData = processVideosData(staticVideosData);
      setAllVideos(processedData.videos || []);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  // Client-side filtering logic
  const filteredVideos = useMemo(() => {
    let filtered = [...allVideos];

    // Apply search filter
    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(video => {
        return (
          (video.title?.toLowerCase() || '').includes(searchLower) ||
          (video.description?.toLowerCase() || '').includes(searchLower)
        );
      });
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(video => {
        switch (statusFilter) {
          case 'active':
            return video.is_active === 1;
          case 'inactive':
            return video.is_active === 0;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [allVideos, searchTerm, statusFilter]);

  // Pagination logic using filtered data
  const paginatedVideos = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredVideos.slice(startIndex, endIndex);
  }, [filteredVideos, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredVideos.length / itemsPerPage);
  const totalVideos = filteredVideos.length;

  // Process Videos data
  const processVideosData = (rawData) => {
    let videos = [];
    let pagination = { total: 0, totalPages: 1, currentPage: 1, itemsPerPage: 10 };
    let stats = { totalVideos: 0, activeVideos: 0 };

    try {
      if (rawData.success && rawData.data) {
        videos = rawData.data.videos || rawData.data || [];
        pagination = rawData.data.pagination || rawData.pagination || pagination;
        stats = rawData.data.stats || rawData.stats || stats;
      } else if (Array.isArray(rawData)) {
        videos = rawData;
      } else if (rawData.videos) {
        videos = rawData.videos;
        pagination = rawData.pagination || pagination;
        stats = rawData.stats || stats;
      }

      if (!Array.isArray(videos)) {
        videos = [];
      }

      if (videos.length > 0 && stats.totalVideos === 0) {
        stats.totalVideos = pagination.total || videos.length;
        stats.activeVideos = videos.filter(v => v.is_active === 1).length;
      }

      return { videos, pagination, stats };
    } catch (error) {
      console.error('Error processing Videos data:', error);
      return { videos: [], pagination, stats };
    }
  };

  // Initial load
  useEffect(() => {
    fetchAllVideos();
  }, [fetchAllVideos]);

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

  const getVideoInitials = (video) => {
    return video.title?.substring(0, 2).toUpperCase() || 'VD';
  };

  const truncateText = (text, maxLength = 80) => {
    if (!text) return 'N/A';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const getVideoId = (link) => {
    if (!link) return null;
    const match = link.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const getThumbnailUrl = (link) => {
    const videoId = getVideoId(link);
    return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;
  };

  // Delete Video (set is_active = 0)
  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm('Are you sure you want to deactivate this video?')) {
      return;
    }

    try {
      const deleteEndpoints = [
        `${API_BASE_URL}/videos/${videoId}`,
        `${API_BASE_URL}/admin/videos/${videoId}`,
        `/api/videos/${videoId}`
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
        await fetchAllVideos();
        alert('Video deactivated successfully');
      } else {
        throw new Error('Deactivation failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to deactivate video. Please try again.');
    }
  };

  // Handle row click to navigate to video details
  const handleRowClick = (videoId, event) => {
    if (event.target.closest('.action-buttons')) {
      return;
    }
    navigate(`/content/videos/${videoId}`);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Calculate stats from current videos
  const currentStats = useMemo(() => {
    const activeVideos = allVideos.filter(v => v.is_active === 1).length;
    
    return {
      totalVideos: allVideos.length,
      activeVideos
    };
  }, [allVideos]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading App Demo Videos...</p>
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
            <div className="stats-value">{currentStats.totalVideos}</div>
            <div className="stats-label">Total Videos</div>
          </div>
          <div className="stats-icon">
            <Video />
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{currentStats.activeVideos}</div>
            <div className="stats-label">Active Videos</div>
          </div>
          <div className="stats-icon success">
            <Target />
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{Math.round((currentStats.activeVideos / Math.max(currentStats.totalVideos, 1)) * 100)}%</div>
            <div className="stats-label">Active Rate</div>
          </div>
          <div className="stats-icon info">
            <Activity />
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{currentStats.totalVideos - currentStats.activeVideos}</div>
            <div className="stats-label">Inactive</div>
          </div>
          <div className="stats-icon warning">
            <Play />
          </div>
        </div>
      </div>

      {/* Table Container with filters and search */}
      <div className="table-container">
        <div className="table-header">
          <div className="table-header-left">
            <h3 className="table-title">
              App Demo Videos ({totalVideos.toLocaleString()})
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
              onClick={() => navigate('/content/videos/add')}
            >
              <Plus size={16} />
              Add New Video
            </button>
          </div>
        </div>

        {paginatedVideos.length === 0 ? (
          <div className="empty-state">
            <Video className="empty-state-icon" />
            <h3 className="empty-state-title">No videos found</h3>
            <p className="empty-state-description">
              {searchTerm || statusFilter
                ? 'Try adjusting your search criteria'
                : 'No demo videos found'
              }
            </p>
          </div>
        ) : (
          <div className="table-scroll-container">
            <table className="data-table">
              <thead className="table-sticky-header">
                <tr>
                  <th style={{width: '80px', padding: 'var(--spacing-lg)'}}>ID</th>
                  <th style={{padding: 'var(--spacing-lg)'}}>Video Details</th>
                  <th style={{width: '300px', padding: 'var(--spacing-lg)'}}>Description</th>
                  <th style={{width: '100px', padding: 'var(--spacing-lg)'}}>Sequence</th>
                  <th style={{width: '100px', padding: 'var(--spacing-lg)'}}>Status</th>
                  <th style={{width: '110px', padding: 'var(--spacing-lg)'}}>Created</th>
                  <th style={{width: '140px', textAlign: 'center', padding: 'var(--spacing-lg)'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedVideos.map((video) => {
                  const thumbnailUrl = getThumbnailUrl(video.video_link);
                  return (
                    <tr 
                      key={video.id} 
                      style={{height: '64px', cursor: 'pointer'}}
                      onClick={(e) => handleRowClick(video.id, e)}
                      className="user-row-clickable"
                    >
                      <td style={{padding: 'var(--spacing-lg)'}}>
                        <span className="font-medium" style={{color: 'var(--text-secondary)'}}>
                          #{video.id}
                        </span>
                      </td>
                      <td style={{padding: 'var(--spacing-lg)'}}>
                        <div className="user-cell">
                          <div 
                            className="user-avatar"
                            style={{
                              backgroundImage: thumbnailUrl ? `url(${thumbnailUrl})` : 'none',
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              position: 'relative'
                            }}
                          >
                            {!thumbnailUrl && getVideoInitials(video)}
                            {thumbnailUrl && (
                              <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                color: 'white',
                                background: 'rgba(0,0,0,0.6)',
                                borderRadius: '50%',
                                width: '20px',
                                height: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <Play size={10} />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="user-name">
                              {video.title}
                            </div>
                            <div className="user-email">Demo Video</div>
                          </div>
                        </div>
                      </td>
                      <td style={{padding: 'var(--spacing-lg)'}}>
                        <span className="font-medium" style={{color: 'var(--text-secondary)'}}>
                          {truncateText(video.description, 60)}
                        </span>
                      </td>
                      <td style={{padding: 'var(--spacing-lg)'}}>
                        <span className="sequence-badge">
                          <Hash size={12} />
                          {video.sequence}
                        </span>
                      </td>
                      <td style={{padding: 'var(--spacing-lg)'}}>
                        <span className={`status-badge ${video.is_active ? 'success' : 'error'}`}>
                          {video.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{padding: 'var(--spacing-lg)'}}>
                        <span className="date-cell">{formatDate(video.created_at)}</span>
                      </td>
                      <td style={{padding: 'var(--spacing-lg)', textAlign: 'center'}}>
                        <div className="action-buttons">
                          <button 
                            className="action-btn view"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/content/videos/${video.id}`);
                            }}
                            title="View Details"
                          >
                            <Eye size={14} />
                          </button>
                          <button 
                            className="action-btn edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/content/videos/${video.id}/edit`);
                            }}
                            title="Edit Video"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            className="action-btn delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteVideo(video.id);
                            }}
                            title="Deactivate Video"
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
              Showing {Math.min(((currentPage - 1) * itemsPerPage) + 1, totalVideos)} to {Math.min(currentPage * itemsPerPage, totalVideos)} of {totalVideos} videos
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

export default VideosManagement;