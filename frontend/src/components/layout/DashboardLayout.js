import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Home, Users, ShoppingBag, Gift, CreditCard, Calculator, 
  Trophy, BarChart3, Settings, LogOut, Bell, Search,
  FileText, HelpCircle, Video, Star, ClipboardList, Zap
} from 'lucide-react';

const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const menuItems = [
    {
      label: 'Dashboard',
      icon: Home,
      path: '/dashboard',
      description: 'Overview & Analytics'
    },
    {
      label: 'Users',
      icon: Users,
      path: '/users',
      description: 'Manage Users'
    },
    {
      label: 'Stores',
      icon: ShoppingBag,
      path: '/stores',
      description: 'Manage Stores'
    },
    {
      label: 'Transactions',
      icon: CreditCard,
      path: '/transactions',
      description: 'Transaction Management'
    },
    {
      label: 'Settlements', // 🆕 NEW: Added Settlements
      icon: Calculator,
      path: '/settlements',
      description: 'Settlement Management'
    },
    {
      label: 'Coupons',
      icon: Gift,
      path: '/coupons',
      description: 'Coupon Management'
    },
    {
      label: 'Rewards',
      icon: Trophy,
      path: '/rewards',
      description: 'Reward Management'
    },
    {
      label: 'Daily Rewards', // 🆕 NEW: Added Daily Rewards
      icon: Zap,
      path: '/daily-rewards',
      description: 'Daily Spin Rewards'
    },
    {
      label: 'Reward History',
      icon: BarChart3,
      path: '/reward-history',
      description: 'Reward History'
    },
    {
      label: 'Content',
      icon: FileText,
      path: '/content',
      description: 'Content Management'
    },
    {
      label: 'Surveys',
      icon: ClipboardList,
      path: '/surveys',
      description: 'Survey Management'
    }
  ];

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-container">
            <div className="logo-icon">S</div>
            <div className="logo-text">Slash</div>
            <div className="logo-version">v2.0</div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="nav-menu">
          <div className="nav-section">
            <div className="section-title">Main Menu</div>
          </div>
          
          {menuItems.slice(0, 4).map((item) => (
            <div key={item.path} className="nav-item">
              <Link
                to={item.path}
                className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                title={item.description}
              >
                <div className="nav-icon">
                  <item.icon size={16} />
                </div>
                <span>{item.label}</span>
              </Link>
            </div>
          ))}

          <div className="nav-section" style={{marginTop: 'var(--spacing-lg)'}}>
            <div className="section-title">Financial</div>
          </div>
          
          {/* Settlements and other financial items */}
          {menuItems.slice(4, 5).map((item) => (
            <div key={item.path} className="nav-item">
              <Link
                to={item.path}
                className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                title={item.description}
              >
                <div className="nav-icon">
                  <item.icon size={16} />
                </div>
                <span>{item.label}</span>
              </Link>
            </div>
          ))}

          <div className="nav-section" style={{marginTop: 'var(--spacing-lg)'}}>
            <div className="section-title">Rewards & Engagement</div>
          </div>
          
          {/* Rewards section: Coupons, Rewards, Daily Rewards, Reward History */}
          {menuItems.slice(5, 9).map((item) => (
            <div key={item.path} className="nav-item">
              <Link
                to={item.path}
                className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                title={item.description}
              >
                <div className="nav-icon">
                  <item.icon size={16} />
                </div>
                <span>{item.label}</span>
              </Link>
            </div>
          ))}

          <div className="nav-section" style={{marginTop: 'var(--spacing-lg)'}}>
            <div className="section-title">Management</div>
          </div>
          
          {/* Content and other management items */}
          {menuItems.slice(9).map((item) => (
            <div key={item.path} className="nav-item">
              <Link
                to={item.path}
                className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                title={item.description}
              >
                <div className="nav-icon">
                  <item.icon size={16} />
                </div>
                <span>{item.label}</span>
              </Link>
            </div>
          ))}
        </nav>

        {/* User Profile */}
        <div className="sidebar-user">
          <div className="user-info">
            <div className="user-avatar">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="user-details">
              <div className="user-name">
                {user?.name || 'Admin'}
              </div>
              <div className="user-email">
                {user?.email || 'admin@slash.com'}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="logout-btn"
            title="Logout"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: 'var(--spacing-sm)',
              borderRadius: 'var(--radius-sm)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'var(--bg-glass-hover)';
              e.target.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'none';
              e.target.style.color = 'var(--text-secondary)';
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Top Navigation */}
        <header className="top-nav">
          <div className="search-container">
            <Search className="search-icon" />
            <input 
              type="text" 
              placeholder="Search users, stores, transactions, settlements, rewards..." 
              className="search-input"
            />
          </div>
          
          <div className="nav-actions">
            <button className="action-button" title="Notifications">
              <Bell size={16} />
              <span className="notification-badge">3</span>
            </button>
            
            <button className="action-button" title="Settings">
              <Settings size={16} />
            </button>
            
            <div className="profile-dropdown">
              <div className="user-avatar">
                {user?.email?.charAt(0).toUpperCase() || 'A'}
              </div>
              <span>{user?.name || 'Admin'}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="dashboard-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;