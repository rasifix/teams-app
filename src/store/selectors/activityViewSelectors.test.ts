import { describe, expect, it } from 'vitest';
import type { Activity } from '../../types';
import { selectActivityCardSummary, selectMinimumActivityMaxPlayers } from './activityViewSelectors';

const baseActivity: Activity = {
  id: 'activity-1', squadId: 'squad-1', kind: 'match', name: 'Match', startsAt: '2026-05-01T18:30:00.000Z',
  minPlayersPerTeam: 2, teams: [{ id: 'team-1', name: 'Team 1', strength: 2, startTime: '18:30', selectedPlayers: ['p-1'] }],
  invitations: [
    { id: 'i-1', playerId: 'p-1', response: 'accepted' },
    { id: 'i-2', playerId: 'p-2', response: 'declined', declineReason: 'sick' },
    { id: 'i-3', playerId: 'p-3', response: 'open' },
  ],
};

describe('activity view selectors', () => {
  it('summarizes dates, readiness, invitation responses, and decline reasons', () => {
    expect(selectActivityCardSummary(baseActivity)).toMatchObject({
      date: '2026-05-01', startTime: '18:30', teamCount: 1, selectedPlayerCount: 1,
      allTeamsMeetMinimum: false, invitationStatusCounts: { accepted: 1, open: 1, sick: 1 },
      invitationCounts: { total: 3, accepted: 1, open: 1, declined: 1, declineReasons: { sick: 1 } },
    });
  });

  it('reports at least one required player even when teams are empty', () => {
    expect(selectMinimumActivityMaxPlayers({ ...baseActivity, teams: [] })).toBe(1);
    expect(selectMinimumActivityMaxPlayers({ ...baseActivity, teams: [{ ...baseActivity.teams[0], selectedPlayers: ['a', 'b'] }] })).toBe(2);
  });
});
