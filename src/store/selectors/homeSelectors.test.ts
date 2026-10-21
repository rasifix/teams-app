import { describe, expect, it } from 'vitest';
import type { Activity } from '../../types';
import { selectUpcomingEvents } from './homeSelectors';

const buildEvent = (overrides: Partial<Activity>): Activity => ({
  id: 'event-default',
  squadId: 'squad-1',
  kind: 'match',
  status: 'active',
  name: 'Activity',
  startsAt: '2026-01-01T10:00:00.000Z',
  maxPlayersPerTeam: 12,
  minPlayersPerTeam: 8,
  teams: [],
  invitations: [],
  ...overrides,
});

describe('home selectors', () => {
  it('returns upcoming events sorted by date', () => {
    const events: Activity[] = [
      buildEvent({ id: 'e3', startsAt: '2026-06-01T10:00:00.000Z' }),
      buildEvent({ id: 'e2', startsAt: '2026-05-01T10:00:00.000Z' }),
      buildEvent({ id: 'e1', startsAt: '2026-04-10T10:00:00.000Z' }),
    ];

    const result = selectUpcomingEvents(events, new Date('2026-04-10T12:00:00Z'));

    expect(result.map((event) => event.id)).toEqual(['e1', 'e2', 'e3']);
  });

  it('excludes events before today', () => {
    const events: Activity[] = [
      buildEvent({ id: 'past', startsAt: '2026-04-09T10:00:00.000Z' }),
      buildEvent({ id: 'today', startsAt: '2026-04-10T10:00:00.000Z' }),
      buildEvent({ id: 'future', startsAt: '2026-04-11T10:00:00.000Z' }),
    ];

    const result = selectUpcomingEvents(events, new Date('2026-04-10T18:45:00Z'));

    expect(result.map((event) => event.id)).toEqual(['today', 'future']);
  });

  it('applies an optional item limit', () => {
    const events: Activity[] = [
      buildEvent({ id: 'e1', startsAt: '2026-05-01T10:00:00.000Z' }),
      buildEvent({ id: 'e2', startsAt: '2026-05-02T10:00:00.000Z' }),
      buildEvent({ id: 'e3', startsAt: '2026-05-03T10:00:00.000Z' }),
    ];

    const result = selectUpcomingEvents(events, new Date('2026-05-01T00:00:00Z'), 2);

    expect(result.map((event) => event.id)).toEqual(['e1', 'e2']);
  });

  it('returns an empty list when no upcoming events exist', () => {
    const events: Activity[] = [
      buildEvent({ id: 'e1', startsAt: '2026-03-01T10:00:00.000Z' }),
      buildEvent({ id: 'e2', startsAt: '2026-03-15T10:00:00.000Z' }),
    ];

    const result = selectUpcomingEvents(events, new Date('2026-04-01T00:00:00Z'));

    expect(result).toEqual([]);
  });
});
