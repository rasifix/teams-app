import { apiClient } from './apiClient';
import type { Activity, ActivityInvitation, ActivityPayload } from '../types';
import { writeActivityIntent, rememberActivityRevision, type ActivityDetailsPatch } from './activityIntentService';

const activitiesPath = (activityId?: string, suffix = '') => `/activities${activityId ? `/${activityId}` : ''}${suffix}`;

export type InvitationUpdate = Pick<ActivityInvitation, 'response' | 'declineReason'>;

export async function getActivities(squadId: string): Promise<Activity[]> {
  return apiClient.request<Activity[]>(apiClient.getSquadEndpoint(squadId, activitiesPath()));
}

export async function getActivityById(squadId: string, id: string): Promise<Activity | null> {
  try {
    const response = await apiClient.requestWithMetadata<Activity>(apiClient.getSquadEndpoint(squadId, activitiesPath(id)));
    rememberActivityRevision(squadId, id, response.headers.get('ETag'));
    return response.data;
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    throw error;
  }
}

export async function createActivity(
  squadId: string,
  payload: ActivityPayload,
  idempotencyKey: string = crypto.randomUUID(),
): Promise<Activity> {
  return apiClient.request<Activity>(apiClient.getSquadEndpoint(squadId, activitiesPath()), {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify(payload),
  });
}

export async function updateActivity(squadId: string, id: string, payload: ActivityDetailsPatch): Promise<Activity> {
  return writeActivityIntent(squadId, id, { type: 'details', changes: payload });
}

export async function deleteActivity(squadId: string, id: string): Promise<void> {
  return apiClient.request<void>(apiClient.getSquadEndpoint(squadId, activitiesPath(id)), { method: 'DELETE' });
}

export async function updateActivityStatus(
  squadId: string,
  id: string,
  status: Activity['status'],
): Promise<Activity> {
  return writeActivityIntent(squadId, id, { type: 'status', status });
}

export async function cancelActivity(squadId: string, id: string): Promise<Activity> {
  return updateActivityStatus(squadId, id, 'cancelled');
}

export async function restoreActivity(squadId: string, id: string): Promise<Activity> {
  return updateActivityStatus(squadId, id, 'active');
}

export async function updateActivityInvitation(
  squadId: string,
  id: string,
  playerId: string,
  update: InvitationUpdate,
): Promise<Activity> {
  return writeActivityIntent(squadId, id, { type: 'invitationResponse', playerId, update });
}

export async function markActivitySelectionSent(squadId: string, id: string): Promise<Activity> {
  return writeActivityIntent(squadId, id, { type: 'selectionSent' });
}
