import { describe, expect, it } from 'vitest';
import type { Activity, ActivityInvitation } from '../../types';
import {
  getActivityDate,
  getActivityStartTime,
  getActivityTime,
  getInvitationStatus,
  isActivityCompleted,
  isSelectionSent,
  isTeamActivity,
  selectAcceptedPlayerIds,
  selectActivitiesOfKinds,
  selectInvitationCounts,
  selectPastActivities,
  selectSelectedPlayerIds,
  selectUpcomingActivities,
  sortActivities,
  toStartsAt,
} from './activitySelectors';

const activity = (overrides: Partial<Activity> = {}): Activity => ({
  id: 'a',
  squadId: 's',
  kind: 'match',
  name: 'A',
  startsAt: '2026-05-02T10:00:00.000Z',
  teams: [],
  invitations: [],
  ...overrides,
});

const invitation = (overrides: Partial<ActivityInvitation>): ActivityInvitation => ({
  id: 'i',
  playerId: 'p',
  response: 'open',
  ...overrides,
});

describe('activity time helpers', () => {
  it('reads date and time from the wall-clock ISO string', () => {
    const a = activity({ startsAt: '2026-05-02T09:45:00.000Z' });
    expect(getActivityDate(a)).toBe('2026-05-02');
    expect(getActivityTime(a)).toBe('09:45');
  });

  it('builds startsAt from date and time with a midnight fallback', () => {
    expect(toStartsAt('2026-05-02', '09:45')).toBe('2026-05-02T09:45:00.000Z');
    expect(toStartsAt('2026-05-02', '')).toBe('2026-05-02T00:00:00.000Z');
  });

  it('uses activity time for matches and team overrides for other activity kinds', () => {
    const a = activity({ kind: 'tournament',
      teams: [
        { id: 't1', name: 'T1', strength: 2, startTime: '11:00', selectedPlayers: [] },
        { id: 't2', name: 'T2', strength: 2, startTime: '09:30', selectedPlayers: [] },
      ],
    });
    expect(getActivityStartTime(a)).toBe('09:30');
    expect(getActivityStartTime(activity({ teams: [{ id: 't', name: 'T', strength: 2, startTime: '09:00', selectedPlayers: [] }] }))).toBe('10:00');
    expect(getActivityStartTime(activity({ kind: 'tournament', teams: [] }))).toBe('10:00');
  });
});

describe('sorting and splitting', () => {
  const early = activity({ id: 'early', startsAt: '2026-01-01T10:00:00.000Z' });
  const late = activity({ id: 'late', startsAt: '2026-12-01T10:00:00.000Z' });
  const now = new Date(2026, 5, 15, 12, 0, 0);

  it('sorts by startsAt ascending without mutating the input', () => {
    const input = [late, early];
    expect(sortActivities(input).map((a) => a.id)).toEqual(['early', 'late']);
    expect(input[0].id).toBe('late');
  });

  it('treats an activity on the current day as upcoming', () => {
    expect(isActivityCompleted(activity({ startsAt: '2026-06-15T08:00:00.000Z' }), now)).toBe(false);
    expect(isActivityCompleted(activity({ startsAt: '2026-06-14T23:00:00.000Z' }), now)).toBe(true);
  });

  it('does not mark invalid dates as completed', () => {
    expect(isActivityCompleted(activity({ startsAt: 'garbage' }), now)).toBe(false);
  });

  it('returns upcoming ascending and past most recent first', () => {
    const older = activity({ id: 'older', startsAt: '2025-01-01T10:00:00.000Z' });
    expect(selectUpcomingActivities([late, early, older], now).map((a) => a.id)).toEqual(['late']);
    expect(selectPastActivities([late, early, older], now).map((a) => a.id)).toEqual(['early', 'older']);
  });

  it('filters by kind', () => {
    const list = [activity({ id: '1', kind: 'match' }), activity({ id: '2', kind: 'training' })];
    expect(selectActivitiesOfKinds(list, ['training']).map((a) => a.id)).toEqual(['2']);
    expect(isTeamActivity(list[0])).toBe(true);
    expect(isTeamActivity(list[1])).toBe(false);
  });
});

describe('invitations', () => {
  it('combines response and decline reason into one status', () => {
    expect(getInvitationStatus(invitation({ response: 'declined', declineReason: 'sick' }))).toBe('sick');
    expect(getInvitationStatus(invitation({ response: 'declined' }))).toBe('declined');
    expect(getInvitationStatus(invitation({ response: 'accepted', declineReason: 'sick' }))).toBe('accepted');
  });

  it('counts responses and decline reasons', () => {
    const counts = selectInvitationCounts(activity({
      invitations: [
        invitation({ playerId: '1', response: 'open' }),
        invitation({ playerId: '2', response: 'accepted' }),
        invitation({ playerId: '3', response: 'declined', declineReason: 'sick' }),
        invitation({ playerId: '4', response: 'declined', declineReason: 'sick' }),
        invitation({ playerId: '5', response: 'declined' }),
      ],
    }));
    expect(counts).toEqual({
      total: 5,
      open: 1,
      accepted: 1,
      declined: 3,
      declineReasons: { injured: 0, sick: 2, unavailable: 0, unspecified: 1 },
    });
  });

  it('handles activities without invitations', () => {
    expect(selectInvitationCounts({ invitations: undefined as unknown as ActivityInvitation[] }).total).toBe(0);
  });

  it('lists accepted and selected players', () => {
    const a = activity({
      invitations: [invitation({ playerId: '1', response: 'accepted' }), invitation({ playerId: '2' })],
      teams: [{ id: 't', name: 'T', strength: 2, startTime: '10:00', selectedPlayers: ['1'] }],
    });
    expect(selectAcceptedPlayerIds(a)).toEqual(['1']);
    expect([...selectSelectedPlayerIds(a)]).toEqual(['1']);
  });

  it('reports whether the selection was sent', () => {
    expect(isSelectionSent(activity())).toBe(false);
    expect(isSelectionSent(activity({ selectionSentAt: '2026-05-01T10:00:00.000Z' }))).toBe(true);
  });
});
