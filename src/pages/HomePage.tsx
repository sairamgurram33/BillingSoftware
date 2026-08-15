import React from 'react';
import './HomePage.css';

interface HomePageProps {
  onLogout: () => void;
  user: any;
}

const HomePage: React.FC<HomePageProps> = ({ onLogout, user }) => {
  const shopInfo = {
    name: 'SmartShop Hardware Store',
    address: '123 Hardware Lane, City Center',
    phone: '9876543210',
    email: 'info@smartshop.com',
    gst: 'GST123456789',
    hours: 'Mon - Sun: 9:00 AM - 9:00 PM'
  };

  return (
    <div className="home-page">
      {/* Animated Background */}
      <div className="home-bg">
        <div className="floating-orb orb-1"></div>
        <div className="floating-orb orb-2"></div>
        <div className="floating-orb orb-3"></div>
      </div>

      {/* Content */}
      <div className="home-container">
        {/* Header with Logout */}
        <div className="home-header">
          <div className="header-left">
            <h1>🏪 SmartShop</h1>
            <p className="admin-label">Admin Panel</p>
          </div>
          <button className="logout-btn" onClick={onLogout}>
            🚪 Logout
          </button>
        </div>

        {/* Main Content */}
        <div className="home-content">
          {/* Welcome Section */}
          <div className="welcome-card">
            <div className="welcome-icon">👋</div>
            <h2>Welcome, {user?.firstName || 'Admin'}!</h2>
            <p>Welcome to SmartShop POS System</p>
          </div>

          {/* Shop Details Card */}
          <div className="shop-details-card">
            <div className="card-header">
              <h3>🏢 Shop Information</h3>
            </div>

            <div className="shop-info-grid">
              {/* Shop Name */}
              <div className="info-item">
                <div className="info-icon">🏪</div>
                <div className="info-content">
                  <p className="info-label">Shop Name</p>
                  <p className="info-value">{shopInfo.name}</p>
                </div>
              </div>

              {/* Address */}
              <div className="info-item">
                <div className="info-icon">📍</div>
                <div className="info-content">
                  <p className="info-label">Address</p>
                  <p className="info-value">{shopInfo.address}</p>
                </div>
              </div>

              {/* Phone */}
              <div className="info-item">
                <div className="info-icon">📞</div>
                <div className="info-content">
                  <p className="info-label">Phone Number</p>
                  <p className="info-value">{shopInfo.phone}</p>
                </div>
              </div>

              {/* Email */}
              <div className="info-item">
                <div className="info-icon">📧</div>
                <div className="info-content">
                  <p className="info-label">Email</p>
                  <p className="info-value">{shopInfo.email}</p>
                </div>
              </div>

              {/* GST */}
              <div className="info-item">
                <div className="info-icon">📋</div>
                <div className="info-content">
                  <p className="info-label">GST Number</p>
                  <p className="info-value">{shopInfo.gst}</p>
                </div>
              </div>

              {/* Hours */}
              <div className="info-item">
                <div className="info-icon">🕐</div>
                <div className="info-content">
                  <p className="info-label">Business Hours</p>
                  <p className="info-value">{shopInfo.hours}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">💳</div>
              <p className="stat-label">Total Bills</p>
              <p className="stat-value">0</p>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📦</div>
              <p className="stat-label">Products</p>
              <p className="stat-value">5</p>
            </div>
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <p className="stat-label">Customers</p>
              <p className="stat-value">2</p>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <p className="stat-label">Total Sales</p>
              <p className="stat-value">₹0</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="home-footer">
          <p>© 2026 SmartShop Hardware Store. All rights reserved.</p>
          <p>Professional Point of Sale System</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
