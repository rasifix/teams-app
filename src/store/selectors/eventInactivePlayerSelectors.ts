import type { Activity, Player } from '../../types';
import { getActivityDate } from './activitySelectors';

export const selectInviteablePlayers = (players: Player[]): Player[] =>
  players.filter((player) => player.status !== 'inactive');

export const selectAvailableInvitePlayers = (
  players: Player[],
  alreadyInvitedPlayerIds: string[],
  levelRange: [number, number],
): Player[] => {
  const alreadyInvited = new Set(alreadyInvitedPlayerIds);
  const [minimumLevel, maximumLevel] = levelRange;
  return selectInviteablePlayers(players).filter((player) => (
    !alreadyInvited.has(player.id)
    && player.level >= minimumLevel
    && player.level <= maximumLevel
  ));
};

export const isFutureEvent = (eventDate: string, now: Date = new Date()): boolean => {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const eventDay = new Date(eventDate);
  eventDay.setHours(0, 0, 0, 0);
  return eventDay.getTime() > today.getTime();
};

export const selectInactiveFutureEventPlayerIds = (
  activity: Activity,
  players: Player[],
  now: Date = new Date()
): Set<string> => {
  if (!isFutureEvent(getActivityDate(activity), now)) return new Set<string>();

  const inactivePlayerIds = new Set(players.filter((player) => player.status === 'inactive').map((player) => player.id));
  const flaggedPlayerIds = new Set<string>();

  activity.invitations.forEach((invitation) => {
    if (inactivePlayerIds.has(invitation.playerId)) flaggedPlayerIds.add(invitation.playerId);
  });

  activity.teams.forEach((team) => {
    (team.selectedPlayers || []).forEach((playerId) => {
      if (inactivePlayerIds.has(playerId)) flaggedPlayerIds.add(playerId);
    });
  });

  return flaggedPlayerIds;
};
