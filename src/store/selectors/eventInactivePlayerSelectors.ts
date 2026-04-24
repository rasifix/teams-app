import type { Event, Player } from '../../types';

export const selectInviteablePlayers = (players: Player[]): Player[] => {
  return players.filter((player) => player.status !== 'inactive');
};

export const isFutureEvent = (eventDate: string, now: Date = new Date()): boolean => {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const eventDay = new Date(eventDate);
  eventDay.setHours(0, 0, 0, 0);

  return eventDay.getTime() > today.getTime();
};

export const selectInactiveFutureEventPlayerIds = (
  event: Event,
  players: Player[],
  now: Date = new Date()
): Set<string> => {
  if (!isFutureEvent(event.date, now)) {
    return new Set<string>();
  }

  const inactivePlayerIds = new Set(
    players
      .filter((player) => player.status === 'inactive')
      .map((player) => player.id)
  );

  const flaggedPlayerIds = new Set<string>();

  event.invitations.forEach((invitation) => {
    if (inactivePlayerIds.has(invitation.playerId)) {
      flaggedPlayerIds.add(invitation.playerId);
    }
  });

  event.teams.forEach((team) => {
    (team.selectedPlayers || []).forEach((playerId) => {
      if (inactivePlayerIds.has(playerId)) {
        flaggedPlayerIds.add(playerId);
      }
    });
  });

  return flaggedPlayerIds;
};
