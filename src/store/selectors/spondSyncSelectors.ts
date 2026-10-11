import type { Activity, Guardian, Period, Player } from '../../types';
import type {
  SpondActivityDecision,
  SpondEventSnapshot,
  SpondMemberDecision,
  SpondMemberSnapshot,
} from '../../types/spond';

const normalized = (value: string | undefined): string =>
  (value ?? '')
    .normalize('NFKC')
    .replace(/(?:&apos;|&#0*39;|&#x0*27;)/gi, "'")
    .replace(/[‘’‛ʻʼʹ＇`´]/g, "'")
    .trim()
    .toLocaleLowerCase()
    .replace(/\s+/g, ' ');

const isPlayerMember = (member: SpondMemberSnapshot): boolean => {
  const roles = member.roles?.map((role) => role.trim().toLocaleLowerCase()) ?? [];
  return roles.length === 0 || roles.includes('player');
};

const isTrainingName = (name: string): boolean => normalized(name).includes('training');

export type SpondReviewStep = 'players' | 'guardians' | 'events';
export type SpondWizardStep = 'credentials' | 'group' | 'types' | SpondReviewStep | 'summary';

export function selectSpondWizardProgressSteps(
  reviewSteps: SpondReviewStep[],
  includeGroupSelection: boolean,
): SpondWizardStep[] {
  return ['credentials', ...(includeGroupSelection ? ['group'] as const : []), 'types', ...reviewSteps, 'summary'];
}

export function selectNextSpondReviewStep(steps: SpondReviewStep[], current: SpondReviewStep): SpondReviewStep | 'summary' {
  const index = steps.indexOf(current);
  return index >= 0 && index < steps.length - 1 ? steps[index + 1] : 'summary';
}

export interface SpondMemberRow {
  source: SpondMemberSnapshot;
  linkedPlayer?: Player;
  suggestedPlayers: Player[];
}

export interface SpondEventRow {
  source: SpondEventSnapshot;
  linkedActivity?: Activity;
  suggestedActivities: Activity[];
  needsSync: boolean;
}

export interface SpondGuardianRow {
  source: SpondMemberSnapshot['guardians'][number];
  spondMemberIds: string[];
  childNames: string[];
  linkedGuardian?: Guardian;
}

export interface SpondMemberDraft {
  action: 'link' | 'create-player' | 'skip';
  memberId: string;
  birthDate: string;
  level: number;
  guardianIds: string[];
}

export interface SpondActivityDraft {
  action: 'link' | 'create' | 'skip';
  activityId: string;
  kind: 'match' | 'tournament' | 'training' | 'social';
  trainerIds: string[];
  teamName: string;
}

export function selectSpondMemberRows(members: SpondMemberSnapshot[], players: Player[]): SpondMemberRow[] {
  return members.filter(isPlayerMember).map((source) => {
    const linkedPlayer = players.find((player) => player.spondId === source.id);
    const suggestedPlayers = linkedPlayer ? [] : players.filter((player) => {
      const namesMatch = normalized(player.firstName) === normalized(source.firstName)
        && normalized(player.lastName) === normalized(source.lastName);
      return namesMatch && (!source.birthDate || !player.birthDate || source.birthDate === player.birthDate);
    });
    return { source, linkedPlayer, suggestedPlayers };
  });
}

export function selectSpondEventRows(events: SpondEventSnapshot[], activities: Activity[], players: Player[] = []): SpondEventRow[] {
  return events.map((source) => {
    const linkedActivity = activities.find((activity) => activity.spondId === source.id);
    const suggestedActivities = linkedActivity ? [] : activities.filter((activity) => (
      activity.startsAt.slice(0, 10) === source.startsAt.slice(0, 10)
    ));
    const fieldsChanged = Boolean(linkedActivity && (
      linkedActivity.name !== source.name
      || linkedActivity.startsAt !== source.startsAt
      || (linkedActivity.endsAt ?? '') !== (source.endsAt ?? '')
      || (linkedActivity.location ?? '') !== (source.location ?? '')
    ));
    const responsesChanged = Boolean(linkedActivity && source.responses.some((response) => {
      const player = players.find((candidate) => candidate.spondId === response.spondMemberId);
      if (!player) return false;
      return linkedActivity.invitations.find((invitation) => invitation.playerId === player.id)?.response !== response.response;
    }));
    return {
      source,
      linkedActivity,
      suggestedActivities,
      needsSync: !linkedActivity || fieldsChanged || responsesChanged,
    };
  });
}

export function selectSpondActionableEventRows(rows: SpondEventRow[]): SpondEventRow[] {
  return rows.filter((row) => row.needsSync);
}

export function selectSpondGuardianRows(members: SpondMemberSnapshot[], players: Player[]): SpondGuardianRow[] {
  const guardians = players.flatMap((player) => player.guardians ?? []);
  const rows = new Map<string, SpondGuardianRow>();
  members.forEach((member) => member.guardians.forEach((source) => {
    const childName = `${member.firstName} ${member.lastName}`.trim();
    const existing = rows.get(source.id);
    if (existing) {
      if (!existing.spondMemberIds.includes(member.id)) existing.spondMemberIds.push(member.id);
      if (!existing.childNames.includes(childName)) existing.childNames.push(childName);
      return;
    }
    const linkedGuardian = guardians.find((guardian) => guardian.spondId === source.id)
      ?? guardians.find((guardian) => normalized(guardian.firstName) === normalized(source.firstName)
        && normalized(guardian.lastName) === normalized(source.lastName));
    rows.set(source.id, { source, spondMemberIds: [member.id], childNames: [childName], linkedGuardian });
  }));
  return Array.from(rows.values());
}

export function selectInitialSpondMemberDrafts(rows: SpondMemberRow[]): Record<string, SpondMemberDraft> {
  return Object.fromEntries(rows.map((row) => {
    const suggested = row.linkedPlayer ?? row.suggestedPlayers[0];
    return [row.source.id, {
      action: suggested ? 'link' : 'create-player',
      memberId: suggested?.id ?? '',
      birthDate: row.source.birthDate ?? '',
      level: 1,
      guardianIds: [],
    }];
  }));
}

export function selectSpondMemberDraftsWithSelection(
  drafts: Record<string, SpondMemberDraft>,
  rows: SpondMemberRow[],
  selected: boolean,
): Record<string, SpondMemberDraft> {
  const next = { ...drafts };
  rows.forEach((row) => {
    const current = next[row.source.id] ?? selectInitialSpondMemberDrafts([row])[row.source.id];
    const match = row.linkedPlayer ?? row.suggestedPlayers[0];
    next[row.source.id] = selected
      ? { ...current, action: match ? 'link' : 'create-player', memberId: match?.id ?? '' }
      : { ...current, action: 'skip' };
  });
  return next;
}

export function selectInitialSpondActivityDrafts(rows: SpondEventRow[]): Record<string, SpondActivityDraft> {
  return Object.fromEntries(rows.map((row) => {
    const suggested = row.linkedActivity ?? (row.suggestedActivities.length === 1 ? row.suggestedActivities[0] : undefined);
    return [row.source.id, {
      action: suggested ? 'link' : 'create',
      activityId: suggested?.id ?? '',
      kind: row.linkedActivity?.kind ?? (isTrainingName(row.source.name) ? 'training' : 'match'),
      trainerIds: [],
      teamName: '',
    }];
  }));
}

export type SpondEventFilter = 'all' | 'training' | 'match';

export function selectFilteredSpondEventRows(
  rows: SpondEventRow[],
  drafts: Record<string, SpondActivityDraft>,
  filter: SpondEventFilter,
): SpondEventRow[] {
  if (filter === 'all') return rows;
  if (filter === 'match') return rows.filter((row) => normalized(row.source.name).includes('match'));
  return rows.filter((row) => (
    row.linkedActivity?.kind === 'training'
    || drafts[row.source.id]?.kind === 'training'
    || isTrainingName(row.source.name)
  ));
}

export function selectSpondActivityDraftsWithSelection(
  drafts: Record<string, SpondActivityDraft>,
  rows: SpondEventRow[],
  selected: boolean,
): Record<string, SpondActivityDraft> {
  const next = { ...drafts };
  rows.forEach((row) => {
    const current = next[row.source.id] ?? selectInitialSpondActivityDrafts([row])[row.source.id];
    const match = row.linkedActivity ?? (row.suggestedActivities.length === 1 ? row.suggestedActivities[0] : undefined);
    next[row.source.id] = selected
      ? { ...current, action: match ? 'link' : 'create', activityId: match?.id ?? '' }
      : { ...current, action: 'skip' };
  });
  return next;
}

export interface SpondDecisionSummary {
  linkedMembers: number;
  createdMembers: number;
  skippedMembers: number;
  linkedActivities: number;
  createdActivities: number;
  skippedActivities: number;
  memberIssues: Record<string, SpondMemberRequiredField[]>;
  activityIssues: Record<string, SpondActivityRequiredField[]>;
  isReady: boolean;
}

export type SpondMemberRequiredField = 'selection' | 'member' | 'birthDate' | 'level';
export type SpondActivityRequiredField = 'selection' | 'activity' | 'trainer' | 'team';

export type SpondImportPreviewItem = {
  id: string;
  kind: 'player' | 'guardian' | 'event';
  action: 'create' | 'link' | 'update';
  sourceName: string;
  targetName?: string;
  changes?: Array<'name' | 'birthDate'>;
};

export function selectSpondImportPreview(
  memberRows: SpondMemberRow[],
  guardianRows: SpondGuardianRow[],
  eventRows: SpondEventRow[],
  memberDecisions: SpondMemberDecision[],
  activityDecisions: SpondActivityDecision[],
): SpondImportPreviewItem[] {
  const members = new Map(memberRows.map(row => [row.source.id, row]));
  const events = new Map(eventRows.map(row => [row.source.id, row]));
  const preview: SpondImportPreviewItem[] = [];

  memberDecisions.forEach(decision => {
    const row = members.get(decision.spondMemberId);
    if (!row || decision.action === 'skip') return;
    const sourceName = `${row.source.firstName} ${row.source.lastName}`;
    if (decision.action === 'link') {
      const target = row.linkedPlayer ?? row.suggestedPlayers.find(player => player.id === decision.memberId);
      if (row.linkedPlayer && row.linkedPlayer.id === decision.memberId) {
        const changes: Array<'name' | 'birthDate'> = [];
        if (normalized(row.linkedPlayer.firstName) !== normalized(row.source.firstName)
          || normalized(row.linkedPlayer.lastName) !== normalized(row.source.lastName)) changes.push('name');
        if (row.source.birthDate && row.linkedPlayer.birthDate !== row.source.birthDate) changes.push('birthDate');
        if (changes.length) preview.push({
          id: `player:${row.source.id}`, kind: 'player', action: 'update', sourceName,
          targetName: `${row.linkedPlayer.firstName} ${row.linkedPlayer.lastName}`, changes,
        });
        return;
      }
      preview.push({ id: `player:${row.source.id}`, kind: 'player', action: 'link', sourceName, targetName: target ? `${target.firstName} ${target.lastName}` : undefined });
      return;
    }
    preview.push({ id: `player:${row.source.id}`, kind: 'player', action: 'create', sourceName });
    decision.guardianIds.forEach(guardianId => {
      const guardian = guardianRows.find(candidate => candidate.source.id === guardianId);
      if (guardian) preview.push({ id: `guardian:${guardianId}:${row.source.id}`, kind: 'guardian', action: 'create', sourceName: `${guardian.source.firstName} ${guardian.source.lastName}`, targetName: sourceName });
    });
  });

  activityDecisions.forEach(decision => {
    const row = events.get(decision.spondEventId);
    if (!row || decision.action === 'skip') return;
    const target = decision.action === 'link'
      ? row.linkedActivity ?? row.suggestedActivities.find(activity => activity.id === decision.activityId)
      : undefined;
    preview.push({ id: `event:${row.source.id}`, kind: 'event', action: decision.action, sourceName: row.source.name, targetName: target?.name });
  });
  return preview;
}

export type SpondDateRangeError = 'missing' | 'order' | 'too-long' | null;

export interface SpondSyncRange {
  from: string;
  to: string;
}

export function selectSpondSyncRange(
  periods: Period[],
  periodId: string,
  fallback: SpondSyncRange,
): SpondSyncRange {
  const period = periods.find((candidate) => candidate.id === periodId);
  return period ? { from: period.startDate, to: period.endDate } : fallback;
}

export function selectSpondDateRangeError(from: string, to: string): SpondDateRangeError {
  const fromTime = Date.parse(`${from}T00:00:00.000Z`);
  const toTime = Date.parse(`${to}T00:00:00.000Z`);
  if (!from || !to || Number.isNaN(fromTime) || Number.isNaN(toTime)) return 'missing';
  if (toTime <= fromTime) return 'order';
  if (toTime - fromTime > 365 * 24 * 60 * 60 * 1000) return 'too-long';
  return null;
}

export function selectSpondDecisionSummary(
  memberRows: SpondMemberRow[],
  eventRows: SpondEventRow[],
  memberDecisions: SpondMemberDecision[],
  activityDecisions: SpondActivityDecision[],
): SpondDecisionSummary {
  const membersById = new Map(memberDecisions.map((decision) => [decision.spondMemberId, decision]));
  const activitiesById = new Map(activityDecisions.map((decision) => [decision.spondEventId, decision]));
  const memberIssues: Record<string, SpondMemberRequiredField[]> = {};
  const activityIssues: Record<string, SpondActivityRequiredField[]> = {};

  for (const row of memberRows) {
    const decision = membersById.get(row.source.id);
    const issues: SpondMemberRequiredField[] = [];
    if (!decision && !row.linkedPlayer) issues.push('selection');
    if (decision?.action === 'link' && !decision.memberId) issues.push('member');
    if (decision?.action === 'create-player') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(decision.birthDate)) issues.push('birthDate');
      if (!Number.isInteger(decision.level) || decision.level < 1 || decision.level > 5) issues.push('level');
    }
    if (issues.length) memberIssues[row.source.id] = issues;
  }

  for (const row of eventRows) {
    const decision = activitiesById.get(row.source.id);
    const issues: SpondActivityRequiredField[] = [];
    if (!decision && !row.linkedActivity) issues.push('selection');
    if (decision?.action === 'link' && !decision.activityId) issues.push('activity');
    if (decision?.action === 'create') {
      if (decision.kind === 'training' && !decision.trainerIds?.length) issues.push('trainer');
      if ((decision.kind === 'match' || decision.kind === 'tournament')
        && (!decision.teams?.length || decision.teams.some((team) => !team.name.trim()))) issues.push('team');
    }
    if (issues.length) activityIssues[row.source.id] = issues;
  }

  return {
    linkedMembers: memberDecisions.filter((entry) => entry.action === 'link').length + memberRows.filter((row) => row.linkedPlayer).length,
    createdMembers: memberDecisions.filter((entry) => entry.action === 'create-player').length,
    skippedMembers: memberDecisions.filter((entry) => entry.action === 'skip').length,
    linkedActivities: activityDecisions.filter((entry) => entry.action === 'link').length + eventRows.filter((row) => row.linkedActivity).length,
    createdActivities: activityDecisions.filter((entry) => entry.action === 'create').length,
    skippedActivities: activityDecisions.filter((entry) => entry.action === 'skip').length,
    memberIssues,
    activityIssues,
    isReady: Object.keys(memberIssues).length === 0 && Object.keys(activityIssues).length === 0,
  };
}
