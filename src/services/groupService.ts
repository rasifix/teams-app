import { apiClient } from './apiClient';
import type { Group, Period } from '../types';

/**
 * Service layer for group data operations.
 * This provides an abstraction layer that handles API communication
 * for group-related operations.
 */

const normalizeGroup = (group: Group): Group => ({
  ...group,
  periods: group.periods ?? [],
});

export async function getGroup(groupId: string): Promise<Group> {
  const group = await apiClient.request<Group>(`/api/groups/${groupId}`);
  return normalizeGroup(group);
}

export async function getGroups(): Promise<Group[]> {
  const groups = await apiClient.request<Group[]>('/api/groups');
  return groups.map(normalizeGroup);
}

interface GroupPeriodPayload {
  name: string;
  startDate: string;
  endDate: string;
}

export async function addGroupPeriod(groupId: string, periodData: GroupPeriodPayload): Promise<Period> {
  return apiClient.request<Period>(`/api/groups/${groupId}/periods`, {
    method: 'POST',
    body: JSON.stringify(periodData),
  });
}

export async function updateGroupPeriod(groupId: string, periodId: string, periodData: GroupPeriodPayload): Promise<Period> {
  return apiClient.request<Period>(`/api/groups/${groupId}/periods/${periodId}`, {
    method: 'PUT',
    body: JSON.stringify(periodData),
  });
}

export async function deleteGroupPeriod(groupId: string, periodId: string): Promise<void> {
  await apiClient.request<void>(`/api/groups/${groupId}/periods/${periodId}`, {
    method: 'DELETE',
  });
}