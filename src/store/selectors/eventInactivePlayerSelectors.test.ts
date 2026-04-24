import { describe, expect, it } from 'vitest';
import type { Event, Invitation, Player, Team } from '../../types';
import {
  isFutureEvent,
  selectInactiveFutureEventPlayerIds,
  selectInviteablePlayers,
} from './eventInactivePlayerSelectors';

function player(overrides: Partial<Player>): Player {
  return {
    id: 'p-default',
    firstName: 'First',
    lastName: 'Last',
    birthYear: 2014,
    level: 3,
    status: 'active',
    ...overrides,
  };
}

function invitation(overrides: Partial<Invitation>): Invitation {
  return {
    id: 'i-default',
    playerId: 'p-default',
    status: 'open',
    ...overrides,
  };
}

function team(overrides: Partial<Team>): Team {
  return {
    id: 't-default',
    name: 'Team',
    strength: 2,
    startTime: '10:00',
    selectedPlayers: [],
    ...overrides,
  };
}

function event(overrides: Partial<Event>): Event {
  return {
    id: 'e-default',
    name: 'Event',
    date: '2026-06-01',
    maxPlayersPerTeam: 12,
    minPlayersPerTeam: 8,
    teams: [],
    invitations: [],
    ...overrides,
  };
}

describe('event inactive player selectors', () => {
  it('filters inactive players from inviteable list', () => {
    const result = selectInviteablePlayers([
      player({ id: 'p1', status: 'active' }),
      player({ id: 'p2', status: 'trial' }),
      player({ id: 'p3', status: 'inactive' }),
    ]);

    expect(result.map((entry) => entry.id)).toEqual(['p1', 'p2']);
  });

  it('detects future event dates only', () => {
    const now = new Date('2026-05-01T12:00:00Z');

    expect(isFutureEvent('2026-05-02', now)).toBe(true);
    expect(isFutureEvent('2026-05-01', now)).toBe(false);
    expect(isFutureEvent('2026-04-30', now)).toBe(false);
  });

  it('returns inactive invited or assigned player ids for future events', () => {
    const players: Player[] = [
      player({ id: 'p1', status: 'inactive' }),
      player({ id: 'p2', status: 'inactive' }),
      player({ id: 'p3', status: 'active' }),
    ];

    const futureEvent = event({
      date: '2026-06-10',
      invitations: [
        invitation({ id: 'i1', playerId: 'p1', status: 'open' }),
        invitation({ id: 'i2', playerId: 'p3', status: 'accepted' }),
      ],
      teams: [team({ id: 't1', selectedPlayers: ['p2', 'p3'] })],
    });

    const result = selectInactiveFutureEventPlayerIds(
      futureEvent,
      players,
      new Date('2026-05-01T12:00:00Z')
    );

    expect(Array.from(result).sort()).toEqual(['p1', 'p2']);
  });

  it('returns empty set for non-future events', () => {
    const players: Player[] = [player({ id: 'p1', status: 'inactive' })];
    const pastOrTodayEvent = event({
      date: '2026-05-01',
      invitations: [invitation({ id: 'i1', playerId: 'p1' })],
      teams: [team({ id: 't1', selectedPlayers: ['p1'] })],
    });

    const result = selectInactiveFutureEventPlayerIds(
      pastOrTodayEvent,
      players,
      new Date('2026-05-01T12:00:00Z')
    );

    expect(result.size).toBe(0);
  });
});
