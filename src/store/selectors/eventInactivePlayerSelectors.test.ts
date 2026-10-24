import { describe, expect, it } from 'vitest';
import type { Activity, ActivityInvitation, Player, Team } from '../../types';
import {
  isFutureEvent,
  selectAvailableInvitePlayers,
  selectInactiveFutureEventPlayerIds,
  selectInviteablePlayers,
} from './eventInactivePlayerSelectors';

function player(overrides: Partial<Player>): Player {
  return {
    id: 'p-default',
    firstName: 'First',
    lastName: 'Last',
    birthDate: '2014-06-15',
    level: 3,
    status: 'active',
    ...overrides,
  };
}

function invitation(overrides: Partial<ActivityInvitation>): ActivityInvitation {
  return {
    id: 'i-default',
    playerId: 'p-default',
    response: 'open',
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

function event(overrides: Partial<Activity>): Activity {
  return {
    id: 'e-default',
    squadId: 'squad-1',
    kind: 'match',
    status: 'active',
    name: 'Activity',
    startsAt: '2026-06-01T10:00:00.000Z',
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

  it('selects active and trial players within the level range who are not already invited', () => {
    const result = selectAvailableInvitePlayers([
      player({ id: 'p1', level: 2, status: 'active' }),
      player({ id: 'p2', level: 3, status: 'trial' }),
      player({ id: 'p3', level: 4, status: 'inactive' }),
      player({ id: 'p4', level: 5, status: 'active' }),
    ], ['p2'], [2, 3, 4]);

    expect(result.map((entry) => entry.id)).toEqual(['p1']);
  });

  it('returns an empty invite list when the range or exclusions remove every player', () => {
    const players = [player({ id: 'p1', level: 1 }), player({ id: 'p2', level: 5 })];
    expect(selectAvailableInvitePlayers(players, [], [2, 4])).toEqual([]);
    expect(selectAvailableInvitePlayers(players, ['p1', 'p2'], [])).toEqual([]);
    expect(selectAvailableInvitePlayers([], [], [])).toEqual([]);
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
      startsAt: '2026-06-10T10:00:00.000Z',
      invitations: [
        invitation({ id: 'i1', playerId: 'p1', response: 'open' }),
        invitation({ id: 'i2', playerId: 'p3', response: 'accepted' }),
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
      startsAt: '2026-05-01T10:00:00.000Z',
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
