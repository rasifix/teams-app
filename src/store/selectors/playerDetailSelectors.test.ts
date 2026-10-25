import { describe, expect, it } from 'vitest';
import type { Activity, ActivityInvitation, Period, PlayerActivityHistoryItem, Team } from '../../types';
import {
  selectFutureEventsWithoutInvitation,
  selectGroupedDatedHistory,
  selectGroupedPlayerActivityHistory,
  selectPlayerActivityHistory,
} from './playerDetailSelectors';

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

function invitation(overrides: Partial<ActivityInvitation>): ActivityInvitation {
  return {
    id: 'i-default',
    playerId: 'p-default',
    response: 'open',
    ...overrides,
  };
}

function event(overrides: Partial<Activity>): Activity {
  return {
    id: 'e-default',
    squadId: 'squad-1',
    kind: 'match', status: 'active',
    name: 'Activity',
    startsAt: '2026-01-01T10:00:00.000Z',
    maxPlayersPerTeam: 12,
    minPlayersPerTeam: 8,
    teams: [],
    invitations: [],
    ...overrides,
  };
}

describe('player detail selectors', () => {
  it('builds player event history in chronological order', () => {
    const events: Activity[] = [
      event({
        id: 'e2',
        name: 'Second',
        startsAt: '2026-03-05T10:00:00.000Z',
        invitations: [invitation({ id: 'i2', playerId: 'p1', response: 'accepted' })],
        teams: [team({ id: 't2', name: 'Blue', selectedPlayers: ['p1'] })],
      }),
      event({
        id: 'e1',
        name: 'First',
        startsAt: '2026-01-01T10:00:00.000Z',
        invitations: [invitation({ id: 'i1', playerId: 'p1', response: 'open' })],
      }),
    ];

    const history = selectPlayerActivityHistory(events, 'p1');

    expect(history.map((entry) => entry.eventId)).toEqual(['e1', 'e2']);
    expect(history[1]).toMatchObject({
      invitationStatus: 'accepted',
      isSelected: true,
      teamName: 'Blue',
    });
  });

  it('groups history by valid periods and puts unmatched entries outside periods', () => {
    const periods: Period[] = [
      { id: 'period-a', name: 'A', startDate: '2026-01-01', endDate: '2026-04-01' },
      { id: 'period-b', name: 'B', startDate: '2026-04-01', endDate: '2026-07-01' },
    ];

    const history: PlayerActivityHistoryItem[] = [
      {
        eventId: 'e1',
        eventName: 'In A',
        eventDate: '2026-02-10',
        invitationStatus: 'accepted',
        isSelected: false,
      },
      {
        eventId: 'e2',
        eventName: 'In B',
        eventDate: '2026-05-10',
        invitationStatus: 'open',
        isSelected: false,
      },
      {
        eventId: 'e3',
        eventName: 'Outside',
        eventDate: '2027-01-10',
        invitationStatus: 'declined',
        isSelected: false,
      },
    ];

    const grouped = selectGroupedPlayerActivityHistory(periods, history, 'Outside periods');

    expect(grouped).not.toBeNull();
    expect(grouped?.map((group) => group.id)).toEqual(['outside-periods', 'period-b', 'period-a']);
    expect(grouped?.[0].title).toBe('Outside periods');
    expect(grouped?.[0].eventHistory).toHaveLength(1);
  });

  it('returns null grouping for invalid or overlapping periods', () => {
    const overlappingPeriods: Period[] = [
      { id: 'p1', name: 'One', startDate: '2026-01-01', endDate: '2026-04-01' },
      { id: 'p2', name: 'Two', startDate: '2026-03-01', endDate: '2026-05-01' },
    ];

    const grouped = selectGroupedPlayerActivityHistory(overlappingPeriods, [], 'Outside periods');

    expect(grouped).toBeNull();
  });

  it('uses the outside-period fallback for invalid dates and returns null for empty history', () => {
    const periods: Period[] = [
      { id: 'p1', name: 'One', startDate: '2026-01-01', endDate: '2026-04-01' },
    ];

    expect(selectGroupedDatedHistory(periods, [{ eventDate: 'not-a-date', id: 'invalid' }], 'Outside')).toEqual([
      { id: 'outside-periods', title: 'Outside', eventHistory: [{ eventDate: 'not-a-date', id: 'invalid' }] },
    ]);
    expect(selectGroupedDatedHistory(periods, [], 'Outside')).toBeNull();
  });

  it('selects only future events where player is not invited, sorted soonest first', () => {
    const events: Activity[] = [
      event({
        id: 'e2',
        startsAt: '2026-06-01T10:00:00.000Z',
        invitations: [],
      }),
      event({
        id: 'e1',
        startsAt: '2026-05-01T10:00:00.000Z',
        invitations: [],
      }),
      event({
        id: 'e3',
        startsAt: '2026-05-10T10:00:00.000Z',
        invitations: [invitation({ id: 'i3', playerId: 'p1', response: 'open' })],
      }),
      event({
        id: 'e0',
        startsAt: '2026-04-01T10:00:00.000Z',
        invitations: [],
      }),
    ];

    const result = selectFutureEventsWithoutInvitation(events, 'p1', new Date('2026-05-01T12:00:00Z'));

    expect(result.map((entry) => entry.id)).toEqual(['e1', 'e2']);
  });
});
