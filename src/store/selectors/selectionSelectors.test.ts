import { describe, expect, it } from 'vitest';
import type { Team } from '../../types';
import { selectSelectionEditState, selectTeamsWithSelectionChanges } from './selectionSelectors';

const team = (overrides: Partial<Team> = {}): Team => ({
  id: 'team-1', name: 'Team', strength: 2, selectedPlayers: ['p1', 'p2'], ...overrides,
});

describe('selectSelectionEditState', () => {
  it('allows editing an unsent future selection without requiring removal reasons', () => {
    expect(selectSelectionEditState(
      { startsAt: '2026-10-20T10:00:00.000Z' },
      new Date(2026, 9, 19, 12),
    )).toEqual({ canEdit: true, isSent: false, requiresRemovalReason: false });
  });

  it('allows editing on the event date and requires reasons after sending', () => {
    expect(selectSelectionEditState(
      { startsAt: '2026-10-20T10:00:00.000Z', selectionSentAt: '2026-10-18T09:00:00.000Z' },
      new Date(2026, 9, 20, 23, 59),
    )).toEqual({ canEdit: true, isSent: true, requiresRemovalReason: true });
  });

  it('locks editing after the event date, including sent selections', () => {
    expect(selectSelectionEditState(
      { startsAt: '2026-10-20T10:00:00.000Z', selectionSentAt: '2026-10-18T09:00:00.000Z' },
      new Date(2026, 9, 21, 0, 0),
    ).canEdit).toBe(false);
  });
});

describe('selectTeamsWithSelectionChanges', () => {
  it('updates only the requested team and records removal reasons', () => {
    const other = team({ id: 'team-2', selectedPlayers: ['p3'] });
    const result = selectTeamsWithSelectionChanges(
      [team(), other], 'team-1', ['p2', 'p4'], { p1: 'sick' }, '2026-10-18T12:00:00.000Z',
    );

    expect(result[0]).toMatchObject({
      selectedPlayers: ['p2', 'p4'],
      selectionRemovals: [{ playerId: 'p1', reason: 'sick', removedAt: '2026-10-18T12:00:00.000Z' }],
    });
    expect(result[1]).toBe(other);
  });

  it('preserves prior history and skips records when no reason is supplied', () => {
    const existing = { playerId: 'old', reason: 'injured' as const, removedAt: '2026-10-01T10:00:00.000Z' };
    const result = selectTeamsWithSelectionChanges(
      [team({ selectionRemovals: [existing] })], 'team-1', ['p2'], {}, '2026-10-18T12:00:00.000Z',
    );
    expect(result[0].selectionRemovals).toEqual([existing]);
  });

  it('returns teams unchanged when the team id is unknown', () => {
    const teams = [team()];
    expect(selectTeamsWithSelectionChanges(teams, 'missing', [], { p1: 'other' }, 'now')[0]).toBe(teams[0]);
  });
});
