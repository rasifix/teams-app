import type { Event } from '../../types';
import type { InvitationStatus, Player } from '../../types';
import type { User } from '../../services/authService';

export interface GuardianChildInvitationItem {
  eventId: string;
  eventName: string;
  eventDate: string;
  invitationId: string;
  playerId: string;
  status: InvitationStatus;
}

export interface GuardianChildOpenInvitations {
  playerId: string;
  playerFirstName: string;
  playerLastName: string;
  invitations: GuardianChildInvitationItem[];
}

export interface GuardianEventInvitationAction {
  invitationId: string;
  playerId: string;
  playerFirstName: string;
  playerLastName: string;
  status: InvitationStatus;
}

export interface UpcomingEventWithGuardianInvitations extends Event {
  guardianInvitations: GuardianEventInvitationAction[];
}

export const selectUpcomingEvents = (
  events: Event[],
  now: Date = new Date(),
  limit?: number,
): Event[] => {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const upcoming = events
    .filter((event) => {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate >= today;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (typeof limit === 'number' && limit >= 0) {
    return upcoming.slice(0, limit);
  }

  return upcoming;
};

function normalizeEmail(email: string | undefined): string {
  return (email || '').trim().toLowerCase();
}

function isGuardianOfPlayer(player: Player, user: User): boolean {
  const normalizedUserEmail = normalizeEmail(user.email);

  return (player.guardians || []).some((guardian) => (
    guardian.userId === user.id ||
    guardian.id === user.id ||
    (normalizedUserEmail !== '' && normalizeEmail(guardian.email) === normalizedUserEmail)
  ));
}

function isFutureOrToday(eventDateString: string, now: Date): boolean {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const eventDate = new Date(eventDateString);
  eventDate.setHours(0, 0, 0, 0);

  return eventDate >= today;
}

function isGuardianActionableInvitationStatus(status: InvitationStatus): boolean {
  return status === 'open' || status === 'accepted' || status === 'declined';
}

export const selectGuardianChildOpenInvitations = (
  players: Player[],
  events: Event[],
  user: User | null | undefined,
  now: Date = new Date(),
): GuardianChildOpenInvitations[] => {
  if (!user) {
    return [];
  }

  const childPlayers = players
    .filter((player) => isGuardianOfPlayer(player, user))
    .sort((a, b) => {
      const lastNameCompare = a.lastName.localeCompare(b.lastName);
      if (lastNameCompare !== 0) {
        return lastNameCompare;
      }
      return a.firstName.localeCompare(b.firstName);
    });

  return childPlayers
    .map((player) => {
      const invitations = events
        .filter((event) => isFutureOrToday(event.date, now))
        .flatMap((event) => {
          const invitation = event.invitations.find(
            (entry) => entry.playerId === player.id && isGuardianActionableInvitationStatus(entry.status)
          );
          if (!invitation) {
            return [];
          }

          return [{
            eventId: event.id,
            eventName: event.name,
            eventDate: event.date,
            invitationId: invitation.id,
            playerId: invitation.playerId,
            status: invitation.status,
          }];
        })
        .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());

      return {
        playerId: player.id,
        playerFirstName: player.firstName,
        playerLastName: player.lastName,
        invitations,
      };
    })
    .filter((entry) => entry.invitations.length > 0);
};

export const selectUpcomingEventsWithGuardianInvitations = (
  events: Event[],
  players: Player[],
  user: User | null | undefined,
  now: Date = new Date(),
  limit?: number,
): UpcomingEventWithGuardianInvitations[] => {
  const upcomingEvents = selectUpcomingEvents(events, now);
  const guardianUpcomingInvitations = selectGuardianChildOpenInvitations(players, events, user, now);

  const invitationActionsByEventId = guardianUpcomingInvitations
    .flatMap((child) => child.invitations.map((invitation) => ({
      eventId: invitation.eventId,
      invitationId: invitation.invitationId,
      playerId: invitation.playerId,
      playerFirstName: child.playerFirstName,
      playerLastName: child.playerLastName,
      status: invitation.status,
    })))
    .reduce<Map<string, GuardianEventInvitationAction[]>>((acc, action) => {
      const existing = acc.get(action.eventId) || [];
      existing.push({
        invitationId: action.invitationId,
        playerId: action.playerId,
        playerFirstName: action.playerFirstName,
        playerLastName: action.playerLastName,
        status: action.status,
      });
      acc.set(action.eventId, existing);
      return acc;
    }, new Map());

  const invitationEventIds = new Set(invitationActionsByEventId.keys());

  const invitationUpcomingEvents = upcomingEvents.filter((event) => invitationEventIds.has(event.id));
  const regularUpcomingEvents = upcomingEvents.filter((event) => !invitationEventIds.has(event.id));

  const limitedUpcomingEvents = typeof limit === 'number' && limit >= 0
    ? [
      ...invitationUpcomingEvents,
      ...regularUpcomingEvents.slice(0, Math.max(limit - invitationUpcomingEvents.length, 0)),
    ]
    : upcomingEvents;

  return limitedUpcomingEvents.map((event) => ({
    ...event,
    guardianInvitations: invitationActionsByEventId.get(event.id) || [],
  }));
};