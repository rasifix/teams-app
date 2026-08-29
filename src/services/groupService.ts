import { apiClient } from './apiClient';
import type { CreateGroupRequest, Formation, FormationSlot, Group, Period, PlayingMode, PositionCode } from '../types';

/**
 * Service layer for group data operations.
 * This provides an abstraction layer that handles API communication
 * for group-related operations.
 */

const normalizeGroup = (group: Group): Group => ({
  ...group,
  periods: group.periods ?? [],
  matchPlanningEnabled: group.matchPlanningEnabled ?? false,
  playingModes: group.playingModes ?? [],
  formations: group.formations ?? [],
});

export async function getGroup(groupId: string): Promise<Group> {
  const group = await apiClient.request<Group>(`/api/groups/${groupId}`);
  return normalizeGroup(group);
}

export async function getGroups(): Promise<Group[]> {
  const groups = await apiClient.request<Group[]>('/api/groups');
  return groups.map(normalizeGroup);
}

export async function createGroup(groupData: CreateGroupRequest): Promise<Group> {
  const group = await apiClient.request<Group>('/api/groups', {
    method: 'POST',
    body: JSON.stringify(groupData),
  });

  return normalizeGroup(group);
}

export async function setMatchPlanningEnabled(groupId: string, matchPlanningEnabled: boolean): Promise<Group> {
  const group = await apiClient.request<Group>(`/api/groups/${groupId}`, {
    method: 'PUT',
    body: JSON.stringify({ matchPlanningEnabled }),
  });

  return normalizeGroup(group);
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

interface GroupPlayingModePayload {
  name: string;
  numberOfPeriods: number;
  periodLengthMinutes: number;
}

export async function addGroupPlayingMode(groupId: string, data: GroupPlayingModePayload): Promise<PlayingMode> {
  return apiClient.request<PlayingMode>(`/api/groups/${groupId}/playing-modes`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateGroupPlayingMode(groupId: string, playingModeId: string, data: GroupPlayingModePayload): Promise<PlayingMode> {
  return apiClient.request<PlayingMode>(`/api/groups/${groupId}/playing-modes/${playingModeId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteGroupPlayingMode(groupId: string, playingModeId: string): Promise<void> {
  await apiClient.request<void>(`/api/groups/${groupId}/playing-modes/${playingModeId}`, {
    method: 'DELETE',
  });
}

export async function setDefaultGroupPlayingMode(groupId: string, playingModeId: string): Promise<PlayingMode> {
  return apiClient.request<PlayingMode>(`/api/groups/${groupId}/playing-modes/${playingModeId}/set-default`, {
    method: 'POST',
  });
}

interface GroupFormationSlotPayload {
  id?: string;
  positionCode: PositionCode;
}

interface GroupFormationPayload {
  name: string;
  slots: GroupFormationSlotPayload[];
}

export async function addGroupFormation(groupId: string, data: GroupFormationPayload): Promise<Formation> {
  return apiClient.request<Formation>(`/api/groups/${groupId}/formations`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateGroupFormation(groupId: string, formationId: string, data: GroupFormationPayload): Promise<Formation> {
  return apiClient.request<Formation>(`/api/groups/${groupId}/formations/${formationId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteGroupFormation(groupId: string, formationId: string): Promise<void> {
  await apiClient.request<void>(`/api/groups/${groupId}/formations/${formationId}`, {
    method: 'DELETE',
  });
}

export type { FormationSlot };