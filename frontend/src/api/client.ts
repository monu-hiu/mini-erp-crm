import axios from 'axios';

// Set VITE_API_URL in a .env file when deploying (see .env.example).
const BASE_URL = import.meta.env.VITE_API_URL || 'https://mini-erp-crm-25u7.onrender.com';

export const apiClient = axios.create({ baseURL: BASE_URL });

// Attach JWT to every request, if we have one.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the token is invalid/expired, bounce back to login.
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Small helper to pull a readable message out of our backend's error shape.
export function getErrorMessage(err: any): string {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.errors?.[0]?.message ||
    err?.message ||
    'Something went wrong.'
  );
}
