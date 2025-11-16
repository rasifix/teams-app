import { API_CONFIG } from '../config/api';

class ApiClient {
  private baseUrl: string;
  private groupId: string;

  constructor() {
    this.baseUrl = API_CONFIG.baseUrl;
    this.groupId = API_CONFIG.defaultGroupId;
  }

  async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Get token from localStorage
    const token = localStorage.getItem('token');
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
      // If unauthorized, clear token and redirect to login
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
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
      console.warn('Failed to parse JSON response:', text);
      return undefined as T;
    }
  }

  getGroupEndpoint(path: string): string {
    return `/api/groups/${this.groupId}${path}`;
  }
}

export const apiClient = new ApiClient();