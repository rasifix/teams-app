import { describe, expect, it } from 'vitest';
import type { Activity, ActivityInvitation, Player } from '../../types';
import {
  getActivityDate,
  getActivityStartTime,
  getActivityTime,
  getInvitationStatus,
  isActivityCompleted,
  isSelectionSent,
  isSpondManagedInvitation,
  isTeamActivity,
  selectAcceptedPlayerIds,
  selectAvailableInvitations,
  selectActivitiesOfKinds,
  selectInvitationCounts,
  selectInvitationsByResponse,
  selectPastActivities,
  selectSelectedPlayerIds,
  shouldRemovePlayerFromSelection,
  selectUpcomingActivities,
  sortActivities,
  toStartsAt,
} from './activitySelectors';

const activity = (overrides: Partial<Activity> = {}): Activity => ({
  id: 'a',
  squadId: 's',
  kind: 'match',
  status: 'active',
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

const player = (overrides: Partial<Player> = {}): Player => ({
  id: 'p', firstName: 'A', lastName: 'Player', birthDate: '2014-01-01', level: 3, status: 'active', ...overrides,
});

describe('activity time helpers', () => {
  it('reads date and time in the browser timezone', () => {
    const a = activity({ startsAt: '2026-05-02T09:45:00.000Z' });
    const local = new Date(a.startsAt);
    expect(getActivityDate(a)).toBe(local.toLocaleDateString('en-CA'));
    expect(getActivityTime(a)).toBe(local.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }));
  });

  describe('selectInvitationsByResponse', () => {
    it('returns only invitations with the requested response', () => {
      const invitations: ActivityInvitation[] = [
        invitation({ id: 'accepted', response: 'accepted' }),
        invitation({ id: 'open', response: 'open' }),
        invitation({ id: 'declined', response: 'declined' }),
      ];

      expect(selectInvitationsByResponse(invitations, 'accepted')).toEqual([invitations[0]]);
    });

    it('returns an empty list when no invitations match', () => {
      expect(selectInvitationsByResponse([invitation({ response: 'open' })], 'declined')).toEqual([]);
    });
  });

  it('selects accepted invitations whose players are not assigned to a team', () => {
    const invitations = [
      invitation({ id: 'available', playerId: 'p1', response: 'accepted' }),
      invitation({ id: 'assigned', playerId: 'p2', response: 'accepted' }),
      invitation({ id: 'open', playerId: 'p3', response: 'open' }),
    ];
    expect(selectAvailableInvitations(invitations, ['p2'])).toEqual([invitations[0]]);
  });

  it('builds startsAt from date and time with a midnight fallback', () => {
    expect(toStartsAt('2026-05-02', '09:45')).toBe(new Date(2026, 4, 2, 9, 45).toISOString());
    expect(toStartsAt('2026-05-02', '')).toBe(new Date(2026, 4, 2).toISOString());
  });

  it('uses activity time for matches and team overrides for other activity kinds', () => {
    const a = activity({ kind: 'tournament',
      teams: [
        { id: 't1', name: 'T1', strength: 2, startTime: '11:00', selectedPlayers: [] },
        { id: 't2', name: 'T2', strength: 2, startTime: '09:30', selectedPlayers: [] },
      ],
    });
    expect(getActivityStartTime(a)).toBe('09:30');
    expect(getActivityStartTime(activity({ teams: [{ id: 't', name: 'T', strength: 2, startTime: '09:00', selectedPlayers: [] }] }))).toBe(
      getActivityTime(activity()),
    );
    expect(getActivityStartTime(activity({ kind: 'tournament', teams: [] }))).toBe(getActivityTime(activity()));
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
    expect(isActivityCompleted(activity({ startsAt: '2026-06-14T21:00:00.000Z' }), now)).toBe(true);
  });

  it('does not mark invalid dates as completed', () => {
    expect(isActivityCompleted(activity({ startsAt: 'garbage' }), now)).toBe(false);
    expect(isActivityCompleted(activity({ startsAt: '2026-06-14T21:00:00.000Z', status: 'cancelled' }), now)).toBe(false);
  });

  it('returns upcoming ascending and past most recent first', () => {
    const older = activity({ id: 'older', startsAt: '2025-01-01T10:00:00.000Z' });
    expect(selectUpcomingActivities([late, early, older], now).map((a) => a.id)).toEqual(['late']);
    expect(selectPastActivities([late, early, older], now).map((a) => a.id)).toEqual(['early', 'older']);
  });

  it('filters by kind', () => {
    const list = [activity({ id: '1', kind: 'match' }), activity({ id: '2', kind: 'tournament' })];
    expect(selectActivitiesOfKinds(list, ['tournament']).map((a) => a.id)).toEqual(['2']);
    expect(isTeamActivity(list[0])).toBe(true);
    expect(isTeamActivity(list[1])).toBe(true);
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

  it('marks only invitations linked on both sides as Spond-managed', () => {
    expect(isSpondManagedInvitation(activity({ spondId: 'event-1' }), player({ spondId: 'member-1' }))).toBe(true);
    expect(isSpondManagedInvitation(activity({ spondId: 'event-1' }), player())).toBe(false);
    expect(isSpondManagedInvitation(activity(), player({ spondId: 'member-1' }))).toBe(false);
    expect(isSpondManagedInvitation(activity({ spondId: 'event-1' }), undefined)).toBe(false);
  });

  it('removes a player from planning only when a response newly becomes declined', () => {
    expect(shouldRemovePlayerFromSelection('accepted', 'declined')).toBe(true);
    expect(shouldRemovePlayerFromSelection('open', 'declined')).toBe(true);
    expect(shouldRemovePlayerFromSelection('declined', 'declined')).toBe(false);
    expect(shouldRemovePlayerFromSelection('declined', 'accepted')).toBe(false);
  });
});
