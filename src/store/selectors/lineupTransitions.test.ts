import { describe, expect, it } from 'vitest';
import type { TeamLineupPeriod } from '../../types';
import {
  assignLineupPlayer,
  copyLineupPeriod,
  dropLineupPlayer,
  replaceLineupPeriodAssignments,
} from './lineupTransitions';

const lineup: TeamLineupPeriod[] = [
  { periodNumber: 1, assignments: [{ slotId: 'gk', playerId: 'p1' }, { slotId: 'cb', playerId: 'p2' }] },
  { periodNumber: 2, assignments: [{ slotId: 'gk', playerId: 'p3' }] },
];

describe('lineup transitions', () => {
  it('assigns a player to a slot, removing any previous occurrence and slot occupant', () => {
    expect(assignLineupPlayer(lineup, 1, 'st', 'p1')).toEqual([
      { periodNumber: 1, assignments: [{ slotId: 'cb', playerId: 'p2' }, { slotId: 'st', playerId: 'p1' }] },
      lineup[1],
    ]);
  });

  it('clears a slot when the selected player is empty', () => {
    expect(assignLineupPlayer(lineup, 1, 'gk', '')).toEqual([
      { periodNumber: 1, assignments: [{ slotId: 'cb', playerId: 'p2' }] },
      lineup[1],
    ]);
  });

  it('moves and swaps players on slot drops', () => {
    expect(dropLineupPlayer(lineup, 1, 'p1', 'cb')).toEqual([
      { periodNumber: 1, assignments: [{ slotId: 'gk', playerId: 'p2' }, { slotId: 'cb', playerId: 'p1' }] },
      lineup[1],
    ]);
  });

  it('benches a player and leaves unrelated periods unchanged', () => {
    expect(dropLineupPlayer(lineup, 1, 'p2', null)).toEqual([
      { periodNumber: 1, assignments: [{ slotId: 'gk', playerId: 'p1' }] },
      lineup[1],
    ]);
  });

  it('replaces one period and sorts periods while preserving the rest', () => {
    expect(replaceLineupPeriodAssignments(lineup, 3, [{ slotId: 'st', playerId: 'p4' }])).toEqual([
      lineup[0], lineup[1], { periodNumber: 3, assignments: [{ slotId: 'st', playerId: 'p4' }] },
    ]);
  });

  it('copies a prior period to the target without changing the source', () => {
    expect(copyLineupPeriod(lineup, 1, 3)).toEqual([
      lineup[0], lineup[1], { periodNumber: 3, assignments: lineup[0].assignments },
    ]);
  });

  it('does nothing when the source period is missing', () => {
    expect(copyLineupPeriod(lineup, 4, 5)).toEqual(lineup);
  });
});
