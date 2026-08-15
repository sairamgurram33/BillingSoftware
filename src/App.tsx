import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import BillingPage from './pages/BillingPage';
import ProductManagement from './pages/ProductManagement';
import CustomerManagement from './pages/CustomerManagement';
import SalesHistory from './pages/SalesHistory';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import MainLayout from './layouts/MainLayout';
import { API_BASE_URL } from './utils/apiConfig';
import './App.css';

interface User {
  id: string;
  username: string;
  role: string;
  permissions: string[];
  firstName?: string;
  lastName?: string;
}

interface AppState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
}

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({
    isAuthenticated: false,
    user: null,
    loading: true,
  });

  useEffect(() => {
    // Check authentication on app load
    const checkAuth = async () => {
      const token = localStorage.getItem('token');

      if (token) {
        try {
          const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.ok) {
            const data = await response.json();
            setAppState({
              isAuthenticated: true,
              user: data.user,
              loading: false,
            });
          } else {
            localStorage.removeItem('token');
            setAppState({
              isAuthenticated: false,
              user: null,
              loading: false,
            });
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          setAppState((prev) => ({ ...prev, loading: false }));
        }
      } else {
        setAppState((prev) => ({ ...prev, loading: false }));
      }
    };

    checkAuth();
  }, []);

  const handleLogin = (user: User, token: string) => {
    localStorage.setItem('token', token);
    setAppState({
      isAuthenticated: true,
      user,
      loading: false,
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setAppState({
      isAuthenticated: false,
      user: null,
      loading: false,
    });
  };

  if (appState.loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading SmartShop POS...</p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Login Route */}
        <Route
          path="/login"
          element={
            appState.isAuthenticated ? (
              <Navigate to="/billing" />
            ) : (
              <LoginPage onLogin={handleLogin} />
            )
          }
        />

        {/* Protected Routes */}
        <Route
          path="/*"
          element={
            appState.isAuthenticated && appState.user ? (
              <MainLayout user={appState.user} onLogout={handleLogout}>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/billing" element={<BillingPage />} />
                  <Route path="/products" element={<ProductManagement />} />
                  <Route path="/customers" element={<CustomerManagement />} />
                  <Route path="/sales-history" element={<SalesHistory />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/" element={<Navigate to="/billing" />} />
                </Routes>
              </MainLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
