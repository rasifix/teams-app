import type { ActivityEvent } from '../../types/activityEvents';
import type { User } from '../../services/authService';
import type { ActivityHistoryItem } from '../../types/activityHistory';

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

export interface EnrichedActivityHistoryChange {
  key: string;
  params: Record<string, string>;
}

export interface EnrichedActivityHistoryRow {
  id: string;
  actorName: string;
  recordedAt: string;
  changes: EnrichedActivityHistoryChange[];
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

const historyValue = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
};

export function selectEnrichedActivityHistoryRows(items: ActivityHistoryItem[]): EnrichedActivityHistoryRow[] {
  return items.map((item) => ({
    id: item.id,
    actorName: item.actor.displayName ?? item.actor.type,
    recordedAt: item.recordedAt,
    changes: item.changes.map((change): EnrichedActivityHistoryChange => {
      const subject = change.subject.displayName ?? '';
      switch (change.type) {
        case 'activity.created': return { key: 'activityCreated', params: {} };
        case 'activity.imported': return { key: 'activityImported', params: {} };
        case 'activity.deleted': return { key: 'activityDeleted', params: {} };
        case 'activity.detailsChanged':
        case 'team.detailsChanged':
        case 'invitation.responseChanged':
        case 'attendance.changed':
          return { key: 'fieldChanged', params: {
            subject,
            subjectType: change.subject.type,
            field: change.field ?? 'unknown',
            previous: historyValue(change.previous),
            current: historyValue(change.current),
          } };
        case 'team.added': return { key: 'teamAdded', params: { team: subject } };
        case 'team.removed': return { key: 'teamRemoved', params: { team: subject } };
        case 'invitation.added': return { key: 'invitationAdded', params: { player: subject, response: historyValue(change.current) } };
        case 'invitation.removed': return { key: 'invitationRemoved', params: { player: subject, response: historyValue(change.previous) } };
        case 'selection.playerAdded': return { key: 'playerSelected', params: { player: subject, team: historyValue(change.context?.teamName) } };
        case 'selection.playerRemoved': return { key: 'playerUnselected', params: {
          player: subject,
          team: historyValue(change.context?.teamName),
          reason: historyValue(change.context?.reason),
        } };
        case 'selection.markedSent': return { key: 'selectionMarkedSent', params: { dateTime: historyValue(change.current) } };
        case 'lineup.changed': return { key: 'lineupChanged', params: {
          team: subject,
          periods: Array.isArray(change.context?.periods) ? change.context.periods.join(', ') : '',
          assignmentChanges: historyValue(change.context?.assignmentChanges),
        } };
        case 'attendance.removed': return { key: 'attendanceRemoved', params: { person: subject, status: historyValue(change.previous) } };
        case 'event.unsupported': return { key: 'unsupportedChange', params: {} };
        default: return { key: 'unsupportedChange', params: {} };
      }
    }),
  }));
}
