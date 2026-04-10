import { describe, expect, it } from 'vitest';
import type { Event, Invitation, Period, PlayerEventHistoryItem, Team } from '../../types';
import {
  selectFutureEventsWithoutInvitation,
  selectGroupedPlayerEventHistory,
  selectPlayerEventHistory,
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

function invitation(overrides: Partial<Invitation>): Invitation {
  return {
    id: 'i-default',
    playerId: 'p-default',
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

describe('player detail selectors', () => {
  it('builds player event history in chronological order', () => {
    const events: Event[] = [
      event({
        id: 'e2',
        name: 'Second',
        date: '2026-03-05',
        invitations: [invitation({ id: 'i2', playerId: 'p1', status: 'accepted' })],
        teams: [team({ id: 't2', name: 'Blue', selectedPlayers: ['p1'] })],
      }),
      event({
        id: 'e1',
        name: 'First',
        date: '2026-01-01',
        invitations: [invitation({ id: 'i1', playerId: 'p1', status: 'open' })],
      }),
    ];

    const history = selectPlayerEventHistory(events, 'p1');

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

    const history: PlayerEventHistoryItem[] = [
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

    const grouped = selectGroupedPlayerEventHistory(periods, history, 'Outside periods');

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

    const grouped = selectGroupedPlayerEventHistory(overlappingPeriods, [], 'Outside periods');

    expect(grouped).toBeNull();
  });

  it('selects only future events where player is not invited, sorted soonest first', () => {
    const events: Event[] = [
      event({
        id: 'e2',
        date: '2026-06-01',
        invitations: [],
      }),
      event({
        id: 'e1',
        date: '2026-05-01',
        invitations: [],
      }),
      event({
        id: 'e3',
        date: '2026-05-10',
        invitations: [invitation({ id: 'i3', playerId: 'p1', status: 'open' })],
      }),
      event({
        id: 'e0',
        date: '2026-04-01',
        invitations: [],
      }),
    ];

    const result = selectFutureEventsWithoutInvitation(events, 'p1', new Date('2026-05-01T12:00:00Z'));

    expect(result.map((entry) => entry.id)).toEqual(['e1', 'e2']);
  });
});
