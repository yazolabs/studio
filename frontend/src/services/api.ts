import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8010/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const authData = localStorage.getItem('salon_auth');
    if (authData) {
      try {
        const { token } = JSON.parse(authData);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Error parsing auth data:', error);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('salon_auth');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Query keys for TanStack Query
export const queryKeys = {
  users: ['users'],
  services: ['services'],
  items: ['items'],
  appointments: ['appointments'],
  itemPrices: ['item-prices'],
  itemPriceHistories: ['item-price-histories'],
};
