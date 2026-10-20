import type { Activity } from '../../types';

export interface PlayerDeletionImpact {
  hasPastTeamAssignment: boolean;
  activitiesWithActiveInvitations: Activity[];
}

function isPastActivity(startsAt: string, now: Date): boolean {
  const timestamp = Date.parse(startsAt);
  if (Number.isNaN(timestamp)) {
    return false;
  }

  return timestamp < now.getTime();
}

export function selectHasPastTeamAssignment(
  activities: Activity[],
  playerId: string,
  now: Date = new Date()
): boolean {
  return activities.some((activity) => {
    if (!isPastActivity(activity.startsAt, now)) {
      return false;
    }

    return activity.teams.some((team) => (team.selectedPlayers || []).includes(playerId));
  });
}

export function selectActivitiesWithActiveInvitations(activities: Activity[], playerId: string): Activity[] {
  return activities.filter((activity) => activity.invitations.some((invitation) => (
    invitation.playerId === playerId && invitation.response === 'open'
  )));
}

export function selectActivityWithoutActiveInvitations(activity: Activity, playerId: string): Activity {
  return {
    ...activity,
    invitations: activity.invitations.filter((invitation) => (
      invitation.playerId !== playerId || invitation.response !== 'open'
    )),
  };
}

export function selectPlayerDeletionImpact(
  activities: Activity[],
  playerId: string,
  now: Date = new Date()
): PlayerDeletionImpact {
  return {
    hasPastTeamAssignment: selectHasPastTeamAssignment(activities, playerId, now),
    activitiesWithActiveInvitations: selectActivitiesWithActiveInvitations(activities, playerId),
  };
}
