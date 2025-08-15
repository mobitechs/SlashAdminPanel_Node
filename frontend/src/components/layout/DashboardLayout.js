import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Home, Users, ShoppingBag, Gift, CreditCard, Calculator, 
  Trophy, BarChart3, Settings, LogOut, Bell, Search,
  FileText, HelpCircle, Video, Star, ClipboardList, Zap,
  ChevronDown, User, Mail
} from 'lucide-react';

const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      label: 'Settlements',
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
      label: 'Daily Rewards',
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
            
            {/* Enhanced Profile Dropdown */}
            <div className="profile-dropdown-container" ref={dropdownRef}>
              <button 
                className="profile-dropdown-trigger"
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              >
                <div className="user-avatar">
                  {user?.email?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div className="user-info-header">
                  <span className="user-name">{user?.name || 'Admin'}</span>
                </div>
                <ChevronDown 
                  size={16} 
                  className={`dropdown-arrow ${isProfileDropdownOpen ? 'open' : ''}`}
                />
              </button>

              {/* Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div className="profile-dropdown-menu">
                  <div className="profile-dropdown-header">
                    <div className="user-avatar-large">
                      {user?.email?.charAt(0).toUpperCase() || 'A'}
                    </div>
                    <div className="user-details-dropdown">
                      <div className="user-name-dropdown">
                        {user?.name || 'Admin'}
                      </div>
                      <div className="user-email-dropdown">
                        {user?.email || 'admin@slash.com'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="dropdown-divider"></div>
                  
                  <div className="profile-dropdown-content">
                    <button className="dropdown-item">
                      <User size={16} />
                      <span>Profile Settings</span>
                    </button>
                    
                    <button className="dropdown-item">
                      <Settings size={16} />
                      <span>Account Settings</span>
                    </button>
                    
                    <div className="dropdown-divider"></div>
                    
                    <button 
                      className="dropdown-item logout-item"
                      onClick={handleLogout}
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
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