import { apiClient } from './apiClient';
import type { Group } from '../types';

/**
 * Service layer for group data operations.
 * This provides an abstraction layer that handles API communication
 * for group-related operations.
 */

export async function getGroup(groupId: string): Promise<Group> {
  return apiClient.request<Group>(`/api/groups/${groupId}`);
}

export async function getGroups(): Promise<Group[]> {
  return apiClient.request<Group[]>('/api/groups');
}