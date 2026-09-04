import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../utils/apiConfig';
import './Dashboard.css';

interface DashboardStats {
  totalSales: number;
  totalBills: number;
  totalItems: number;
  totalProducts: number;
  totalCustomers: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalBills: 0,
    totalItems: 0,
    totalProducts: 0,
    totalCustomers: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');

      // Set up AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${API_BASE_URL}/reports/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        console.error('Failed to fetch stats:', response.status);
        // Show partial data on error
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Dashboard stats fetch timeout');
      } else {
        console.error('Failed to fetch stats:', error);
      }
      // Don't set error - let dashboard render with default stats
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="dashboard">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome back! Here's your business overview.</p>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <p className="stat-label">Total Sales</p>
            <p className="stat-value">₹{(stats.totalSales || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🧾</div>
          <div className="stat-content">
            <p className="stat-label">Total Bills</p>
            <p className="stat-value">{stats.totalBills || 0}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <p className="stat-label">Total Items Sold</p>
            <p className="stat-value">{stats.totalItems || 0}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <p className="stat-label">Total Products</p>
            <p className="stat-value">{stats.totalProducts || 0}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <p className="stat-label">Total Customers</p>
            <p className="stat-value">{stats.totalCustomers || 0}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="section-card">
          <h2>Quick Actions</h2>
          <div className="quick-actions">
            <button
              className="action-btn"
              onClick={() => navigate('/billing')}
            >
              Create Bill
            </button>
            <button
              className="action-btn"
              onClick={() => navigate('/products')}
            >
              Add Product
            </button>
            <button
              className="action-btn"
              onClick={() => navigate('/customers')}
            >
              Add Customer
            </button>
            <button
              className="action-btn"
              onClick={() => navigate('/reports')}
            >
              View Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
