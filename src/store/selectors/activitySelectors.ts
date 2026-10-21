import type {
  Activity,
  ActivityInvitation,
  ActivityKind,
  InvitationDeclineReason,
  InvitationResponse,
  InvitationStatus,
  Player,
} from '../../types';

/* Activity timestamps are real instants; display helpers resolve them in browser-local time. */

export const sortActivities = (activities: Activity[]): Activity[] =>
  [...activities].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

const localDateTimeParts = (value: string): { date: string; time: string } | null => {
  const instant = new Date(value);
  if (Number.isNaN(instant.getTime())) return null;
  const date = `${instant.getFullYear()}-${String(instant.getMonth() + 1).padStart(2, '0')}-${String(instant.getDate()).padStart(2, '0')}`;
  const time = `${String(instant.getHours()).padStart(2, '0')}:${String(instant.getMinutes()).padStart(2, '0')}`;
  return { date, time };
};

export const getActivityDate = (activity: Pick<Activity, 'startsAt'>): string =>
  localDateTimeParts(activity.startsAt)?.date ?? activity.startsAt.slice(0, 10);

export const getActivityTime = (activity: Pick<Activity, 'startsAt'>): string =>
  localDateTimeParts(activity.startsAt)?.time ?? activity.startsAt.slice(11, 16);

export const toStartsAt = (date: string, time: string): string => {
  const safeTime = /^\d{2}:\d{2}$/.test(time) ? time : '00:00';
  return new Date(`${date}T${safeTime}:00.000`).toISOString();
};

export const isTeamActivity = (activity: Pick<Activity, 'kind'>): boolean =>
  activity.kind === 'match' || activity.kind === 'tournament';

export const selectActivitiesOfKinds = (activities: Activity[], kinds: ActivityKind[]): Activity[] =>
  activities.filter((activity) => kinds.includes(activity.kind));

const startOfDay = (value: Date): number => {
  const day = new Date(value);
  day.setHours(0, 0, 0, 0);
  return day.getTime();
};

/** An activity is completed once its day is over (local day comparison, like the legacy event lists). */
export const isActivityCompleted = (activity: Pick<Activity, 'startsAt'> & { status?: Activity['status'] }, now: Date = new Date()): boolean => {
  if (activity.status === 'cancelled') return false;
  const [year, month, day] = getActivityDate(activity).split('-').map(Number);
  if (!year || !month || !day) return false;
  return new Date(year, month - 1, day).getTime() < startOfDay(now);
};

export const selectUpcomingActivities = (activities: Activity[], now: Date = new Date()): Activity[] =>
  sortActivities(activities.filter((activity) => !isActivityCompleted(activity, now)));

/** Most recent first. */
export const selectPastActivities = (activities: Activity[], now: Date = new Date()): Activity[] =>
  sortActivities(activities.filter((activity) => isActivityCompleted(activity, now))).reverse();

/** Single status combining response and decline reason, as used by the status badges. */
export const getInvitationStatus = (invitation: ActivityInvitation): InvitationStatus =>
  invitation.response === 'declined' && invitation.declineReason ? invitation.declineReason : invitation.response;

export const shouldRemovePlayerFromSelection = (
  previousResponse: InvitationResponse,
  nextResponse: InvitationResponse,
): boolean => nextResponse === 'declined' && previousResponse !== 'declined';

export const isSelectionSent = (activity: Pick<Activity, 'selectionSentAt'>): boolean =>
  Boolean(activity.selectionSentAt);

export const isSpondManagedInvitation = (
  activity: Pick<Activity, 'spondId'>,
  player: Pick<Player, 'spondId'> | undefined,
): boolean => Boolean(activity.spondId && player?.spondId);

export interface InvitationCounts {
  total: number;
  open: number;
  accepted: number;
  declined: number;
  declineReasons: Record<InvitationDeclineReason | 'unspecified', number>;
}

export const selectInvitationCounts = (activity: Pick<Activity, 'invitations'>): InvitationCounts => {
  const counts: InvitationCounts = {
    total: 0,
    open: 0,
    accepted: 0,
    declined: 0,
    declineReasons: { injured: 0, sick: 0, unavailable: 0, unspecified: 0 },
  };

  for (const invitation of activity.invitations ?? []) {
    counts.total += 1;
    counts[invitation.response] += 1;
    if (invitation.response === 'declined') {
      counts.declineReasons[invitation.declineReason ?? 'unspecified'] += 1;
    }
  }

  return counts;
};

export const selectAcceptedPlayerIds = (activity: Pick<Activity, 'invitations'>): string[] =>
  (activity.invitations ?? []).filter((invitation) => invitation.response === 'accepted').map((invitation) => invitation.playerId);

export const selectSelectedPlayerIds = (activity: Pick<Activity, 'teams'>): Set<string> =>
  new Set((activity.teams ?? []).flatMap((team) => team.selectedPlayers ?? []));

export const selectInvitationsByResponse = (
  invitations: ActivityInvitation[],
  response: InvitationResponse,
): ActivityInvitation[] => {
  return invitations.filter((invitation) => invitation.response === response);
};

export const selectAvailableInvitations = (
  invitations: ActivityInvitation[],
  assignedPlayerIds: string[] = [],
): ActivityInvitation[] => {
  const assigned = new Set(assignedPlayerIds);
  return invitations.filter((invitation) => invitation.response === 'accepted' && !assigned.has(invitation.playerId));
};

export const getActivityStartTime = (activity: Activity): string => {
  if (activity.kind === 'match') return getActivityTime(activity);
  const teamStartTimes = (activity.teams ?? [])
    .map((team) => team.startTime?.trim())
    .filter((time): time is string => Boolean(time))
    .sort();
  return teamStartTimes[0] ?? getActivityTime(activity);
};
