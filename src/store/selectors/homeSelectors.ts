import type { Activity, InvitationStatus, Player } from '../../types';
import type { User } from '../../services/authService';
import { getActivityDate, getInvitationStatus } from './activitySelectors';

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

export interface UpcomingEventWithGuardianInvitations extends Activity {
  guardianInvitations: GuardianEventInvitationAction[];
}

export const selectUpcomingEvents = (
  activities: Activity[],
  now: Date = new Date(),
  limit?: number,
): Activity[] => {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const upcoming = activities
    .filter((activity) => {
      const date = new Date(getActivityDate(activity));
      date.setHours(0, 0, 0, 0);
      return date >= today;
    })
    .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime());

  return typeof limit === 'number' && limit >= 0 ? upcoming.slice(0, limit) : upcoming;
};

function normalizeEmail(email: string | undefined): string {
  return (email || '').trim().toLowerCase();
}

function isGuardianOfPlayer(player: Player, user: User): boolean {
  const normalizedUserEmail = normalizeEmail(user.email);
  return (player.guardians || []).some((guardian) =>
    guardian.id === user.id || (normalizedUserEmail !== '' && normalizeEmail(guardian.email) === normalizedUserEmail));
}

function isFutureOrToday(activity: Activity, now: Date): boolean {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const activityDate = new Date(getActivityDate(activity));
  activityDate.setHours(0, 0, 0, 0);
  return activityDate >= today;
}

function isGuardianActionableInvitationStatus(status: InvitationStatus): boolean {
  return status === 'open' || status === 'accepted' || status === 'declined';
}

export const selectGuardianChildOpenInvitations = (
  players: Player[],
  activities: Activity[],
  user: User | null | undefined,
  now: Date = new Date(),
): GuardianChildOpenInvitations[] => {
  if (!user) return [];

  const childPlayers = players
    .filter((player) => isGuardianOfPlayer(player, user))
    .sort((left, right) => left.lastName.localeCompare(right.lastName) || left.firstName.localeCompare(right.firstName));

  return childPlayers
    .map((player) => {
      const invitations = activities
        .filter((activity) => isFutureOrToday(activity, now))
        .flatMap((activity) => {
          const invitation = activity.invitations.find((entry) => {
            if (entry.playerId !== player.id) return false;
            return isGuardianActionableInvitationStatus(getInvitationStatus(entry));
          });
          if (!invitation) return [];
          return [{
            eventId: activity.id,
            eventName: activity.name,
            eventDate: getActivityDate(activity),
            invitationId: invitation.id,
            playerId: invitation.playerId,
            status: getInvitationStatus(invitation),
          }];
        })
        .sort((left, right) => left.eventDate.localeCompare(right.eventDate));
      return { playerId: player.id, playerFirstName: player.firstName, playerLastName: player.lastName, invitations };
    })
    .filter((entry) => entry.invitations.length > 0);
};

export const selectUpcomingEventsWithGuardianInvitations = (
  activities: Activity[],
  players: Player[],
  user: User | null | undefined,
  now: Date = new Date(),
  limit?: number,
): UpcomingEventWithGuardianInvitations[] => {
  const upcomingEvents = selectUpcomingEvents(activities, now);
  const guardianUpcomingInvitations = selectGuardianChildOpenInvitations(players, activities, user, now);
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
  const invitationUpcomingEvents = upcomingEvents.filter((activity) => invitationEventIds.has(activity.id));
  const regularUpcomingEvents = upcomingEvents.filter((activity) => !invitationEventIds.has(activity.id));
  const limitedUpcomingEvents = typeof limit === 'number' && limit >= 0
    ? [...invitationUpcomingEvents, ...regularUpcomingEvents.slice(0, Math.max(limit - invitationUpcomingEvents.length, 0))]
    : upcomingEvents;

  return limitedUpcomingEvents.map((activity) => ({
    ...activity,
    guardianInvitations: invitationActionsByEventId.get(activity.id) || [],
  }));
};
