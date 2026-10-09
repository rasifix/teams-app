import type { Activity } from '../types';
import { isTeamActivity } from '../store/selectors/activitySelectors';

export interface PlayerStats {
  acceptedCount: number;
  selectedCount: number;
}

export function getPlayerStats(playerId: string, activities: Activity[]): PlayerStats {
  let acceptedCount = 0;
  let selectedCount = 0;

  activities.filter(isTeamActivity).forEach((activity) => {
    const invitation = activity.invitations.find((entry) => entry.playerId === playerId);
    if (invitation?.response === 'accepted') {
      acceptedCount++;
    }

    const isSelected = activity.teams.some((team) => team.selectedPlayers?.includes(playerId) || false);
    if (isSelected) {
      selectedCount++;
    }
  });

  return { acceptedCount, selectedCount };
}
