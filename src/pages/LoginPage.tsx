import React, { useState } from 'react';
import './LoginPage.css';
import { API_BASE_URL } from '../utils/apiConfig';

interface LoginPageProps {
  onLogin: (user: any, token: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Login failed');
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      onLogin(data.user, data.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Animated Background */}
      <div className="login-bg-container">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
        <div className="gradient-orb orb-4"></div>
      </div>

      {/* Content */}
      <div className="login-content">
        <div className="login-container">
          {/* Left: Form Section */}
          <div className="login-form-section">
            {/* Logo & Branding */}
            <div className="logo-section">
              <div className="logo-icon-large">🏪</div>
              <h1 className="app-title">SmartShop<span className="pos-text">POS</span></h1>
              <p className="app-subtitle">Login</p>
              <p className="form-description">Please enter your login information.</p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="login-form">
              {/* Error Message */}
              {error && (
                <div className="error-alert">
                  <span className="alert-icon">❌</span>
                  <span className="alert-text">{error}</span>
                </div>
              )}

              {/* Username Field */}
              <div className="form-group">
                <label className="form-label">Admin Username</label>
                <div className="input-group">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter Email"
                    className="form-input"
                    disabled={loading}
                    required
                  />
                </div>
                <p className="field-hint">Your unique username</p>
              </div>

              {/* Password Field */}
              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-group">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter Password"
                    className="form-input"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                <p className="field-hint">Your strong password</p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className={`login-button ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    <span>Signing In...</span>
                  </>
                ) : (
                  'Login'
                )}
              </button>
            </form>
          </div>

          {/* Right: Illustration Section */}
          <div className="login-illustration-section">
            <div className="illustration-content">
              {/* Animated Store Icon */}
              <div className="store-icon-animation">
                <div className="store-roof">
                  <span>24H</span>
                </div>
                <div className="store-building">
                  <div className="store-window window-1"></div>
                  <div className="store-window window-2"></div>
                  <div className="store-door"></div>
                </div>
              </div>

              {/* Welcome Text */}
              <div className="welcome-text-container">
                <p className="welcome-title">
                  <span className="smart">SmartShop</span><span className="pos">POS</span>
                </p>
                <p className="welcome-subtitle">Your 24/7 Business Partner</p>
              </div>

              {/* Floating Features */}
              <div className="floating-features">
                <div className="feature-item feature-1">
                  <span className="feature-icon">📦</span>
                  <span className="feature-text">Inventory</span>
                </div>
                <div className="feature-item feature-2">
                  <span className="feature-icon">💳</span>
                  <span className="feature-text">Billing</span>
                </div>
                <div className="feature-item feature-3">
                  <span className="feature-icon">📊</span>
                  <span className="feature-text">Reports</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
