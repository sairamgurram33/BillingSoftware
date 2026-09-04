// API Configuration - Centralized for deployment flexibility
// In production, REACT_APP_API_URL must be set during build time
// In development, defaults to localhost
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Validate that API URL is configured in production
if (process.env.NODE_ENV === 'production' && !process.env.REACT_APP_API_URL) {
  console.warn('Warning: REACT_APP_API_URL not set. Frontend may fail to communicate with backend.');
}
