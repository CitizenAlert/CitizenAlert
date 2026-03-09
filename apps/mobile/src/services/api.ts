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

const EXPO_PUBLIC_API_URL = getApiUrl();

/**
 * Base URL of the API server (e.g. http://10.141.112.51:3001) without /api.
 * Used to rewrite image URLs so the device can load them (e.g. MinIO at :9000 on same host).
 */
export function getApiBaseUrl(): string {
  const url = EXPO_PUBLIC_API_URL.replace(/\/api\/?$/, '');
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.hostname}`;
  } catch {
    return url;
  }
}

/**
 * Rewrite image URL so it's loadable from the device.
 * Images are now served via API: /hazards/image/{hazardId}
 * This constructs the full URL using the API base.
 */
export function getImageUrlForDevice(imageUrl: string | undefined): string | undefined {
  if (!imageUrl) return undefined;
  
  // If imageUrl is already a full URL (starts with http), return as-is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // If it's a relative API path (starts with /), prepend the API base URL
  if (imageUrl.startsWith('/')) {
    const apiBase = getApiBaseUrl();
    return `${apiBase}${imageUrl}`;
  }
  
  // Fallback for old URLs or other formats
  return imageUrl;
}

export const api = axios.create({
  baseURL: EXPO_PUBLIC_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    // Set explicitly to multipart/form-data — React Native adds the boundary
    config.headers.set('Content-Type', 'multipart/form-data');
  }
  return config;
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
