import type { Activity, InvitationStatus } from '../../types';
import { getActivityDate, getActivityStartTime, getInvitationStatus, selectInvitationCounts } from './activitySelectors';

export interface ActivityCardSummary {
  date: string;
  startTime: string;
  teamCount: number;
  selectedPlayerCount: number;
  allTeamsMeetMinimum: boolean;
  invitationCounts: ReturnType<typeof selectInvitationCounts>;
  invitationStatusCounts: Record<InvitationStatus, number>;
}

export function selectActivityCardSummary(activity: Activity): ActivityCardSummary {
  const invitationStatusCounts: Record<InvitationStatus, number> = {
    accepted: 0,
    open: 0,
    declined: 0,
    injured: 0,
    sick: 0,
    unavailable: 0,
  };
  for (const invitation of activity.invitations ?? []) {
    invitationStatusCounts[getInvitationStatus(invitation)] += 1;
  }

  return {
    date: getActivityDate(activity),
    startTime: getActivityStartTime(activity),
    teamCount: activity.teams?.length ?? 0,
    selectedPlayerCount: (activity.teams ?? []).reduce((sum, team) => sum + (team.selectedPlayers?.length ?? 0), 0),
    allTeamsMeetMinimum: Boolean(activity.teams?.length) && activity.teams.every(
      (team) => (team.selectedPlayers?.length ?? 0) >= (activity.minPlayersPerTeam ?? 0),
    ),
    invitationCounts: selectInvitationCounts(activity),
    invitationStatusCounts,
  };
}

export function selectMinimumActivityMaxPlayers(activity: Activity): number {
  return Math.max(1, ...(activity.teams ?? []).map((team) => team.selectedPlayers?.length ?? 0));
}
