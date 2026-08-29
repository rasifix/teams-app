import { describe, expect, it } from 'vitest';
import type { Formation, FormationSlot, Player, PlayingMode, Team } from '../../types';
import {
  hasLineupRosterMismatch,
  selectAssignmentsForPeriod,
  selectBenchedPlayerIds,
  selectDefaultPlayingMode,
  selectFormationById,
  selectPlayingModeById,
  selectPlannedPeriodCounts,
  selectLineupSummary,
  selectLineupWithCopiedPeriod,
  selectSlotDisplayIndexes,
  selectStaleAssignmentsForPeriod,
  getPositionLabelKey,
} from './matchPlanningSelectors';

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

function playingMode(overrides: Partial<PlayingMode>): PlayingMode {
  return {
    id: 'pm-default',
    name: '4x20',
    numberOfPeriods: 4,
    periodLengthMinutes: 20,
    ...overrides,
  };
}

function slot(overrides: Partial<FormationSlot>): FormationSlot {
  return { id: 's-default', positionCode: 'CB', ...overrides };
}

function formation(overrides: Partial<Formation>): Formation {
  return { id: 'f-default', name: '3-3', slots: [], ...overrides };
}

function player(id: string, firstName: string): Player {
  return { id, firstName, lastName: 'Player', birthYear: 2015, level: 3, status: 'active' };
}

describe('getPositionLabelKey', () => {
  it('builds a namespaced i18n key from the position code', () => {
    expect(getPositionLabelKey('LB')).toBe('positions.LB');
    expect(getPositionLabelKey('GK')).toBe('positions.GK');
  });
});

describe('selectPlannedPeriodCounts', () => {
  it('counts the distinct periods planned for each selected player', () => {
    const counts = selectPlannedPeriodCounts(team({
      selectedPlayers: ['p1', 'p2', 'p3'],
      lineup: [
        { periodNumber: 1, assignments: [{ slotId: 's1', playerId: 'p1' }, { slotId: 's2', playerId: 'p2' }] },
        { periodNumber: 2, assignments: [{ slotId: 's1', playerId: 'p1' }] },
      ],
    }));

    expect(Object.fromEntries(counts)).toEqual({ p1: 2, p2: 1, p3: 0 });
  });

  it('counts a player only once when duplicate assignments exist in a period', () => {
    const counts = selectPlannedPeriodCounts(team({
      selectedPlayers: ['p1'],
      lineup: [{ periodNumber: 1, assignments: [{ slotId: 's1', playerId: 'p1' }, { slotId: 's2', playerId: 'p1' }] }],
    }));

    expect(counts.get('p1')).toBe(1);
  });

  it('returns zero-count fallbacks and ignores assignments for removed players', () => {
    const counts = selectPlannedPeriodCounts(team({
      selectedPlayers: ['p1'],
      lineup: [{ periodNumber: 1, assignments: [{ slotId: 's1', playerId: 'removed' }] }],
    }));

    expect(Object.fromEntries(counts)).toEqual({ p1: 0 });
    expect(counts.has('removed')).toBe(false);
  });
});

describe('selectLineupSummary', () => {
  const summaryFormation = formation({
    slots: [slot({ id: 'gk', positionCode: 'GK' }), slot({ id: 'cb-1' }), slot({ id: 'cb-2' })],
  });

  it('composes every period with ordered slots, assignments, and benched players', () => {
    const summary = selectLineupSummary(
      team({
        selectedPlayers: ['p1', 'p2'],
        lineup: [{ periodNumber: 1, assignments: [{ slotId: 'gk', playerId: 'p1' }] }],
      }),
      summaryFormation,
      [player('p1', 'Ada'), player('p2', 'Ben')],
      2
    );

    expect(summary).toHaveLength(2);
    expect(summary[0].assignments[0]).toMatchObject({ positionCode: 'GK', playerName: 'Ada Player' });
    expect(summary[0].assignments[1]).toMatchObject({ displayIndex: 1, playerId: null });
    expect(summary[0].benchedPlayers).toEqual([{ playerId: 'p2', playerName: 'Ben Player' }]);
    expect(summary[1].assignments.every((assignment) => assignment.playerId === null)).toBe(true);
    expect(summary[1].benchedPlayers).toHaveLength(2);
  });

  it('uses a null name fallback when an assigned or selected player cannot be resolved', () => {
    const summary = selectLineupSummary(
      team({ selectedPlayers: ['missing'], lineup: [{ periodNumber: 1, assignments: [{ slotId: 'gk', playerId: 'missing' }] }] }),
      summaryFormation,
      [],
      1
    );

    expect(summary[0].assignments[0].playerName).toBeNull();
  });

  it('returns no periods when the configured period count is invalid', () => {
    expect(selectLineupSummary(team({}), summaryFormation, [], -1)).toEqual([]);
  });
});

