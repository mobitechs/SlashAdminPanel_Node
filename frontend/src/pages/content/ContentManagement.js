// pages/content/ContentManagement.js - Main Content Management Page
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  HelpCircle, FileText, Video, Star, BarChart3, 
  Plus, ArrowRight, Eye, Settings, Activity,
  TrendingUp, MessageSquare, Play, Shield
} from 'lucide-react';
import '../../styles/AdminStyles.css';

const ContentManagement = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    faqs: { total: 0, active: 0 },
    terms: { total: 0, active: 0 },
    videos: { total: 0, active: 0 },
    topStores: { total: 0, active: 0 }
  });
  const [loading, setLoading] = useState(true);

  // API configuration
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  });

  // Fetch stats for all content types
  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Fetch FAQs stats
      try {
        const faqsResponse = await fetch(`${API_BASE_URL}/faqs?limit=1`, {
          headers: getHeaders(),
          credentials: 'include'
        });
        if (faqsResponse.ok) {
          const faqsData = await faqsResponse.json();
          if (faqsData.success && faqsData.data?.stats) {
            setStats(prev => ({
              ...prev,
              faqs: {
                total: faqsData.data.stats.totalFaqs || 0,
                active: faqsData.data.stats.activeFaqs || 0
              }
            }));
          }
        }
      } catch (err) {
        console.warn('Failed to fetch FAQs stats:', err);
      }

      // Fetch Terms stats
      try {
        const termsResponse = await fetch(`${API_BASE_URL}/terms?limit=1`, {
          headers: getHeaders(),
          credentials: 'include'
        });
        if (termsResponse.ok) {
          const termsData = await termsResponse.json();
          if (termsData.success && termsData.data?.stats) {
            setStats(prev => ({
              ...prev,
              terms: {
                total: termsData.data.stats.totalTerms || 0,
                active: termsData.data.stats.activeTerms || 0
              }
            }));
          }
        }
      } catch (err) {
        console.warn('Failed to fetch Terms stats:', err);
      }

      // Fetch Videos stats
      try {
        const videosResponse = await fetch(`${API_BASE_URL}/videos?limit=1`, {
          headers: getHeaders(),
          credentials: 'include'
        });
        if (videosResponse.ok) {
          const videosData = await videosResponse.json();
          if (videosData.success && videosData.data?.stats) {
            setStats(prev => ({
              ...prev,
              videos: {
                total: videosData.data.stats.totalVideos || 0,
                active: videosData.data.stats.activeVideos || 0
              }
            }));
          }
        }
      } catch (err) {
        console.warn('Failed to fetch Videos stats:', err);
      }

      // Fetch Top Stores stats
      try {
        const storesResponse = await fetch(`${API_BASE_URL}/stores-sequence?limit=1`, {
          headers: getHeaders(),
          credentials: 'include'
        });
        if (storesResponse.ok) {
          const storesData = await storesResponse.json();
          if (storesData.success && storesData.data?.stats) {
            setStats(prev => ({
              ...prev,
              topStores: {
                total: storesData.data.stats.totalStoresSequence || 0,
                active: storesData.data.stats.activeStoresSequence || 0
              }
            }));
          }
        }
      } catch (err) {
        console.warn('Failed to fetch Top Stores stats:', err);
      }

    } catch (error) {
      console.error('Error fetching content stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Content management sections
  const contentSections = [
    {
      id: 'faqs',
      title: 'FAQs',
      description: 'Manage frequently asked questions and answers',
      icon: HelpCircle,
      color: 'blue',
      route: '/content/faqs',
      addRoute: '/content/faqs/add',
      stats: stats.faqs,
      gradient: 'var(--gradient-blue)'
    },
    {
      id: 'terms',
      title: 'Terms & Conditions',
      description: 'Manage terms of service and legal documents',
      icon: FileText,
      color: 'green',
      route: '/content/terms',
      addRoute: '/content/terms/add',
      stats: stats.terms,
      gradient: 'var(--gradient-green)'
    },
    {
      id: 'videos',
      title: 'App Demo Videos',
      description: 'Manage instructional and demo videos',
      icon: Video,
      color: 'purple',
      route: '/content/videos',
      addRoute: '/content/videos/add',
      stats: stats.videos,
      gradient: 'var(--gradient-purple)'
    },
    {
      id: 'stores',
      title: 'Top Stores',
      description: 'Manage featured stores sequence and ordering',
      icon: Star,
      color: 'orange',
      route: '/content/top-stores',
      addRoute: '/content/top-stores/add',
      stats: stats.topStores,
      gradient: 'var(--gradient-orange)'
    },
    {
      id: 'survey',
      title: 'Survey',
      description: 'Manage customer surveys and feedback forms',
      icon: BarChart3,
      color: 'pink',
      route: '/content/survey',
      addRoute: '/content/survey/add',
      stats: { total: 0, active: 0 }, // Placeholder for now
      gradient: 'var(--gradient-pink)'
    }
  ];

  // Calculate total stats
  const totalStats = {
    totalItems: Object.values(stats).reduce((sum, stat) => sum + stat.total, 0),
    activeItems: Object.values(stats).reduce((sum, stat) => sum + stat.active, 0)
  };

  const ContentCard = ({ section }) => {
    const Icon = section.icon;
    
    return (
      <div 
        className="content-card"
        style={{
          background: 'var(--bg-glass)',
          border: '1px solid var(--border-glass)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--spacing-xl)',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden'
        }}
        onClick={() => navigate(section.route)}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        }}
      >
        {/* Background gradient */}
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '100px',
          height: '100px',
          background: section.gradient,
          borderRadius: '50%',
          opacity: 0.1,
          transform: 'translate(30px, -30px)'
        }} />
        
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--spacing-lg)',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{
            background: section.gradient,
            borderRadius: 'var(--radius-md)',
            padding: 'var(--spacing-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Icon size={24} style={{color: 'white'}} />
          </div>
          
          <ArrowRight 
            size={20} 
            style={{
              color: 'var(--text-muted)',
              transition: 'transform 0.3s ease'
            }}
            className="card-arrow"
          />
        </div>

        {/* Content */}
        <div style={{position: 'relative', zIndex: 1}}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: 'var(--text-primary)',
            marginBottom: 'var(--spacing-sm)'
          }}>
            {section.title}
          </h3>
          
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
            marginBottom: 'var(--spacing-lg)',
            lineHeight: 1.5
          }}>
            {section.description}
          </p>

          {/* Stats */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--spacing-lg)'
          }}>
            <div>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: 'var(--text-primary)'
              }}>
                {section.stats.total}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)'
              }}>
                Total Items
              </div>
            </div>
            
            <div>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: 'var(--success-text)'
              }}>
                {section.stats.active}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)'
              }}>
                Active
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{
            display: 'flex',
            gap: 'var(--spacing-sm)'
          }}>
            <button 
              className="btn btn-secondary"
              style={{
                fontSize: '0.75rem',
                padding: 'var(--spacing-sm) var(--spacing-md)',
                flex: 1
              }}
              onClick={(e) => {
                e.stopPropagation();
                navigate(section.route);
              }}
            >
              <Eye size={14} />
              View All
            </button>
            
            <button 
              className="btn btn-primary"
              style={{
                fontSize: '0.75rem',
                padding: 'var(--spacing-sm) var(--spacing-md)',
                flex: 1
              }}
              onClick={(e) => {
                e.stopPropagation();
                navigate(section.addRoute);
              }}
            >
              <Plus size={14} />
              Add New
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading content management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
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
        <div>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: '700',
            color: 'var(--text-primary)',
            margin: 0,
            marginBottom: 'var(--spacing-xs)'
          }}>
            Content Management
          </h1>
          <p style={{
            color: 'var(--text-secondary)',
            margin: 0,
            fontSize: '0.875rem'
          }}>
            Manage all your app content including FAQs, terms, videos, and more
          </p>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-lg)'
        }}>
          <div style={{textAlign: 'center'}}>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: 'var(--text-primary)'
            }}>
              {totalStats.totalItems}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)'
            }}>
              Total Items
            </div>
          </div>
          
          <div style={{textAlign: 'center'}}>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: 'var(--success-text)'
            }}>
              {totalStats.activeItems}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)'
            }}>
              Active Items
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid" style={{marginBottom: 'var(--spacing-xl)'}}>
        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{stats.faqs.total}</div>
            <div className="stats-label">FAQs</div>
          </div>
          <div className="stats-icon" style={{background: 'var(--gradient-blue)'}}>
            <MessageSquare />
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{stats.terms.total}</div>
            <div className="stats-label">Terms & Conditions</div>
          </div>
          <div className="stats-icon" style={{background: 'var(--gradient-green)'}}>
            <Shield />
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{stats.videos.total}</div>
            <div className="stats-label">Demo Videos</div>
          </div>
          <div className="stats-icon" style={{background: 'var(--gradient-purple)'}}>
            <Play />
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-value">{stats.topStores.total}</div>
            <div className="stats-label">Top Stores</div>
          </div>
          <div className="stats-icon" style={{background: 'var(--gradient-orange)'}}>
            <TrendingUp />
          </div>
        </div>
      </div>

      {/* Content Sections Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 'var(--spacing-xl)',
        marginBottom: 'var(--spacing-xl)'
      }}>
        {contentSections.map((section) => (
          <ContentCard key={section.id} section={section} />
        ))}
      </div>

      {/* Recent Activity Placeholder */}
      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">Recent Activity</h3>
        </div>
        <div style={{
          padding: 'var(--spacing-xl)',
          textAlign: 'center',
          color: 'var(--text-muted)'
        }}>
          <Activity size={48} style={{marginBottom: 'var(--spacing-md)', opacity: 0.5}} />
          <p>Recent content activity will be displayed here</p>
          <small>Feature coming soon...</small>
        </div>
      </div>
    </div>
  );
};

export default ContentManagement;