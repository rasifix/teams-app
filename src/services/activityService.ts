import { apiClient } from './apiClient';
import type { Activity, ActivityAttendance, ActivityPayload, ActivityInvitation, Team } from '../types';

const activitiesPath = (activityId?: string, suffix = '') => `/activities${activityId ? `/${activityId}` : ''}${suffix}`;

export type InvitationUpdate = Pick<ActivityInvitation, 'response' | 'declineReason'>;

export async function getActivities(squadId: string): Promise<Activity[]> {
  return apiClient.request<Activity[]>(apiClient.getSquadEndpoint(squadId, activitiesPath()));
}

export async function getActivityById(squadId: string, id: string): Promise<Activity | null> {
  try {
    return await apiClient.request<Activity>(apiClient.getSquadEndpoint(squadId, activitiesPath(id)));
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    throw error;
  }
}

export async function createActivity(squadId: string, payload: ActivityPayload): Promise<Activity> {
  return apiClient.request<Activity>(apiClient.getSquadEndpoint(squadId, activitiesPath()), {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateActivity(squadId: string, id: string, payload: Partial<ActivityPayload>): Promise<Activity> {
  return apiClient.request<Activity>(apiClient.getSquadEndpoint(squadId, activitiesPath(id)), {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteActivity(squadId: string, id: string): Promise<void> {
  return apiClient.request<void>(apiClient.getSquadEndpoint(squadId, activitiesPath(id)), { method: 'DELETE' });
}

export async function updateActivityStatus(
  squadId: string,
  id: string,
  status: Activity['status'],
): Promise<Activity> {
  return apiClient.request<Activity>(apiClient.getSquadEndpoint(squadId, activitiesPath(id, '/status')), {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
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
  return apiClient.request<Activity>(
    apiClient.getSquadEndpoint(squadId, activitiesPath(id, `/invitations/${playerId}`)),
    { method: 'PUT', body: JSON.stringify(update) },
  );
}

/** The backend answers `PUT /teams` with the saved teams, not the whole activity. */
export async function updateActivityTeams(squadId: string, id: string, teams: Team[]): Promise<Team[]> {
  return apiClient.request<Team[]>(apiClient.getSquadEndpoint(squadId, activitiesPath(id, '/teams')), {
    method: 'PUT',
    body: JSON.stringify({ teams }),
  });
}

export async function updateActivitySelection(squadId: string, id: string, teams: Team[]): Promise<Activity> {
  return apiClient.request<Activity>(apiClient.getSquadEndpoint(squadId, activitiesPath(id, '/selection')), {
    method: 'PUT',
    body: JSON.stringify({ teams }),
  });
}

export async function markActivitySelectionSent(squadId: string, id: string): Promise<Activity> {
  return apiClient.request<Activity>(apiClient.getSquadEndpoint(squadId, activitiesPath(id, '/selection/sent')), {
    method: 'PUT',
  });
}

export async function updateActivityAttendance(squadId: string, id: string, attendance: ActivityAttendance[]): Promise<ActivityAttendance[]> {
  return apiClient.request<ActivityAttendance[]>(apiClient.getSquadEndpoint(squadId, activitiesPath(id, '/attendance')), {
    method: 'PUT',
    body: JSON.stringify({ attendance }),
  });
}
