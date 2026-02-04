import { getErrorMessage } from '@/utils/errorHandler';
import axios, { AxiosError } from 'axios';
import Constants from 'expo-constants';

/**
 * Get API URL from environment variables or config
 * Priority:
 * 1. EXPO_PUBLIC_API_URL environment variable (from .env)
 * 2. apiUrl from app.json extra config
 * 3. localhost fallback for development
 */
function getApiUrl(): string {
  // @ts-ignore - process.env is available in Expo for EXPO_PUBLIC_ variables
  const envApiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!envApiUrl) {
    throw new Error(
      'EXPO_PUBLIC_API_URL not set. Check your .env file and restart Expo with: pnpm --filter mobile start -c'
    );
  }
  const url = envApiUrl.endsWith('/api') ? envApiUrl : `${envApiUrl}/api`;
  console.log('🔗 Using API URL:', url);
  return url;
}

const API_URL = getApiUrl();

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Transform error to include user-friendly message
    const userMessage = getErrorMessage(error);
    const enhancedError = new Error(userMessage) as any;
    enhancedError.isAxiosError = true;
    enhancedError.response = error.response;
    enhancedError.request = error.request;
    enhancedError.config = error.config;
    return Promise.reject(enhancedError);
  }
);

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};
