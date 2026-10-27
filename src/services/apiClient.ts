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

export interface ApiResponse<T> {
  data: T;
  headers: Headers;
}

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, statusText: string) {
    super(`API Error: ${status} - ${statusText}`);
    this.name = 'ApiError';
    this.status = status;
  }
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.baseUrl;
  }

  async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return (await this.requestWithMetadata<T>(endpoint, options)).data;
  }

  async requestWithMetadata<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
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

      throw new ApiError(response.status, response.statusText);
    }

    // Handle empty responses (common for DELETE requests)
    const contentType = response.headers.get('content-type');
    if (response.status === 204 || !contentType?.includes('application/json')) {
      return { data: undefined as T, headers: response.headers };
    }

    // Check if response has content
    const text = await response.text();
    if (!text) {
      return { data: undefined as T, headers: response.headers };
    }

    try {
      return { data: JSON.parse(text) as T, headers: response.headers };
    } catch (error) {
      console.warn('Failed to parse JSON response:', error);
      return { data: undefined as T, headers: response.headers };
    }
  }

  getSquadEndpoint(squadId: string, path = ''): string {
    return `${SQUADS_PATH}/${squadId}${path}`;
  }
}

export const apiClient = new ApiClient();
