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
      return 'Impossible de se connecter au serveur. Veuillez vérifier que l\'API est en cours d\'exécution et que l\'URL est correcte.';
    }
    if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      return 'Délai d\'attente dépassé. Veuillez vérifier votre connexion Internet et réessayer.';
    }
    if (error.message.includes('Network Error')) {
      return 'Erreur réseau. Veuillez vérifier votre connexion Internet.';
    }
    return `Erreur de connexion: ${error.message}`;
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
      return data?.message || 'Non autorisé. Veuillez vérifier vos identifiants.';
    case 403:
      return data?.message || 'Interdit. Vous n\'avez pas la permission d\'effectuer cette action.';
    case 404:
      return data?.message || 'Ressource non trouvée.';
    case 409:
      return data?.message || 'Conflit. Cette ressource existe déjà.';
    case 422:
      return data?.message || extractValidationErrors(data as NestJSValidationError);
    case 500:
      return 'Erreur serveur. Veuillez réessayer plus tard.';
    case 503:
      return 'Service indisponible. Veuillez réessayer plus tard.';
    default:
      return data?.message || `Erreur ${status}: ${error.message}`;
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
  return 'Une erreur inattendue s\'est produite. Veuillez réessayer.';
}
