import type { Activity, SelectionRemovalReason, Team } from '../../types';
import { isActivityCompleted, isSelectionSent } from './activitySelectors';

export interface SelectionEditState {
  canEdit: boolean;
  isSent: boolean;
  requiresRemovalReason: boolean;
}

export interface SelectionValidation {
  minimumViolations: Array<{ teamId: string; required: number; actual: number }>;
  maximumViolations: Array<{ teamId: string; allowed: number; actual: number }>;
  canSend: boolean;
}

export interface ActivitySelectionChanges {
  add: string[];
  remove: Array<{ playerId: string; reason?: SelectionRemovalReason }>;
}

export function selectActivitySelectionChanges(
  currentPlayerIds: string[],
  nextPlayerIds: string[],
  reasons: Record<string, SelectionRemovalReason | ''> = {},
  requiresReason = false,
): ActivitySelectionChanges {
  const current = new Set(currentPlayerIds);
  const next = new Set(nextPlayerIds);
  return {
    add: nextPlayerIds.filter((id) => !current.has(id)),
    remove: currentPlayerIds
      .filter((id) => !next.has(id))
      .map((playerId) => ({ playerId, ...(requiresReason && reasons[playerId] ? { reason: reasons[playerId] as SelectionRemovalReason } : {}) })),
  };
}

export function selectAllTeamsHaveResponsiblePeople(
  activity: Pick<Activity, 'teams'>,
): boolean {
  const teams = activity.teams ?? [];
  return teams.length > 0 && teams.every((team) => Boolean(team.responsiblePersonId?.trim()));
}

export function selectSelectionValidation(
  activity: Pick<Activity, 'teams' | 'minPlayersPerTeam' | 'maxPlayersPerTeam'>,
): SelectionValidation {
  const minimum = activity.minPlayersPerTeam ?? 0;
  const maximum = activity.maxPlayersPerTeam;
  const minimumViolations = (activity.teams ?? [])
    .map((team) => ({ teamId: team.id, required: minimum, actual: team.selectedPlayers?.length ?? 0 }))
    .filter((team) => team.actual < team.required);
  const maximumViolations = maximum === undefined ? [] : (activity.teams ?? [])
    .map((team) => ({ teamId: team.id, allowed: maximum, actual: team.selectedPlayers?.length ?? 0 }))
    .filter((team) => team.actual > team.allowed);

  return {
    minimumViolations,
    maximumViolations,
    canSend: (activity.teams ?? []).length > 0 && minimumViolations.length === 0 && maximumViolations.length === 0,
  };
}

export function selectSelectionEditState(
  activity: Pick<Activity, 'startsAt' | 'selectionSentAt'> & { status?: Activity['status'] },
  now: Date = new Date(),
): SelectionEditState {
  const sent = isSelectionSent(activity);
  return {
    canEdit: activity.status !== 'cancelled' && !isActivityCompleted(activity, now),
    isSent: sent,
    requiresRemovalReason: sent,
  };
}

export function selectTeamsWithSelectionChanges(
  teams: Team[],
  teamId: string,
  selectedPlayers: string[],
  removedPlayerReasons: Record<string, SelectionRemovalReason>,
  removedAt: string,
): Team[] {
  return teams.map((team) => {
    if (team.id !== teamId) return team;

    const removedPlayerIds = (team.selectedPlayers ?? []).filter((playerId) => !selectedPlayers.includes(playerId));
    const newRemovals = removedPlayerIds.flatMap((playerId) => {
      const reason = removedPlayerReasons[playerId];
      return reason ? [{ playerId, reason, removedAt }] : [];
    });

    return {
      ...team,
      selectedPlayers,
      selectionRemovals: newRemovals.length > 0
        ? [...(team.selectionRemovals ?? []), ...newRemovals]
        : team.selectionRemovals,
    };
  });
}

export function removePlayerFromSelection(teams: Team[], playerId: string): Team[] {
  return teams.map((team) => (
    team.selectedPlayers?.includes(playerId)
      ? { ...team, selectedPlayers: team.selectedPlayers.filter((id) => id !== playerId) }
      : team
  ));
}
