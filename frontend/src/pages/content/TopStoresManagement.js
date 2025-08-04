// pages/content/TopStoresManagement.js - Top Stores Management Component with Drag & Drop
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Star, Plus, Search, Eye, Edit2, Trash2, 
  ChevronLeft, ChevronRight, Store, Activity, Target, Hash, MapPin, GripVertical
} from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import '../../styles/AdminStyles.css';

const TopStoresManagement = () => {
  const navigate = useNavigate();
  
  // State management
  const [allStoresSequence, setAllStoresSequence] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isReordering, setIsReordering] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  
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
  const staticStoresSequenceData = {
    storesSequence: [
      {
        id: 1,
        store_id: 1,
        sequence_no: 1,
        store_name: 'TechMart Electronics',
        store_address: '123 Main St, Mumbai',
        store_phone: '+91 98765 43210',
        store_email: 'info@techmart.com',
        is_active: 1,
        created_at: '2024-01-15T10:30:00Z'
      },
      {
        id: 2,
        store_id: 2,
        sequence_no: 2,
        store_name: 'Fashion Hub',
        store_address: '456 Fashion Ave, Delhi',
        store_phone: '+91 87654 32109',
        store_email: 'contact@fashionhub.com',
        is_active: 1,
        created_at: '2024-01-16T11:30:00Z'
      },
      {
        id: 3,
        store_id: 3,
        sequence_no: 3,
        store_name: 'Fresh Grocers',
        store_address: '789 Market St, Bangalore',
        store_phone: '+91 76543 21098',
        store_email: 'hello@freshgrocers.com',
        is_active: 0,
        created_at: '2024-01-17T12:30:00Z'
      }
    ],
    stats: {
      totalStoresSequence: 3,
      activeStoresSequence: 2
    }
  };

  // Bulk update sequence API call
  const updateSequenceOrder = async (updatedSequences) => {
    try {
      setIsReordering(true);
      
      const updateEndpoints = [
        `${API_BASE_URL}/stores-sequence/bulk-update-sequence`,
        `${API_BASE_URL}/admin/stores-sequence/bulk-update-sequence`,
        `/api/stores-sequence/bulk-update-sequence`
      ];

      let updated = false;
      for (const endpoint of updateEndpoints) {
        try {
          console.log(`🔄 Trying bulk update endpoint: ${endpoint}`);
          
          const response = await fetch(endpoint, {
            method: 'PUT',
            headers: getHeaders(),
            credentials: 'include',
            body: JSON.stringify({
              sequences: updatedSequences
            })
          });

          if (response.ok) {
            const data = await response.json();
            console.log('✅ Bulk sequence update successful:', data);
            updated = true;
            break;
          } else {
            const errorText = await response.text();
            console.warn(`⚠️ Bulk update endpoint ${endpoint} failed:`, response.status, errorText);
          }
        } catch (err) {
          console.warn(`⚠️ Bulk update endpoint ${endpoint} error:`, err.message);
          continue;
        }
      }

      if (updated) {
        // Refresh the data
        await fetchAllStoresSequence();
        return true;
      } else {
        throw new Error('All bulk update endpoints failed');
      }
    } catch (error) {
      console.error('❌ Error updating sequence order:', error);
      throw error;
    } finally {
      setIsReordering(false);
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e, store) => {
    setDraggedItem(store);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedItem(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetStore) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem.id === targetStore.id) {
      return;
    }

    try {
      // Create a copy of the current data for manipulation
      let reorderedStores = [...filteredStoresSequence];
      
      // Find indices
      const draggedIndex = reorderedStores.findIndex(store => store.id === draggedItem.id);
      const targetIndex = reorderedStores.findIndex(store => store.id === targetStore.id);
      
      if (draggedIndex === -1 || targetIndex === -1) {
        return;
      }

      // Remove dragged item and insert at target position
      const [removed] = reorderedStores.splice(draggedIndex, 1);
      reorderedStores.splice(targetIndex, 0, removed);

      // Update sequence numbers
      const updatedSequences = reorderedStores.map((store, index) => ({
        id: store.id,
        sequence_no: index + 1
      }));

      // Optimistically update UI
      const optimisticUpdate = reorderedStores.map((store, index) => ({
        ...store,
        sequence_no: index + 1
      }));

      // Update state immediately for better UX
      const newAllStores = allStoresSequence.map(store => {
        const updated = optimisticUpdate.find(s => s.id === store.id);
        return updated ? { ...store, sequence_no: updated.sequence_no } : store;
      });
      setAllStoresSequence(newAllStores);

      // Send update to server
      await updateSequenceOrder(updatedSequences);
      
    } catch (error) {
      console.error('Error reordering stores:', error);
      // Revert optimistic update on error
      await fetchAllStoresSequence();
      alert('Failed to update sequence order. Please try again.');
    }
  };

  // Fetch all Top Stores
  const fetchAllStoresSequence = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        limit: '1000',
        offset: '0'
      });

      const possibleEndpoints = [
        `${API_BASE_URL}/stores-sequence?${params}`,
        `${API_BASE_URL}/admin/stores-sequence?${params}`,
        `/api/stores-sequence?${params}`,
        `/stores-sequence?${params}`
      ];

      let lastError = null;
      let storesSequenceData = null;

      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`🔄 Trying Top Stores endpoint: ${endpoint}`);
          
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: getHeaders(),
            credentials: 'include'
          });

          if (response.ok) {
            const data = await response.json();
            console.log('✅ Top Stores API Response:', data);
            storesSequenceData = data;
            break;
          } else {
            const errorText = await response.text();
            console.warn(`⚠️ Top Stores endpoint ${endpoint} failed:`, response.status, errorText);
            lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        } catch (err) {
          console.warn(`⚠️ Top Stores endpoint ${endpoint} error:`, err.message);
          lastError = err;
          continue;
        }
      }

      if (!storesSequenceData) {
        console.warn('⚠️ Top Stores API failed, using static data');
        const processedData = processStoresSequenceData(staticStoresSequenceData);
        setAllStoresSequence(processedData.storesSequence || []);
        setError(null);
      } else {
        const processedData = processStoresSequenceData(storesSequenceData);
        setAllStoresSequence(processedData.storesSequence || []);
        setError(null);
      }
      
      console.log('✅ All Top Stores data loaded successfully');

    } catch (error) {
      console.warn('⚠️ Top Stores API failed:', error.message);
      
      // Use static data as fallback
      const processedData = processStoresSequenceData(staticStoresSequenceData);
      setAllStoresSequence(processedData.storesSequence || []);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  // Client-side filtering logic
  const filteredStoresSequence = useMemo(() => {
    let filtered = [...allStoresSequence];

    // Apply search filter
    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(storeSeq => {
        return (
          (storeSeq.store_name?.toLowerCase() || '').includes(searchLower) ||
          (storeSeq.store_address?.toLowerCase() || '').includes(searchLower) ||
          (storeSeq.store_email?.toLowerCase() || '').includes(searchLower)
        );
      });
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(storeSeq => {
        switch (statusFilter) {
          case 'active':
            return storeSeq.is_active === 1;
          case 'inactive':
            return storeSeq.is_active === 0;
          default:
            return true;
        }
      });
    }

    // Sort by sequence_no to ensure proper order
    return filtered.sort((a, b) => a.sequence_no - b.sequence_no);
  }, [allStoresSequence, searchTerm, statusFilter]);

  // Pagination logic using filtered data
  const paginatedStoresSequence = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredStoresSequence.slice(startIndex, endIndex);
  }, [filteredStoresSequence, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredStoresSequence.length / itemsPerPage);
  const totalStoresSequence = filteredStoresSequence.length;

  // Process Stores Sequence data
  const processStoresSequenceData = (rawData) => {
    let storesSequence = [];
    let pagination = { total: 0, totalPages: 1, currentPage: 1, itemsPerPage: 10 };
    let stats = { totalStoresSequence: 0, activeStoresSequence: 0 };

    try {
      if (rawData.success && rawData.data) {
        storesSequence = rawData.data.storesSequence || rawData.data || [];
        pagination = rawData.data.pagination || rawData.pagination || pagination;
        stats = rawData.data.stats || rawData.stats || stats;
      } else if (Array.isArray(rawData)) {
        storesSequence = rawData;
      } else if (rawData.storesSequence) {
        storesSequence = rawData.storesSequence;
        pagination = rawData.pagination || pagination;
        stats = rawData.stats || stats;
      }

      if (!Array.isArray(storesSequence)) {
        storesSequence = [];
      }

      if (storesSequence.length > 0 && stats.totalStoresSequence === 0) {
        stats.totalStoresSequence = pagination.total || storesSequence.length;
        stats.activeStoresSequence = storesSequence.filter(s => s.is_active === 1).length;
      }

      return { storesSequence, pagination, stats };
    } catch (error) {
      console.error('Error processing Top Stores data:', error);
      return { storesSequence: [], pagination, stats };
    }
  };

  // Initial load
  useEffect(() => {
    fetchAllStoresSequence();
  }, [fetchAllStoresSequence]);

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

  const getStoreInitials = (store) => {
    return store.store_name?.substring(0, 2).toUpperCase() || 'ST';
  };

  const truncateText = (text, maxLength = 60) => {
    if (!text) return 'N/A';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // Delete Store Sequence (set is_active = 0)
  const handleDeleteStoreSequence = async (sequenceId) => {
    if (!window.confirm('Are you sure you want to remove this store from top stores?')) {
      return;
    }

    try {
      const deleteEndpoints = [
        `${API_BASE_URL}/stores-sequence/${sequenceId}`,
        `${API_BASE_URL}/admin/stores-sequence/${sequenceId}`,
        `/api/stores-sequence/${sequenceId}`
      ];

      let deleted = false;
      for (const endpoint of deleteEndpoints) {
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
        await fetchAllStoresSequence();
        alert('Store removed from top stores successfully');
      } else {
        throw new Error('Removal failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to remove store from top stores. Please try again.');
    }
  };

  // Handle row click to navigate to store sequence details
  const handleRowClick = (sequenceId, event) => {
    if (event.target.closest('.action-buttons') || event.target.closest('.drag-handle')) {
      return;
    }
    navigate(`/content/top-stores/${sequenceId}`);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Calculate stats from current stores sequence
  const currentStats = useMemo(() => {
    const activeStoresSequence = allStoresSequence.filter(s => s.is_active === 1).length;
    
    return {
      totalStoresSequence: allStoresSequence.length,
      activeStoresSequence
    };
  }, [allStoresSequence]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading Top Stores...</p>
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
            <div className="stats-value">{currentStats.totalStoresSequence}</div>
            <div className="stats-label">Total Top Stores</div>
          </div>
          <div className="stats-icon">
            <Star />
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{currentStats.activeStoresSequence}</div>
            <div className="stats-label">Active Stores</div>
          </div>
          <div className="stats-icon success">
            <Target />
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{Math.round((currentStats.activeStoresSequence / Math.max(currentStats.totalStoresSequence, 1)) * 100)}%</div>
            <div className="stats-label">Active Rate</div>
          </div>
          <div className="stats-icon info">
            <Activity />
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{currentStats.totalStoresSequence - currentStats.activeStoresSequence}</div>
            <div className="stats-label">Inactive</div>
          </div>
          <div className="stats-icon warning">
            <Store />
          </div>
        </div>
      </div>

      {/* Table Container with filters and search */}
      <div className="table-container">
        <div className="table-header">
          <div className="table-header-left">
            <h3 className="table-title">
              Top Stores ({totalStoresSequence.toLocaleString()})
            </h3>
            <div className="table-search">
              <Search className="search-input-icon" />
              <input
                type="text"
                placeholder="Search by store name, address..."
                className="table-search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="table-actions">
            {/* <div className="filter-group">
              <select
                className="filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div> */}
            
            <button 
              className="add-user-btn"
              onClick={() => navigate('/content/top-stores/add')}
            >
              <Plus size={16} />
              Add Top Store
            </button>
          </div>
        </div>

        {/* Reordering indicator */}
        {isReordering && (
          <div className="reordering-indicator" style={{
            background: 'var(--primary-bg)',
            color: 'var(--primary-color)',
            padding: 'var(--spacing-sm)',
            borderRadius: 'var(--border-radius)',
            marginBottom: 'var(--spacing-md)',
            textAlign: 'center',
            fontSize: '0.875rem'
          }}>
            <Activity size={16} style={{marginRight: 'var(--spacing-xs)'}} />
            Updating sequence order...
          </div>
        )}

        {paginatedStoresSequence.length === 0 ? (
          <div className="empty-state">
            <Star className="empty-state-icon" />
            <h3 className="empty-state-title">No top stores found</h3>
            <p className="empty-state-description">
              {searchTerm || statusFilter
                ? 'Try adjusting your search criteria'
                : 'No stores in top stores sequence'
              }
            </p>
          </div>
        ) : (
          <div className="table-scroll-container">
            <table className="data-table">
              <thead className="table-sticky-header">
                <tr>
                  <th style={{width: '60px', padding: 'var(--spacing-lg)'}}>Drag</th>
                  <th style={{width: '120px', padding: 'var(--spacing-lg)'}}> Sequence</th>
                  <th style={{width: '120px', padding: 'var(--spacing-lg)'}}> Store Details</th>
                
                  <th style={{width: '250px', padding: 'var(--spacing-lg)'}}>Address</th>
                  <th style={{width: '150px', padding: 'var(--spacing-lg)'}}>Contact</th>
                  <th style={{width: '100px', padding: 'var(--spacing-lg)'}}>Status</th>
                  <th style={{width: '110px', padding: 'var(--spacing-lg)'}}>Added</th>
                  <th style={{width: '140px', textAlign: 'center', padding: 'var(--spacing-lg)'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStoresSequence.map((storeSeq) => (
                  <tr 
                    key={storeSeq.id} 
                    style={{height: '64px', cursor: 'pointer'}}
                    onClick={(e) => handleRowClick(storeSeq.id, e)}
                    className="user-row-clickable"
                    draggable
                    onDragStart={(e) => handleDragStart(e, storeSeq)}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, storeSeq)}
                  >
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <div className="drag-handle" style={{
                        cursor: 'grab',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <GripVertical size={16} />
                      </div>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <div style={{display: 'flex', flexDirection: 'column', gap: '2px'}}>
                        
                        <span className="sequence-badge" style={{
                          background: 'var(--success-bg)',
                          color: 'var(--success-color)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px',
                          width: 'fit-content'
                        }}>
                          <Hash size={10} />
                          {storeSeq.sequence_no}
                        </span>
                      </div>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <div className="user-cell">
                        <div className="user-avatar">
                          {getStoreInitials(storeSeq)}
                        </div>
                        <div>
                          <div className="user-name">
                            {storeSeq.store_name}
                          </div>
                          <div className="user-email">Store ID: {storeSeq.store_id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)'}}>
                        <MapPin size={14} style={{color: 'var(--text-muted)'}} />
                        <span className="font-medium" style={{color: 'var(--text-secondary)'}}>
                          {truncateText(storeSeq.store_address, 40)}
                        </span>
                      </div>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <div style={{fontSize: '0.875rem'}}>
                        <div style={{color: 'var(--text-secondary)'}}>{storeSeq.store_phone}</div>
                        <div style={{color: 'var(--text-muted)', fontSize: '0.75rem'}}>
                          {truncateText(storeSeq.store_email, 20)}
                        </div>
                      </div>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <span className={`status-badge ${storeSeq.is_active ? 'success' : 'error'}`}>
                        {storeSeq.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)'}}>
                      <span className="date-cell">{formatDate(storeSeq.created_at)}</span>
                    </td>
                    <td style={{padding: 'var(--spacing-lg)', textAlign: 'center'}}>
                      <div className="action-buttons">
                        <button 
                          className="action-btn view"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/content/top-stores/${storeSeq.id}`);
                          }}
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          className="action-btn edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/content/top-stores/${storeSeq.id}/edit`);
                          }}
                          title="Edit Store Sequence"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          className="action-btn delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteStoreSequence(storeSeq.id);
                          }}
                          title="Remove from Top Stores"
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
              Showing {Math.min(((currentPage - 1) * itemsPerPage) + 1, totalStoresSequence)} to {Math.min(currentPage * itemsPerPage, totalStoresSequence)} of {totalStoresSequence} stores
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

export default TopStoresManagement;