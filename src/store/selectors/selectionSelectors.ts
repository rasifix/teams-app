import type { Activity, SelectionRemovalReason, Team } from '../../types';
import { isActivityCompleted, isSelectionSent } from './activitySelectors';

export interface SelectionEditState {
  canEdit: boolean;
  isSent: boolean;
  requiresRemovalReason: boolean;
}

export function selectSelectionEditState(
  activity: Pick<Activity, 'startsAt' | 'selectionSentAt'>,
  now: Date = new Date(),
): SelectionEditState {
  const sent = isSelectionSent(activity);
  return {
    canEdit: !isActivityCompleted(activity, now),
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
