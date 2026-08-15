import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogoutProvider, useLogout } from '../contexts/LogoutContext';
import './MainLayout.css';

interface MainLayoutProps {
  user: any;
  onLogout: () => void;
  children: React.ReactNode;
}

const SidebarLogoutButton: React.FC = () => {
  const { onLogout } = useLogout();

  return (
    <button
      className="logout-button"
      onClick={onLogout}
      title="Logout"
    >
      🚪 Logout
    </button>
  );
};

const MainLayoutContent: React.FC<MainLayoutProps> = ({ user, onLogout, children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/billing', label: 'Billing', icon: '💳' },
    { path: '/products', label: 'Products', icon: '📦' },
    { path: '/customers', label: 'Customers', icon: '👥' },
    { path: '/sales-history', label: 'Sales History', icon: '📜' },
    { path: '/reports', label: 'Reports', icon: '📈' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="main-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo-wrapper">
            <span className="logo-icon">🏪</span>
            {sidebarOpen && <h2>SmartShop</h2>}
          </div>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <nav className="sidebar-menu">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`menu-item ${isActive(item.path) ? 'active' : ''}`}
              title={item.label}
            >
              <span className="menu-icon">{item.icon}</span>
              {sidebarOpen && <span className="menu-label">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user?.firstName?.charAt(0).toUpperCase() || 'A'}
            </div>
            {sidebarOpen && (
              <div className="user-details">
                <p className="user-name">{user?.firstName || 'Admin'} {user?.lastName || ''}</p>
                <p className="user-role">{user?.role || 'Administrator'}</p>
              </div>
            )}
          </div>
          <SidebarLogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="content-area">
          {children}
        </div>
      </main>
    </div>
  );
};

const MainLayout: React.FC<MainLayoutProps> = ({ user, onLogout, children }) => {
  return (
    <LogoutProvider onLogout={onLogout}>
      <MainLayoutContent user={user} onLogout={onLogout} children={children} />
    </LogoutProvider>
  );
};

export default MainLayout;
