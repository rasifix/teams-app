import { describe, expect, it } from 'vitest';
import type { Activity } from '../../types';
import { getActivityTime } from './activitySelectors';
import { selectActivityCardSummary, selectAdjacentActivities, selectCanAddActivityTeam, selectInvitationViewRows, selectMinimumActivityMaxPlayers } from './activityViewSelectors';

const baseActivity: Activity = {
  id: 'activity-1', squadId: 'squad-1', kind: 'match', status: 'active', name: 'Match', startsAt: '2026-05-01T18:30:00.000Z',
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
      date: '2026-05-01', startTime: getActivityTime(baseActivity), teamCount: 1, selectedPlayerCount: 1,
      teams: [{ id: 'team-1', name: 'Team 1', startTime: getActivityTime(baseActivity), strength: 2, selectedPlayerCount: 1, responsiblePeople: [] }],
      allTeamsMeetMinimum: false, invitationStatusCounts: { accepted: 1, open: 1, sick: 1 },
      invitationCounts: { total: 3, accepted: 1, open: 1, declined: 1, declineReasons: { sick: 1 } },
    });
  });

  it('summarizes team schedule, location fallbacks, strength, and responsible people', () => {
    const activity = {
      ...baseActivity,
      kind: 'tournament' as const,
      location: 'Main field',
      teams: [
        { ...baseActivity.teams[0], startTime: '17:30', location: 'Field 2', strength: 1, responsiblePersonId: 'trainer-1' },
        { ...baseActivity.teams[0], id: 'team-2', name: 'Team 2', startTime: undefined, location: undefined, selectedPlayers: [] },
      ],
    };

    expect(selectActivityCardSummary(activity, [{ id: 'trainer-1', firstName: 'Sam', lastName: 'Coach' }])).toMatchObject({
      teams: [
        {
          id: 'team-1',
          name: 'Team 1',
          startTime: '17:30',
          location: 'Field 2',
          strength: 1,
          selectedPlayerCount: 1,
          responsiblePeople: [{ id: 'trainer-1', firstName: 'Sam', lastName: 'Coach' }],
        },
        {
          id: 'team-2',
          name: 'Team 2',
          startTime: getActivityTime(baseActivity),
          location: 'Main field',
          strength: 2,
          selectedPlayerCount: 0,
          responsiblePeople: [],
        },
      ],
    });
  });

  it('reports at least one required player even when teams are empty', () => {
    expect(selectMinimumActivityMaxPlayers({ ...baseActivity, teams: [] })).toBe(1);
    expect(selectMinimumActivityMaxPlayers({ ...baseActivity, teams: [{ ...baseActivity.teams[0], selectedPlayers: ['a', 'b'] }] })).toBe(2);
  });

  it('allows adding teams to tournaments and only the missing team to matches', () => {
    expect(selectCanAddActivityTeam({ ...baseActivity, teams: [] })).toBe(true);
    expect(selectCanAddActivityTeam(baseActivity)).toBe(false);
    expect(selectCanAddActivityTeam({ ...baseActivity, kind: 'tournament', teams: [] })).toBe(true);
    expect(selectCanAddActivityTeam({ ...baseActivity, kind: 'tournament', teams: [baseActivity.teams[0]] })).toBe(true);
  });

  it('does not allow adding teams to cancelled activities', () => {
    expect(selectCanAddActivityTeam({ ...baseActivity, status: 'cancelled', teams: [] })).toBe(false);
    expect(selectCanAddActivityTeam({ ...baseActivity, kind: 'tournament', status: 'cancelled' })).toBe(false);
  });

  it('selects adjacent activities in chronological order with boundary fallbacks', () => {
    const earlier = { ...baseActivity, id: 'earlier', startsAt: '2026-04-01T18:30:00.000Z' };
    const later = { ...baseActivity, id: 'later', startsAt: '2026-06-01T18:30:00.000Z' };
    expect(selectAdjacentActivities([later, baseActivity, earlier], baseActivity.id)).toEqual({ previous: earlier, next: later });
    expect(selectAdjacentActivities([baseActivity, later], baseActivity.id)).toEqual({ previous: undefined, next: later });
    expect(selectAdjacentActivities([baseActivity], 'missing')).toEqual({});
  });

  it('builds invitation rows with player, assignment, and managed-state fallbacks', () => {
    const activity = {
      ...baseActivity,
      spondId: 'spond-event',
      invitations: [
        { id: 'i-1', playerId: 'p-1', response: 'accepted' as const, spondId: 'spond-invite' },
        { id: 'i-2', playerId: 'missing', response: 'declined' as const },
      ],
    };
    const players = [{ id: 'p-1', firstName: 'Ada', lastName: 'One', birthDate: '2014-01-01', level: 3, status: 'active' as const, spondId: 'spond-player' }];

    expect(selectInvitationViewRows(activity, players, [], 'available')).toMatchObject([
      { invitation: { id: 'i-1' }, player: { id: 'p-1' }, assigned: false, managed: true },
    ]);
    expect(selectInvitationViewRows(activity, players, ['p-1'], 'available')).toEqual([]);
    expect(selectInvitationViewRows(activity, players, [], 'declined')).toMatchObject([
      { invitation: { id: 'i-2' }, player: undefined, assigned: false, managed: false },
    ]);
    expect(selectInvitationViewRows(activity, players, [], 'declined', true)[0].managed).toBe(true);
  });
});
