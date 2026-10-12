import type { Activity, InvitationStatus, Player, Trainer } from '../../types';
import { getActivityDate, getActivityStartTime, getActivityTime, getInvitationStatus, selectInvitationCounts } from './activitySelectors';
import { selectTeamResponsiblePeople } from './teamTrainerSelectors';

export interface ActivityCardTeamSummary {
  id: string;
  name: string;
  startTime: string;
  location?: string;
  strength: number;
  selectedPlayerCount: number;
  responsiblePeople: ReturnType<typeof selectTeamResponsiblePeople>;
}

export interface ActivityCardSummary {
  date: string;
  startTime: string;
  teamCount: number;
  teams: ActivityCardTeamSummary[];
  selectedPlayerCount: number;
  allTeamsMeetMinimum: boolean;
  invitationCounts: ReturnType<typeof selectInvitationCounts>;
  invitationStatusCounts: Record<InvitationStatus, number>;
}

export function selectActivityCardSummary(
  activity: Activity,
  trainers: Trainer[] = [],
  players: Player[] = [],
): ActivityCardSummary {
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
    teams: (activity.teams ?? []).map((team) => {
      return {
        id: team.id,
        name: team.name,
        startTime: activity.kind === 'match' ? getActivityTime(activity) : team.startTime || getActivityTime(activity),
        location: activity.kind === 'match' ? activity.location : team.location || activity.location,
        strength: team.strength || 2,
        selectedPlayerCount: team.selectedPlayers?.length ?? 0,
        responsiblePeople: selectTeamResponsiblePeople(team.responsiblePersonIds, trainers, players),
      };
    }),
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
