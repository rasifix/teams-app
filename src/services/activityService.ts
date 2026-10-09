import { apiClient } from './apiClient';
import type { Activity, ActivityAttendance, ActivityPayload, ActivityInvitation, Team } from '../types';

const activitiesPath = (activityId?: string, suffix = '') => `/activities${activityId ? `/${activityId}` : ''}${suffix}`;

export type InvitationUpdate = Pick<ActivityInvitation, 'response' | 'declineReason'>;

export async function getActivities(groupId: string): Promise<Activity[]> {
  return apiClient.request<Activity[]>(apiClient.getGroupEndpoint(groupId, activitiesPath()));
}

export async function getActivityById(groupId: string, id: string): Promise<Activity | null> {
  try {
    return await apiClient.request<Activity>(apiClient.getGroupEndpoint(groupId, activitiesPath(id)));
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    throw error;
  }
}

export async function createActivity(groupId: string, payload: ActivityPayload): Promise<Activity> {
  return apiClient.request<Activity>(apiClient.getGroupEndpoint(groupId, activitiesPath()), {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateActivity(groupId: string, id: string, payload: Partial<ActivityPayload>): Promise<Activity> {
  return apiClient.request<Activity>(apiClient.getGroupEndpoint(groupId, activitiesPath(id)), {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteActivity(groupId: string, id: string): Promise<void> {
  return apiClient.request<void>(apiClient.getGroupEndpoint(groupId, activitiesPath(id)), { method: 'DELETE' });
}

export async function updateActivityInvitation(
  groupId: string,
  id: string,
  playerId: string,
  update: InvitationUpdate,
): Promise<Activity> {
  return apiClient.request<Activity>(
    apiClient.getGroupEndpoint(groupId, activitiesPath(id, `/invitations/${playerId}`)),
    { method: 'PUT', body: JSON.stringify(update) },
  );
}

/** The backend answers `PUT /teams` with the saved teams, not the whole activity. */
export async function updateActivityTeams(groupId: string, id: string, teams: Team[]): Promise<Team[]> {
  return apiClient.request<Team[]>(apiClient.getGroupEndpoint(groupId, activitiesPath(id, '/teams')), {
    method: 'PUT',
    body: JSON.stringify({ teams }),
  });
}

export async function updateActivitySelection(groupId: string, id: string, teams: Team[]): Promise<Activity> {
  return apiClient.request<Activity>(apiClient.getGroupEndpoint(groupId, activitiesPath(id, '/selection')), {
    method: 'PUT',
    body: JSON.stringify({ teams }),
  });
}

export async function markActivitySelectionSent(groupId: string, id: string): Promise<Activity> {
  return apiClient.request<Activity>(apiClient.getGroupEndpoint(groupId, activitiesPath(id, '/selection/sent')), {
    method: 'PUT',
  });
}

export async function updateActivityAttendance(groupId: string, id: string, attendance: ActivityAttendance[]): Promise<ActivityAttendance[]> {
  return apiClient.request<ActivityAttendance[]>(apiClient.getGroupEndpoint(groupId, activitiesPath(id, '/attendance')), {
    method: 'PUT',
    body: JSON.stringify({ attendance }),
  });
}
