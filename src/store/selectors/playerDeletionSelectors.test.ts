import { describe, expect, it } from 'vitest';
import type { Activity, ActivityInvitation, Team } from '../../types';
import {
  selectActivityWithoutActiveInvitations,
  selectActivitiesWithActiveInvitations,
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

function invitation(overrides: Partial<ActivityInvitation>): ActivityInvitation {
  return {
    id: 'i-default',
    playerId: 'p-1',
    response: 'open',
    ...overrides,
  };
}

function event(overrides: Partial<Activity>): Activity {
  return {
    id: 'e-default',
    squadId: 'squad-1',
    kind: 'match',
    name: 'Activity',
    startsAt: '2026-01-01T10:00:00.000Z',
    maxPlayersPerTeam: 12,
    minPlayersPerTeam: 8,
    teams: [],
    invitations: [],
    ...overrides,
  };
}

describe('player deletion selectors', () => {
  it('returns true when player has a team assignment in a past event', () => {
    const events: Activity[] = [
      event({
        id: 'e-past',
        startsAt: '2026-05-01T10:00:00.000Z',
        teams: [team({ id: 't1', selectedPlayers: ['p-1'] })],
      }),
      event({
        id: 'e-future',
        startsAt: '2026-07-10T10:00:00.000Z',
        teams: [team({ id: 't2', selectedPlayers: ['p-1'] })],
      }),
    ];

    const result = selectHasPastTeamAssignment(events, 'p-1', new Date('2026-06-05T00:00:00Z'));

    expect(result).toBe(true);
  });

  it('ignores future team assignments for deletion guard', () => {
    const events: Activity[] = [
      event({
        id: 'e-future',
        startsAt: '2026-08-01T10:00:00.000Z',
        teams: [team({ id: 't1', selectedPlayers: ['p-1'] })],
      }),
    ];

    const result = selectHasPastTeamAssignment(events, 'p-1', new Date('2026-06-05T00:00:00Z'));

    expect(result).toBe(false);
  });

  it('selects only events with active invitations for the player', () => {
    const events: Activity[] = [
      event({
        id: 'e-open',
        invitations: [invitation({ id: 'i1', playerId: 'p-1', response: 'open' })],
      }),
      event({
        id: 'e-accepted',
        invitations: [invitation({ id: 'i2', playerId: 'p-1', response: 'accepted' })],
      }),
      event({
        id: 'e-other-player',
        invitations: [invitation({ id: 'i3', playerId: 'p-2', response: 'open' })],
      }),
    ];

    const result = selectActivitiesWithActiveInvitations(events, 'p-1');

    expect(result.map((entry) => entry.id)).toEqual(['e-open']);
  });

  it('removes only active invitations for the deleted player', () => {
    const sourceEvent = event({
      invitations: [
        invitation({ id: 'i-open-target', playerId: 'p-1', response: 'open' }),
        invitation({ id: 'i-accepted-target', playerId: 'p-1', response: 'accepted' }),
        invitation({ id: 'i-open-other', playerId: 'p-2', response: 'open' }),
      ],
    });

    const result = selectActivityWithoutActiveInvitations(sourceEvent, 'p-1');

    expect(result.invitations.map((entry) => entry.id)).toEqual([
      'i-accepted-target',
      'i-open-other',
    ]);
  });

  it('returns a combined deletion impact from selectors', () => {
    const events: Activity[] = [
      event({
        id: 'e-past-assignment',
        startsAt: '2026-05-01T10:00:00.000Z',
        teams: [team({ id: 't1', selectedPlayers: ['p-1'] })],
      }),
      event({
        id: 'e-open-invite',
        startsAt: '2026-07-01T10:00:00.000Z',
        invitations: [invitation({ id: 'i-open', playerId: 'p-1', response: 'open' })],
      }),
    ];

    const result = selectPlayerDeletionImpact(events, 'p-1', new Date('2026-06-05T00:00:00Z'));

    expect(result.hasPastTeamAssignment).toBe(true);
    expect(result.activitiesWithActiveInvitations.map((entry) => entry.id)).toEqual(['e-open-invite']);
  });
});
