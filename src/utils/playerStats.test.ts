import { describe, expect, it } from 'vitest';
import type { Activity } from '../types';
import { getPlayerStats } from './playerStats';

function activity(overrides: Partial<Activity>): Activity {
  return {
    id: 'activity-default',
    squadId: 'squad-1',
    kind: 'match',
    name: 'Activity',
    startsAt: '2026-06-01T10:00:00.000Z',
    teams: [],
    invitations: [],
    ...overrides,
  };
}

describe('getPlayerStats', () => {
  it('counts invitation acceptance and selection only for match and tournament activities', () => {
    const activities: Activity[] = [
      activity({
        id: 'match',
        invitations: [{ id: 'i-match', playerId: 'p1', response: 'accepted' }],
        teams: [{ id: 't-match', name: 'Blue', strength: 2, startTime: '10:00', selectedPlayers: ['p1'] }],
      }),
      activity({
        id: 'tournament',
        kind: 'tournament',
        invitations: [{ id: 'i-tournament', playerId: 'p1', response: 'declined', declineReason: 'injured' }],
        teams: [{ id: 't-tournament', name: 'Red', strength: 2, startTime: '10:00', selectedPlayers: ['p1'] }],
      }),
      activity({
        id: 'training',
        kind: 'training',
        invitations: [{ id: 'i-training', playerId: 'p1', response: 'accepted' }],
        teams: [{ id: 't-training', name: 'Training', strength: 2, startTime: '10:00', selectedPlayers: ['p1'] }],
      }),
    ];

    expect(getPlayerStats('p1', activities)).toEqual({ acceptedCount: 1, selectedCount: 2 });
  });

  it('returns zero counts for no activities', () => {
    expect(getPlayerStats('p1', [])).toEqual({ acceptedCount: 0, selectedCount: 0 });
  });
});
