import { describe, expect, it } from 'vitest';
import type { ActivityEvent } from '../../types/activityEvents';
import { selectActivityAuditRows, selectActivityHistoryRows, selectEnrichedActivityHistoryRows } from './activityAuditSelectors';

const event = (overrides: Partial<ActivityEvent> = {}): ActivityEvent => ({
  _id: 'commit-1', streamId: 'stream-1', aggregateType: 'activity', aggregateId: 'a1', squadId: 's1',
  revision: 2, command: { type: 'update', idempotencyKey: null, requestHash: 'hash' },
  actor: { type: 'user', displayName: 'Alex Coach' }, recordedAt: '2026-10-09T12:00:00.000Z',
  correlationId: 'correlation-1', events: [{ ordinal: 1, type: 'ActivityDetailsChanged', schemaVersion: 1, data: {} }],
  ...overrides,
});

describe('selectActivityAuditRows', () => {
  it('preserves the authenticated actor and change details', () => {
    expect(selectActivityAuditRows([event()])[0]).toMatchObject({
      actorName: 'Alex Coach', changes: [{ type: 'ActivityDetailsChanged', data: {} }],
    });
  });

  it('resolves an actor name from the authenticated user or squad members', () => {
    expect(selectActivityAuditRows([event({ actor: { type: 'user', userId: 'u1' } })], [], {
      id: 'u1', email: 'alex@example.com', firstName: 'Alex', lastName: 'Coach',
    })[0].actorName).toBe('Alex Coach');
    expect(selectActivityAuditRows([event({ actor: { type: 'user', memberId: 'm1' } })], [{ id: 'm1', firstName: 'Sam', lastName: 'Trainer' }])[0].actorName).toBe('Sam Trainer');
  });

  it('falls back to the actor type for system changes', () => {
    const row = selectActivityAuditRows([event({ actor: { type: 'system' } })])[0];
    expect(row).toMatchObject({ actorName: 'system', actorType: 'system' });
  });

  it('handles an empty event page', () => {
    expect(selectActivityAuditRows([])).toEqual([]);
  });

  it('creates readable history parameters without exposing ids', () => {
    const rows = selectActivityHistoryRows([event({ events: [{ ordinal: 1, type: 'InvitationResponseChanged', schemaVersion: 1, data: { playerId: 'p1', response: 'declined' } }] })], [{ id: 'p1', firstName: 'Roman', lastName: 'Varosic' }]);
    expect(rows[0].changes).toEqual([{ key: 'invitationResponseChanged', params: { player: 'Roman Varosic', response: 'declined' } }]);
  });
});

describe('selectEnrichedActivityHistoryRows', () => {
  it('keeps old and current values and readable subjects for field changes', () => {
    const rows = selectEnrichedActivityHistoryRows([{
      id: 'commit-2', revision: 2, recordedAt: '2026-10-09T12:00:00.000Z',
      actor: { type: 'user', memberId: 'm1', displayName: 'Alex Coach' },
      changes: [{
        type: 'invitation.responseChanged',
        subject: { type: 'player', id: 'p1', displayName: 'Sam Player' },
        field: 'response', previous: 'open', current: 'accepted',
      }],
    }]);
    expect(rows[0]).toMatchObject({
      actorName: 'Alex Coach',
      changes: [{ key: 'fieldChanged', params: { subject: 'Sam Player', field: 'response', previous: 'open', current: 'accepted' } }],
    });
  });

  it('handles null names, null values, unsupported event types, and empty history', () => {
    expect(selectEnrichedActivityHistoryRows([{
      id: 'commit-3', revision: 3, recordedAt: '2026-10-09T12:00:00.000Z',
      actor: { type: 'system', memberId: null, displayName: null },
      changes: [
        { type: 'team.detailsChanged', subject: { type: 'team', id: 't1', displayName: null }, field: 'location', previous: null, current: 'Field' },
        { type: 'event.unsupported', subject: { type: 'activity', id: 'a1', displayName: null }, context: { eventType: 'Unknown', schemaVersion: 9 } },
      ],
    }])).toMatchObject({ 0: { actorName: 'system', changes: [
      { key: 'fieldChanged', params: { subject: '', previous: '', current: 'Field' } },
      { key: 'unsupportedChange' },
    ] } });
    expect(selectEnrichedActivityHistoryRows([])).toEqual([]);
  });
});
