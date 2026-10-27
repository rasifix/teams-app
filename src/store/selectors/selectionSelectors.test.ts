import { describe, expect, it } from 'vitest';
import type { Team } from '../../types';
import { removePlayerFromSelection, selectActivitySelectionChanges, selectAllTeamsHaveResponsiblePeople, selectSelectionEditState, selectSelectionValidation, selectTeamsWithSelectionChanges } from './selectionSelectors';

const team = (overrides: Partial<Team> = {}): Team => ({
  id: 'team-1', name: 'Team', strength: 2, selectedPlayers: ['p1', 'p2'], ...overrides,
});

describe('selectActivitySelectionChanges', () => {
  it('returns only additions and removals with post-send reasons', () => {
    expect(selectActivitySelectionChanges(['p1', 'p2'], ['p2', 'p3'], { p1: 'injured' }, true)).toEqual({
      add: ['p3'], remove: [{ playerId: 'p1', reason: 'injured' }],
    });
  });

  it('omits removal reasons before selection is marked sent and handles no changes', () => {
    expect(selectActivitySelectionChanges(['p1'], [], { p1: 'sick' }, false)).toEqual({
      add: [], remove: [{ playerId: 'p1' }],
    });
    expect(selectActivitySelectionChanges(['p1'], ['p1'])).toEqual({ add: [], remove: [] });
  });
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

  it('locks cancelled activities regardless of their date', () => {
    expect(selectSelectionEditState({
      startsAt: '2026-10-20T10:00:00.000Z', status: 'cancelled',
    }, new Date(2026, 9, 19, 12)).canEdit).toBe(false);
  });
});

describe('selectAllTeamsHaveResponsiblePeople', () => {
  it('returns true when every team has a responsible person', () => {
    expect(selectAllTeamsHaveResponsiblePeople({
      teams: [team({ responsiblePersonId: 'trainer-1' }), team({ id: 'team-2', responsiblePersonId: 'guardian-1' })],
    })).toBe(true);
  });

  it('returns false when any team is missing a responsible person', () => {
    expect(selectAllTeamsHaveResponsiblePeople({
      teams: [team({ responsiblePersonId: 'trainer-1' }), team({ id: 'team-2' })],
    })).toBe(false);
  });

  it.each([
    { teams: [] as Team[] },
    { teams: [team({ responsiblePersonId: '' })] },
    { teams: [team({ responsiblePersonId: '   ' })] },
  ])('returns false for incomplete responsible-person data (%j)', ({ teams }) => {
    expect(selectAllTeamsHaveResponsiblePeople({ teams })).toBe(false);
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

describe('selectSelectionValidation', () => {
  it('allows sending only when every team meets the minimum and maximum limits', () => {
    expect(selectSelectionValidation({
      minPlayersPerTeam: 2,
      maxPlayersPerTeam: 3,
      teams: [team({ selectedPlayers: ['p1', 'p2'] })],
    })).toEqual({ minimumViolations: [], maximumViolations: [], canSend: true });
  });

  it('reports incomplete and over-capacity teams for send-time validation', () => {
    expect(selectSelectionValidation({
      minPlayersPerTeam: 2,
      maxPlayersPerTeam: 2,
      teams: [team({ id: 'small', selectedPlayers: ['p1'] }), team({ id: 'large', selectedPlayers: ['p1', 'p2', 'p3'] })],
    })).toEqual({
      minimumViolations: [{ teamId: 'small', required: 2, actual: 1 }],
      maximumViolations: [{ teamId: 'large', allowed: 2, actual: 3 }],
      canSend: false,
    });
  });

  it('does not require a minimum while drafting', () => {
    expect(selectSelectionValidation({ minPlayersPerTeam: 2, teams: [team({ selectedPlayers: [] })] }).canSend).toBe(false);
  });
});

describe('removePlayerFromSelection', () => {
  it('removes a declined player from all planning teams while preserving other data', () => {
    const result = removePlayerFromSelection([team(), team({ id: 'team-2', selectedPlayers: ['p3'] })], 'p1');
    expect(result[0]).toMatchObject({ id: 'team-1', selectedPlayers: ['p2'] });
    expect(result[1]).toMatchObject({ id: 'team-2', selectedPlayers: ['p3'] });
  });
});
