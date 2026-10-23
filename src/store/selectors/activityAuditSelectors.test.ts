import { describe, expect, it } from 'vitest';
import type { ActivityEvent } from '../../types/activityEvents';
import { selectActivityAuditRows, selectActivityHistoryRows } from './activityAuditSelectors';

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
