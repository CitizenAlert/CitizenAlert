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

/**
 * Base URL of the API server (e.g. http://10.141.112.100:3001) without /api.
 * Used to rewrite image URLs so the device can load them (e.g. MinIO at :9000 on same host).
 */
export function getApiBaseUrl(): string {
  const url = API_URL.replace(/\/api\/?$/, '');
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.hostname}`;
  } catch {
    return url;
  }
}

/**
 * Rewrite image URL so it's loadable from the device (e.g. replace localhost with API host).
 */
export function getImageUrlForDevice(imageUrl: string | undefined): string | undefined {
  if (!imageUrl) return undefined;
  try {
    const parsed = new URL(imageUrl);
    if (
      parsed.hostname !== 'localhost' &&
      parsed.hostname !== '127.0.0.1' &&
      parsed.hostname !== 'minio'
    ) return imageUrl;
    const base = getApiBaseUrl();
    const baseParsed = new URL(base);
    parsed.hostname = baseParsed.hostname;
    return parsed.toString();
  } catch {
    return imageUrl;
  }
}

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// When sending FormData, let the client set Content-Type (multipart/form-data with boundary)
api.interceptors.request.use((config) => {
  if (config.data instanceof FormData && config.headers) {
    const headers: any = config.headers;
    if (typeof headers.delete === 'function') {
      headers.delete('Content-Type');
      headers.delete('content-type');
    } else {
      delete headers['Content-Type'];
      delete headers['content-type'];
    }
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