describe('selectLineupWithCopiedPeriod', () => {
  it('replaces the target period with cloned assignments from the source period', () => {
    const lineup = [
      { periodNumber: 1, assignments: [{ slotId: 'gk', playerId: 'p1' }] },
      { periodNumber: 2, assignments: [{ slotId: 'gk', playerId: 'p2' }] },
    ];

    const result = selectLineupWithCopiedPeriod(lineup, 1, 2);

    expect(result[1]).toEqual({ periodNumber: 2, assignments: [{ slotId: 'gk', playerId: 'p1' }] });
    expect(result[1].assignments).not.toBe(lineup[0].assignments);
  });

  it('clears the target assignments when the source period is unplanned', () => {
    const result = selectLineupWithCopiedPeriod(
      [{ periodNumber: 2, assignments: [{ slotId: 'gk', playerId: 'p2' }] }],
      1,
      2
    );

    expect(result).toEqual([{ periodNumber: 2, assignments: [] }]);
  });

  it('returns the original lineup for invalid or identical period numbers', () => {
    const lineup = [{ periodNumber: 1, assignments: [] }];

    expect(selectLineupWithCopiedPeriod(lineup, 0, 1)).toBe(lineup);
    expect(selectLineupWithCopiedPeriod(lineup, 1, 1)).toBe(lineup);
  });
});

describe('selectDefaultPlayingMode', () => {
  it('returns the mode marked as default', () => {
    const modes = [playingMode({ id: 'a', isDefault: false }), playingMode({ id: 'b', isDefault: true })];
    expect(selectDefaultPlayingMode(modes)?.id).toBe('b');
  });

  it('returns null when no mode is marked default', () => {
    const modes = [playingMode({ id: 'a', isDefault: false })];
    expect(selectDefaultPlayingMode(modes)).toBeNull();
  });

  it('returns null for an empty list', () => {
    expect(selectDefaultPlayingMode([])).toBeNull();
  });
});

describe('selectPlayingModeById', () => {
  const modes = [playingMode({ id: 'a' }), playingMode({ id: 'b' })];

  it('finds a mode by id', () => {
    expect(selectPlayingModeById(modes, 'b')?.id).toBe('b');
  });

  it('returns undefined for a missing id', () => {
    expect(selectPlayingModeById(modes, 'missing')).toBeUndefined();
  });

  it('returns undefined for null/undefined id', () => {
    expect(selectPlayingModeById(modes, null)).toBeUndefined();
    expect(selectPlayingModeById(modes, undefined)).toBeUndefined();
  });
});

describe('selectFormationById', () => {
  const formations = [formation({ id: 'a' }), formation({ id: 'b' })];

  it('finds a formation by id', () => {
    expect(selectFormationById(formations, 'a')?.id).toBe('a');
  });

  it('returns undefined for a missing or empty id', () => {
    expect(selectFormationById(formations, 'missing')).toBeUndefined();
    expect(selectFormationById(formations, null)).toBeUndefined();
  });
});

describe('selectSlotDisplayIndexes', () => {
  it('leaves unique position codes without a display index', () => {
    const slots = [slot({ id: 'gk', positionCode: 'GK' }), slot({ id: 'lb', positionCode: 'LB' })];
    const indexes = selectSlotDisplayIndexes(slots);
    expect(indexes.get('gk')).toBeNull();
    expect(indexes.get('lb')).toBeNull();
  });

  it('numbers duplicate position codes in array order', () => {
    const slots = [
      slot({ id: 'cb-1', positionCode: 'CB' }),
      slot({ id: 'cb-2', positionCode: 'CB' }),
      slot({ id: 'cb-3', positionCode: 'CB' }),
    ];
    const indexes = selectSlotDisplayIndexes(slots);
    expect(indexes.get('cb-1')).toBe(1);
    expect(indexes.get('cb-2')).toBe(2);
    expect(indexes.get('cb-3')).toBe(3);
  });
});

describe('selectAssignmentsForPeriod / selectBenchedPlayerIds', () => {
  it('returns assignments for the matching period, empty for unplanned periods', () => {
    const t = team({
      selectedPlayers: ['p1', 'p2'],
      lineup: [{ periodNumber: 1, assignments: [{ slotId: 's1', playerId: 'p1' }] }],
    });

    expect(selectAssignmentsForPeriod(t, 1)).toHaveLength(1);
    expect(selectAssignmentsForPeriod(t, 2)).toHaveLength(0);
  });

  it('treats unassigned selected players as implicitly benched', () => {
    const t = team({
      selectedPlayers: ['p1', 'p2', 'p3'],
      lineup: [{ periodNumber: 1, assignments: [{ slotId: 's1', playerId: 'p1' }] }],
    });

    expect(selectBenchedPlayerIds(t, 1)).toEqual(['p2', 'p3']);
  });

  it('benches everyone when the period has no lineup entry', () => {
    const t = team({ selectedPlayers: ['p1', 'p2'], lineup: [] });
    expect(selectBenchedPlayerIds(t, 1)).toEqual(['p1', 'p2']);
  });
});

describe('selectStaleAssignmentsForPeriod / hasLineupRosterMismatch', () => {
  it('flags assignments referencing a player no longer selected', () => {
    const t = team({
      selectedPlayers: ['p1'],
      lineup: [{ periodNumber: 1, assignments: [{ slotId: 's1', playerId: 'p1' }, { slotId: 's2', playerId: 'p-removed' }] }],
    });

    expect(selectStaleAssignmentsForPeriod(t, 1)).toEqual([{ slotId: 's2', playerId: 'p-removed' }]);
    expect(hasLineupRosterMismatch(t, 1)).toBe(true);
  });

  it('reports no mismatch when all assignments reference selected players', () => {
    const t = team({
      selectedPlayers: ['p1', 'p2'],
      lineup: [{ periodNumber: 1, assignments: [{ slotId: 's1', playerId: 'p1' }] }],
    });

    expect(hasLineupRosterMismatch(t, 1)).toBe(false);
  });
});
