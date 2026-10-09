import { apiClient } from './apiClient';
import type { SfvCategoryCatalog } from '../types';

export async function getSfvCategoryCatalog(): Promise<SfvCategoryCatalog> {
  return apiClient.request<SfvCategoryCatalog>('/api/sfv-categories');
}
