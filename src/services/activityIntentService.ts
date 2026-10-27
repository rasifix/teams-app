import type {
  Activity,
  ActivityAttendance,
  ActivityInvitation,
  SelectionRemovalReason,
  Team,
  TeamLineupPeriod,
} from '../types';
import { apiClient } from './apiClient';

export type ActivityDetailsPatch = Partial<Pick<Activity, 'kind' | 'name' | 'startsAt' | 'minPlayersPerTeam' | 'maxPlayersPerTeam'>> & Partial<Record<'endsAt' | 'location' | 'opponentName' | 'matchFormatId', string | null>>;
type TeamDetailsPatch = Partial<Pick<Team, 'name' | 'strength'>> & Partial<Record<'startTime' | 'location' | 'meetingTime' | 'meetingLocation', string | null>>;

export type ActivityIntent =
  | { type: 'details'; changes: ActivityDetailsPatch }
  | { type: 'status'; status: Activity['status'] }
  | { type: 'selectionSent' }
  | { type: 'invitationResponse'; playerId: string; update: Pick<ActivityInvitation, 'response' | 'declineReason'> }
  | { type: 'addTeam'; team: Pick<Team, 'id' | 'name'> & Partial<Pick<Team, 'strength' | 'startTime'>> }
  | { type: 'teamDetails'; teamId: string; changes: TeamDetailsPatch }
  | { type: 'responsiblePerson'; teamId: string; responsiblePersonId: string | null }
  | { type: 'formation'; teamId: string; formationId: string | null }
  | { type: 'shirts'; teamId: string; shirtSetId: string; assignments: NonNullable<Team['shirtAssignments']> }
  | { type: 'lineup'; teamId: string; periods: TeamLineupPeriod[] }
  | { type: 'selection'; teamId: string; add: string[]; remove: Array<{ playerId: string; reason?: SelectionRemovalReason }> }
  | { type: 'addInvitations'; players: Array<{ playerId: string; response: ActivityInvitation['response'] }> }
  | { type: 'removeInvitation'; playerId: string }
  | { type: 'attendance'; changes: Array<{ personId: string; status: ActivityAttendance['status'] | null; reason?: ActivityAttendance['reason'] }> };

const revisions = new Map<string, string>();
const cacheKey = (squadId: string, activityId: string) => `${squadId}:${activityId}`;

function endpointFor(activityId: string, intent: ActivityIntent): { path: string; method: string; body?: unknown } {
  const base = `/activities/${encodeURIComponent(activityId)}`;
  switch (intent.type) {
    case 'status': return { path: `${base}/status`, method: 'PUT', body: { status: intent.status } };
    case 'selectionSent': return { path: `${base}/selection/sent`, method: 'PUT' };
    case 'invitationResponse': return { path: `${base}/invitations/${encodeURIComponent(intent.playerId)}`, method: 'PUT', body: intent.update };
    case 'details': return { path: `${base}/details`, method: 'PATCH', body: intent.changes };
    case 'addTeam': return { path: `${base}/teams`, method: 'POST', body: intent.team };
    case 'teamDetails': return { path: `${base}/teams/${encodeURIComponent(intent.teamId)}/details`, method: 'PATCH', body: intent.changes };
    case 'responsiblePerson': return { path: `${base}/teams/${encodeURIComponent(intent.teamId)}/responsible-person`, method: 'PUT', body: { responsiblePersonId: intent.responsiblePersonId } };
    case 'formation': return { path: `${base}/teams/${encodeURIComponent(intent.teamId)}/formation`, method: 'PUT', body: { formationId: intent.formationId } };
    case 'shirts': return { path: `${base}/teams/${encodeURIComponent(intent.teamId)}/shirts`, method: 'PUT', body: { shirtSetId: intent.shirtSetId, assignments: intent.assignments } };
    case 'lineup': return { path: `${base}/teams/${encodeURIComponent(intent.teamId)}/lineup`, method: 'PUT', body: { periods: intent.periods } };
    case 'selection': return { path: `${base}/teams/${encodeURIComponent(intent.teamId)}/selection-changes`, method: 'POST', body: { add: intent.add, remove: intent.remove } };
    case 'addInvitations': return { path: `${base}/invitations`, method: 'POST', body: { players: intent.players } };
    case 'removeInvitation': return { path: `${base}/invitations/${encodeURIComponent(intent.playerId)}`, method: 'DELETE' };
    case 'attendance': return { path: `${base}/attendance`, method: 'PATCH', body: { changes: intent.changes } };
  }
}

export async function writeActivityIntent(squadId: string, activityId: string, intent: ActivityIntent): Promise<Activity> {
  const key = cacheKey(squadId, activityId);
  if (!revisions.has(key)) {
    const initial = await apiClient.requestWithMetadata<Activity>(apiClient.getSquadEndpoint(squadId, `/activities/${encodeURIComponent(activityId)}`));
    rememberActivityRevision(squadId, activityId, initial.headers.get('ETag'));
  }
  const { path, method, body } = endpointFor(activityId, intent);
  const etag = revisions.get(key);
  try {
    const response = await apiClient.requestWithMetadata<Activity>(apiClient.getSquadEndpoint(squadId, path), {
      method,
      headers: {
        ...(etag ? { 'If-Match': etag } : {}),
        'Idempotency-Key': crypto.randomUUID(),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    const nextEtag = response.headers.get('ETag');
    if (nextEtag) revisions.set(key, nextEtag);
    else revisions.delete(key);
    return response.data;
  } catch (error) {
    if (error instanceof Error && error.message.includes('409')) revisions.delete(key);
    throw error;
  }
}

export function rememberActivityRevision(squadId: string, activityId: string, etag: string | null): void {
  const key = cacheKey(squadId, activityId);
  if (etag) revisions.set(key, etag);
  else revisions.delete(key);
}
