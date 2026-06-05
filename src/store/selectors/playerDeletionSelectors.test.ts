import { describe, expect, it } from 'vitest';
import type { Event, Invitation, Team } from '../../types';
import {
  selectEventWithoutActiveInvitations,
  selectEventsWithActiveInvitations,
  selectHasPastTeamAssignment,
  selectPlayerDeletionImpact,
} from './playerDeletionSelectors';

function team(overrides: Partial<Team>): Team {
  return {
    id: 't-default',
    name: 'Default Team',
    strength: 2,
    startTime: '10:00',
    selectedPlayers: [],
    ...overrides,
  };
}

function invitation(overrides: Partial<Invitation>): Invitation {
  return {
    id: 'i-default',
    playerId: 'p-1',
    status: 'open',
    ...overrides,
  };
}

function event(overrides: Partial<Event>): Event {
  return {
    id: 'e-default',
    name: 'Event',
    date: '2026-01-01',
    maxPlayersPerTeam: 12,
    minPlayersPerTeam: 8,
    teams: [],
    invitations: [],
    ...overrides,
  };
}

describe('player deletion selectors', () => {
  it('returns true when player has a team assignment in a past event', () => {
    const events: Event[] = [
      event({
        id: 'e-past',
        date: '2026-05-01',
        teams: [team({ id: 't1', selectedPlayers: ['p-1'] })],
      }),
      event({
        id: 'e-future',
        date: '2026-07-10',
        teams: [team({ id: 't2', selectedPlayers: ['p-1'] })],
      }),
    ];

    const result = selectHasPastTeamAssignment(events, 'p-1', new Date('2026-06-05T00:00:00Z'));

    expect(result).toBe(true);
  });

  it('ignores future team assignments for deletion guard', () => {
    const events: Event[] = [
      event({
        id: 'e-future',
        date: '2026-08-01',
        teams: [team({ id: 't1', selectedPlayers: ['p-1'] })],
      }),
    ];

    const result = selectHasPastTeamAssignment(events, 'p-1', new Date('2026-06-05T00:00:00Z'));

    expect(result).toBe(false);
  });

  it('selects only events with active invitations for the player', () => {
    const events: Event[] = [
      event({
        id: 'e-open',
        invitations: [invitation({ id: 'i1', playerId: 'p-1', status: 'open' })],
      }),
      event({
        id: 'e-accepted',
        invitations: [invitation({ id: 'i2', playerId: 'p-1', status: 'accepted' })],
      }),
      event({
        id: 'e-other-player',
        invitations: [invitation({ id: 'i3', playerId: 'p-2', status: 'open' })],
      }),
    ];

    const result = selectEventsWithActiveInvitations(events, 'p-1');

    expect(result.map((entry) => entry.id)).toEqual(['e-open']);
  });

  it('removes only active invitations for the deleted player', () => {
    const sourceEvent = event({
      invitations: [
        invitation({ id: 'i-open-target', playerId: 'p-1', status: 'open' }),
        invitation({ id: 'i-accepted-target', playerId: 'p-1', status: 'accepted' }),
        invitation({ id: 'i-open-other', playerId: 'p-2', status: 'open' }),
      ],
    });

    const result = selectEventWithoutActiveInvitations(sourceEvent, 'p-1');

    expect(result.invitations.map((entry) => entry.id)).toEqual([
      'i-accepted-target',
      'i-open-other',
    ]);
  });

  it('returns a combined deletion impact from selectors', () => {
    const events: Event[] = [
      event({
        id: 'e-past-assignment',
        date: '2026-05-01',
        teams: [team({ id: 't1', selectedPlayers: ['p-1'] })],
      }),
      event({
        id: 'e-open-invite',
        date: '2026-07-01',
        invitations: [invitation({ id: 'i-open', playerId: 'p-1', status: 'open' })],
      }),
    ];

    const result = selectPlayerDeletionImpact(events, 'p-1', new Date('2026-06-05T00:00:00Z'));

    expect(result.hasPastTeamAssignment).toBe(true);
    expect(result.eventsWithActiveInvitations.map((entry) => entry.id)).toEqual(['e-open-invite']);
  });
});
