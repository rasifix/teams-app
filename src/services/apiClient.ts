import { API_CONFIG } from '../config/api';
import {
  clearSessionAndRedirectToLogin,
  isAuthenticationFailure,
  isJwtExpired,
} from './authSession';

/** Squad-scoped API base path (`/api/squads` remains a deprecated backend alias). */
export const SQUADS_PATH = '/api/squads';

const SPOND_PROXY_ENDPOINTS = new Set([
  '/api/integrations/spond/groups',
  '/api/integrations/spond/snapshot',
]);

interface ApiErrorBody {
  error?: unknown;
  message?: unknown;
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.baseUrl;
  }

  async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // Check if this is a protected endpoint (all endpoints except auth-related ones)
    const isProtectedEndpoint = !endpoint.startsWith('/api/auth/') && !endpoint.startsWith('/health');
    
    // Fail fast and restore the login flow when the local session is missing or expired.
    if (isProtectedEndpoint && (!token || isJwtExpired(token))) {
      clearSessionAndRedirectToLogin();
      throw new Error('Authentication required. Please log in.');
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Merge with any additional headers from options
    if (options?.headers) {
      Object.assign(headers, options.headers);
    }
    
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null) as ApiErrorBody | null;
      const errorCode = typeof errorBody?.error === 'string' ? errorBody.error : null;
      const isSpondProxyEndpoint = SPOND_PROXY_ENDPOINTS.has(endpoint);

      // Spond proxy authentication failures use HTTP 401 too, but they refer
      // to the supplied Spond credentials rather than the app session.
      if (isProtectedEndpoint && !isSpondProxyEndpoint && isAuthenticationFailure(response.status, token)) {
        clearSessionAndRedirectToLogin();
      }

      if (isSpondProxyEndpoint && errorCode?.startsWith('SPOND_')) {
        throw new Error(errorCode);
      }

      throw new Error(`API Error: ${response.status} - ${response.statusText}`);
    }

    // Handle empty responses (common for DELETE requests)
    const contentType = response.headers.get('content-type');
    if (response.status === 204 || !contentType?.includes('application/json')) {
      return undefined as T;
    }

    // Check if response has content
    const text = await response.text();
    if (!text) {
      return undefined as T;
    }

    try {
      return JSON.parse(text);
    } catch (error) {
      console.warn('Failed to parse JSON response:', error);
      return undefined as T;
    }
  }

  getSquadEndpoint(squadId: string, path = ''): string {
    return `${SQUADS_PATH}/${squadId}${path}`;
  }
}

export const apiClient = new ApiClient();
