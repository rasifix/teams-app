import { describe, expect, it } from 'vitest';
import type { Activity, Player } from '../../types';
import { selectEventParticipationRows, selectNextUpcomingEventIndex, selectPlayerActivityStatistics, selectStatisticsViewData, selectTeamSelectionMatrixData, selectVisiblePlayerStatistics } from './statisticsSelectors';

const player = (id: string, firstName: string, lastName = 'Player', level = 3): Player => ({
  id, firstName, lastName, birthDate: '2015-01-01', level, status: 'active',
});
const activity = (overrides: Partial<Activity> = {}): Activity => ({
  id: 'a1', squadId: 's1', kind: 'match', name: 'Match', startsAt: '2026-05-03T10:00:00.000Z',
  invitations: [], teams: [], ...overrides,
});

describe('statistics selectors', () => {
  it('counts invitations and selections only for team activities, with safe zero rates and name ordering', () => {
    const p1 = player('p1', 'Zoe');
    const p2 = player('p2', 'Ada');
    const activities = [
      activity({ invitations: [{ id: 'i1', playerId: p1.id, response: 'accepted' }], teams: [{ id: 't1', name: 'A', strength: 1, selectedPlayers: [p1.id] }] }),
      activity({ id: 'social', kind: 'social', invitations: [{ id: 'i2', playerId: p1.id, response: 'accepted' }], teams: [{ id: 't2', name: 'Social', strength: 1, selectedPlayers: [p1.id] }] }),
    ];
    expect(selectPlayerActivityStatistics(activities, [p1, p2])).toEqual([
      { player: p2, invitedCount: 0, acceptedCount: 0, selectedCount: 0, acceptanceRate: 0, selectionRate: 0 },
      { player: p1, invitedCount: 1, acceptedCount: 1, selectedCount: 1, acceptanceRate: 100, selectionRate: 100 },
    ]);
  });

  it('builds ordered attendance rows using invitation response and decline reason', () => {
    const activityWithResponses = activity({
      invitations: [
        { id: 'i1', playerId: 'p1', response: 'declined', declineReason: 'injured' },
        { id: 'i2', playerId: 'p2', response: 'accepted' },
      ],
      teams: [{ id: 't1', name: 'A', strength: 2, selectedPlayers: ['p2'] }],
    });
    const rows = selectEventParticipationRows([player('p1', 'Zoe'), player('p2', 'Ada'), player('p3', 'Ben', 'Player', 1)], [activityWithResponses], [2, 5]);
    expect(rows.map((row) => row.player.id)).toEqual(['p2', 'p1']);
    expect(rows[0].attendance[0].status).toBe('selected');
    expect(rows[1].attendance[0].status).toBe('injured');
    expect(selectEventParticipationRows([], [], [1, 5])).toEqual([]);
  });

  it('groups selected team history by strength and team name with activity dates', () => {
    const activities = [activity({ teams: [
      { id: 't1', name: '', strength: 2, selectedPlayers: ['p1'] },
      { id: 't2', name: 'B', strength: 1, selectedPlayers: [] },
    ] })];
    const strength = selectTeamSelectionMatrixData([player('p1', 'Ada')], activities, [1, 5], 'strength', (value) => `Strength ${value}`, 'Team');
    expect(strength.columns.map((column) => column.strength)).toEqual([1, 2]);
    expect(strength.rows[0].cells[1].events[0]).toEqual({ eventId: 'a1', eventName: 'Match', eventDate: '2026-05-03', teamId: 't1', teamName: 'Team 1' });
    const named = selectTeamSelectionMatrixData([player('p1', 'Ada')], activities, [1, 5], 'teamName', (value) => String(value), 'Team');
    expect(named.columns.map((column) => column.label)).toEqual(['B', 'Team 1']);
    expect(selectTeamSelectionMatrixData([], [], [1, 5], 'strength', String, 'Team')).toEqual({ columns: [], rows: [] });
  });

  it('builds the statistics view for the selected period and excludes trial players', () => {
    const activePlayer = player('p1', 'Ada');
    const trialPlayer = { ...player('p2', 'Ben'), status: 'trial' as const };
    const inPeriod = activity({
      invitations: [{ id: 'i1', playerId: activePlayer.id, response: 'accepted' }],
      teams: [{ id: 't1', name: 'A', strength: 2, selectedPlayers: [activePlayer.id] }],
    });
    const outsidePeriod = activity({ id: 'a2', startsAt: '2025-12-01T10:00:00.000Z' });
    const social = activity({ id: 'social', kind: 'social' });

    const result = selectStatisticsViewData(
      [outsidePeriod, social, inPeriod],
      [trialPlayer, activePlayer],
      { id: 'period', name: 'May', startDate: '2026-05-01', endDate: '2026-05-31' },
    );

    expect(result.filteredEvents.map((event) => event.id)).toEqual(['a1']);
    expect(result.statisticsPlayers).toEqual([activePlayer]);
    expect(result.summary).toEqual({ totalPlayers: 1, totalEvents: 1, averageAcceptances: 1, averageSelections: 1 });
  });

  it('uses all team events and safe zero averages as statistics-view fallbacks', () => {
    const result = selectStatisticsViewData([activity()], [], null);
    expect(result.filteredEvents).toHaveLength(1);
    expect(result.playerStatistics).toEqual([]);
    expect(result.summary).toEqual({ totalPlayers: 0, totalEvents: 1, averageAcceptances: 0, averageSelections: 0 });
  });

  it('filters and sorts visible player statistics with deterministic name fallbacks', () => {
    const ada = player('p1', 'Ada', 'Zulu', 2);
    const ben = player('p2', 'Ben', 'Alpha', 4);
    const cy = player('p3', 'Cy', 'Bravo', 5);
    const statistics = [
      { player: ada, invitedCount: 3, acceptedCount: 2, selectedCount: 1, acceptanceRate: 66, selectionRate: 50 },
      { player: ben, invitedCount: 3, acceptedCount: 1, selectedCount: 1, acceptanceRate: 33, selectionRate: 100 },
      { player: cy, invitedCount: 1, acceptedCount: 1, selectedCount: 0, acceptanceRate: 100, selectionRate: 0 },
    ];

    expect(selectVisiblePlayerStatistics(statistics, [1, 4], 'invited', 'desc').map(({ player: entry }) => entry.id)).toEqual(['p1', 'p2']);
    expect(selectVisiblePlayerStatistics(statistics, [1, 5], 'name', 'asc').map(({ player: entry }) => entry.id)).toEqual(['p2', 'p3', 'p1']);
    expect(selectVisiblePlayerStatistics(statistics, [5, 5], 'selected', 'asc').map(({ player: entry }) => entry.id)).toEqual(['p3']);
    expect(selectVisiblePlayerStatistics(statistics, [6, 7], 'name', 'asc')).toEqual([]);
  });

  it('finds the next upcoming event and handles missing or invalid dates', () => {
    const events = [
      activity({ id: 'past', startsAt: '2026-05-01T10:00:00.000Z' }),
      activity({ id: 'invalid', startsAt: 'invalid' }),
      activity({ id: 'next', startsAt: '2026-05-03T10:00:00.000Z' }),
    ];
    expect(selectNextUpcomingEventIndex(events, new Date('2026-05-02T12:00:00.000Z'))).toBe(2);
    expect(selectNextUpcomingEventIndex(events, new Date('2027-01-01T00:00:00.000Z'))).toBe(-1);
    expect(selectNextUpcomingEventIndex([], new Date('2026-05-02T00:00:00.000Z'))).toBe(-1);
  });
});
