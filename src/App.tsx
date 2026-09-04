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
  error: string | null;
  retryCount: number;
}

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({
    isAuthenticated: false,
    user: null,
    loading: true,
    error: null,
    retryCount: 0,
  });

  const checkAuth = async (isRetry: boolean = false) => {
    const token = localStorage.getItem('token');

    if (token) {
      try {
        // Set up AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          setAppState({
            isAuthenticated: true,
            user: data.user,
            loading: false,
            error: null,
            retryCount: 0,
          });
        } else if (response.status === 401) {
          // Invalid token - logout
          localStorage.removeItem('token');
          setAppState({
            isAuthenticated: false,
            user: null,
            loading: false,
            error: null,
            retryCount: 0,
          });
        } else {
          throw new Error(`Server error: ${response.status}`);
        }
      } catch (error) {
        const isTimeout = error instanceof Error && error.name === 'AbortError';
        const errorMsg = isTimeout ? 'Server is taking too long to respond' : 'Unable to connect to server';

        console.error('Auth check failed:', errorMsg, error);

        // Show error state and allow retry
        setAppState(prev => ({
          isAuthenticated: false,
          user: null,
          loading: false,
          error: errorMsg,
          retryCount: isRetry ? prev.retryCount : prev.retryCount + 1,
        }));

        // Automatically retry once after 2 seconds on first failure
        if (!isRetry && appState.retryCount === 0) {
          setTimeout(() => {
            checkAuth(true);
          }, 2000);
        }
      }
    } else {
      setAppState(prev => ({ ...prev, loading: false, error: null, retryCount: 0 }));
    }
  };

  useEffect(() => {
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

  // Show error state if auth check failed
  if (appState.error && !appState.isAuthenticated) {
    return (
      <div className="loading-container">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
          <p style={{ fontSize: '16px', color: '#e74c3c', marginBottom: '10px' }}>
            {appState.error}
          </p>
          <p style={{ fontSize: '13px', color: '#7f8c8d', marginBottom: '20px' }}>
            The server may be starting up or is temporarily unavailable.
          </p>
          <button
            onClick={() => {
              setAppState(prev => ({ ...prev, loading: true, error: null }));
              checkAuth();
            }}
            style={{
              padding: '10px 20px',
              background: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            🔄 Retry
          </button>
          <p style={{ fontSize: '12px', color: '#95a5a6', marginTop: '15px' }}>
            Attempt {appState.retryCount + 1}
          </p>
        </div>
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
