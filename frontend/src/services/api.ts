import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const queryKeys = {
  users: ['users'],
  services: ['services'],
  professionals: ['professionals'],
  customers: ['customers'],
  suppliers: ['suppliers'],
  items: ['items'],
  promotions: ['promotions'],
  appointments: ['appointments'],
  commissions: ['commissions'],
  cashierTransactions: ['cashier-transactions'],
  accountsPayable: ['accounts-payable'],
  itemPrices: ['item-prices'],
  itemPriceHistories: ['item-price-histories'],
  states: ['states'],
};

export default api;

