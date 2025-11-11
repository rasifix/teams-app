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
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} - ${response.statusText}`);
    }

    return response.json();
  }

  getGroupEndpoint(path: string): string {
    return `/groups/${this.groupId}${path}`;
  }
}

export const apiClient = new ApiClient();