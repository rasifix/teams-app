import type { Event } from '../../types';

export interface PlayerDeletionImpact {
  hasPastTeamAssignment: boolean;
  eventsWithActiveInvitations: Event[];
}

function isPastEvent(eventDate: string, now: Date): boolean {
  const timestamp = new Date(eventDate).getTime();
  if (Number.isNaN(timestamp)) {
    return false;
  }

  return timestamp < now.getTime();
}

export function selectHasPastTeamAssignment(
  events: Event[],
  playerId: string,
  now: Date = new Date()
): boolean {
  return events.some((event) => {
    if (!isPastEvent(event.date, now)) {
      return false;
    }

    return event.teams.some((team) => (team.selectedPlayers || []).includes(playerId));
  });
}

export function selectEventsWithActiveInvitations(events: Event[], playerId: string): Event[] {
  return events.filter((event) => event.invitations.some((invitation) => (
    invitation.playerId === playerId && invitation.status === 'open'
  )));
}

export function selectEventWithoutActiveInvitations(event: Event, playerId: string): Event {
  return {
    ...event,
    invitations: event.invitations.filter((invitation) => (
      invitation.playerId !== playerId || invitation.status !== 'open'
    )),
  };
}

export function selectPlayerDeletionImpact(
  events: Event[],
  playerId: string,
  now: Date = new Date()
): PlayerDeletionImpact {
  return {
    hasPastTeamAssignment: selectHasPastTeamAssignment(events, playerId, now),
    eventsWithActiveInvitations: selectEventsWithActiveInvitations(events, playerId),
  };
}
