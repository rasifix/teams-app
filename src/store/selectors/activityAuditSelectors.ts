import type { ActivityEvent } from '../../types/activityEvents';
import type { User } from '../../services/authService';

export interface ActivityAuditPerson {
  id: string;
  firstName: string;
  lastName: string;
}

export interface ActivityAuditTeam {
  id: string;
  name: string;
}

export interface ActivityAuditChange {
  type: string;
  data: unknown;
}

export interface ActivityAuditRow {
  id: string;
  actorName: string;
  actorType: ActivityEvent['actor']['type'];
  changes: ActivityAuditChange[];
  recordedAt: string;
  revision: number;
}

export interface ActivityHistoryChange {
  key: string;
  params: Record<string, string>;
}

export interface ActivityHistoryRow {
  id: string;
  actorName: string;
  recordedAt: string;
  changes: ActivityHistoryChange[];
}

function selectActorName(event: ActivityEvent, people: ActivityAuditPerson[], authenticatedUser?: User | null): string {
  if (event.actor.displayName) return event.actor.displayName;

  const actorId = event.actor.memberId || event.actor.userId;
  const person = people.find((entry) => entry.id === actorId);
  if (person) return `${person.firstName} ${person.lastName}`;

  if (authenticatedUser && event.actor.userId === authenticatedUser.id) {
    return `${authenticatedUser.firstName} ${authenticatedUser.lastName}`;
  }

  return event.actor.type;
}

export function selectActivityAuditRows(
  events: ActivityEvent[],
  people: ActivityAuditPerson[] = [],
  authenticatedUser?: User | null,
): ActivityAuditRow[] {
  return events.map((event) => ({
    id: event._id,
    actorName: selectActorName(event, people, authenticatedUser),
    actorType: event.actor.type,
    changes: event.events.map((domainEvent) => ({ type: domainEvent.type, data: domainEvent.data })),
    recordedAt: event.recordedAt,
    revision: event.revision,
  }));
}

function nameForId(id: unknown, people: Array<{ id: string; firstName?: string; lastName?: string; name?: string }>, fallback: string): string {
  if (typeof id !== 'string') return fallback;
  const person = people.find((entry) => entry.id === id);
  return person ? person.name || `${person.firstName} ${person.lastName}` : fallback;
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function selectActivityHistoryRows(
  events: ActivityEvent[],
  people: ActivityAuditPerson[] = [],
  authenticatedUser?: User | null,
  teams: ActivityAuditTeam[] = [],
): ActivityHistoryRow[] {
  return selectActivityAuditRows(events, people, authenticatedUser).map((row, eventIndex) => ({
    id: row.id,
    actorName: row.actorName,
    recordedAt: row.recordedAt,
    changes: events[eventIndex].events.map((event): ActivityHistoryChange => {
      const data = event.data as Record<string, unknown>;
      const fallback = 'the activity';
      switch (event.type) {
        case 'ActivityCreated': return { key: 'activityCreated', params: {} };
        case 'ActivityImported': return { key: 'activityImported', params: {} };
        case 'ActivityDetailsChanged': return { key: 'activityDetailsChanged', params: { fields: Object.keys(data).join(', ') } };
        case 'ActivityDeleted': return { key: 'activityDeleted', params: {} };
        case 'InvitationAdded': return { key: 'invitationAdded', params: { player: nameForId(data.playerId, people, fallback) } };
        case 'InvitationRemoved': return { key: 'invitationRemoved', params: { player: nameForId(data.playerId, people, fallback) } };
        case 'InvitationResponseChanged': return { key: 'invitationResponseChanged', params: { player: nameForId(data.playerId, people, fallback), response: stringValue(data.response) } };
        case 'TeamAdded': return { key: 'teamAdded', params: { team: stringValue(data.name) || fallback } };
        case 'TeamChanged': return { key: 'teamChanged', params: { team: stringValue(data.name) || fallback } };
        case 'TeamRemoved': return { key: 'teamRemoved', params: { team: nameForId(data.teamId, teams, fallback) } };
        case 'PlayerSelected': return { key: 'playerSelected', params: { player: nameForId(data.playerId, people, fallback), team: nameForId(data.teamId, teams, fallback) } };
        case 'PlayerUnselected': return { key: 'playerUnselected', params: { player: nameForId(data.playerId, people, fallback), team: nameForId(data.teamId, teams, fallback) } };
        case 'SelectionPublished': return { key: 'selectionPublished', params: {} };
        case 'AttendanceRecorded': return { key: 'attendanceRecorded', params: { person: nameForId(data.personId, people, fallback), status: stringValue(data.status) } };
        case 'AttendanceRemoved': return { key: 'attendanceRemoved', params: { person: nameForId(data.personId, people, fallback) } };
        case 'LineupChanged': return { key: 'lineupChanged', params: { team: nameForId(data.teamId, teams, fallback) } };
        default: return { key: 'otherChange', params: {} };
      }
    }),
  }));
}
