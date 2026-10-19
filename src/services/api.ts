import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to attach Authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cloudhouse_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept responses for auth expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthRoute = window.location.pathname === '/login';
      if (!isAuthRoute) {
        localStorage.removeItem('cloudhouse_token');
        localStorage.removeItem('cloudhouse_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
