import { AxiosError } from 'axios';

/**
 * NestJS validation error response structure
 */
interface NestJSValidationError {
  message: string | string[] | Array<{ property: string; constraints: Record<string, string> }>;
  error: string;
  statusCode: number;
}

/**
 * Extract detailed error message from NestJS validation errors
 */
function extractValidationErrors(error: NestJSValidationError): string {
  if (!error.message) {
    return error.error || 'Validation failed';
  }

  // If message is a string, return it
  if (typeof error.message === 'string') {
    return error.message;
  }

  // If message is an array of strings
  if (Array.isArray(error.message) && error.message.length > 0) {
    // Check if it's an array of constraint objects
    const firstItem = error.message[0];
    if (typeof firstItem === 'object' && firstItem !== null && 'constraints' in firstItem) {
      // Extract constraint messages
      const messages: string[] = [];
      error.message.forEach((item: any) => {
        if (item.constraints) {
          messages.push(...Object.values(item.constraints));
        }
      });
      return messages.join('. ');
    }
    // Array of strings
    return error.message.join('. ');
  }

  return error.error || 'Validation failed';
}

/**
 * Get user-friendly error message from network errors
 */
function getNetworkErrorMessage(error: AxiosError): string {
  if (!error.response) {
    // Network error (no response from server)
    if (error.code === 'ECONNREFUSED') {
      return 'Cannot connect to server. Please check if the API is running and the URL is correct.';
    }
    if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      return 'Request timed out. Please check your internet connection and try again.';
    }
    if (error.message.includes('Network Error')) {
      return 'Network error. Please check your internet connection.';
    }
    return `Connection error: ${error.message}`;
  }

  // Server responded with error
  const status = error.response.status;
  const data = error.response.data as any;

  // Handle NestJS validation errors
  if (status === 400 && data && (data.message || data.error)) {
    return extractValidationErrors(data as NestJSValidationError);
  }

  // Handle other HTTP status codes
  switch (status) {
    case 401:
      return data?.message || 'Unauthorized. Please check your credentials.';
    case 403:
      return data?.message || 'Forbidden. You do not have permission to perform this action.';
    case 404:
      return data?.message || 'Resource not found.';
    case 409:
      return data?.message || 'Conflict. This resource already exists.';
    case 422:
      return data?.message || extractValidationErrors(data as NestJSValidationError);
    case 500:
      return 'Server error. Please try again later.';
    case 503:
      return 'Service unavailable. Please try again later.';
    default:
      return data?.message || `Error ${status}: ${error.message}`;
  }
}

/**
 * Extract user-friendly error message from axios error
 */
export function getErrorMessage(error: unknown): string {
  // Axios error
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    return getNetworkErrorMessage(error as AxiosError);
  }

  // Standard Error object
  if (error instanceof Error) {
    return error.message;
  }

  // String error
  if (typeof error === 'string') {
    return error;
  }

  // Unknown error format
  return 'An unexpected error occurred. Please try again.';
}
