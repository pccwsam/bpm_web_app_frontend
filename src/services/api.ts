import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const AWS_API_URL = import.meta.env.VITE_AWS_API_URL || 'https://osuunaqrhe.execute-api.ap-east-1.amazonaws.com/dev';

// Endpoints that should be routed directly to AWS Serverless
const migratedEndpoints = [
  '/api/health',
  '/api/jobs',
  '/api/auth',
  '/api/master-data',
  '/api/validation',
  '/api/commission',
  '/api/upload'
];

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important: send cookies with requests
});

// Request interceptor to route migrated APIs and add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Dynamically route to AWS for migrated endpoints
    if (config.url) {
      const isMigrated = migratedEndpoints.some(endpoint => config.url?.startsWith(endpoint));
      if (isMigrated) {
        config.baseURL = AWS_API_URL;
      } else {
        config.baseURL = API_BASE_URL;
      }
    }

    // No need to manually add Authorization header
    // httpOnly cookies are sent automatically
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token using cookie
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/api/auth/demo/refresh`,
          {},
          { withCredentials: true }
        );

        if (refreshResponse.data) {
          // Retry the original request (cookies are sent automatically)
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - user needs to re-login
        console.error('Token refresh failed, redirecting to login');
        useAuthStore.getState().logout();
        // Only redirect if not already on login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    // For other 401 errors (or if refresh failed)
    if (error.response?.status === 401) {
      // Only logout and redirect if not on login page
      if (window.location.pathname !== '/login') {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
