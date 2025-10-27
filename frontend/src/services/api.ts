import axios, { AxiosError, AxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api';
const SANCTUM_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
});

export type ApiError = { message: string; errors?: Record<string, string[]> };

export async function ensureCsrfCookie() {
  await axios.get(`${SANCTUM_BASE_URL}/sanctum/csrf-cookie`, {
    withCredentials: true,
  });
}

type RetryableConfig = AxiosRequestConfig & { _retry?: boolean };

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const config = error.config as RetryableConfig | undefined;

    if (error.response?.status === 419 && config && !config._retry) {
      config._retry = true;
      await ensureCsrfCookie();
      return api.request(config);
    }

    if (error.response?.status === 401) {
      // Let callers handle redirect/feedback when the session expires
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

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
  cashier: ['cashier'],
  accountsPayable: ['accounts-payable'],
  itemPrices: ['item-prices'],
  itemPriceHistories: ['item-price-histories'],
};
