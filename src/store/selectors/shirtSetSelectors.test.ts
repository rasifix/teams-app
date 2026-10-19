import { describe, expect, it } from 'vitest';
import type { Player, Shirt, ShirtSet, Team } from '../../types';
import { selectGeneratedShirts, selectShirtAssignmentRows, selectShirtAssignmentSetup, selectShirtNumbersForSet, selectSortedShirtNumbers, selectSortedShirts } from './shirtSetSelectors';

const shirt = (number: number): Shirt => ({
  number,
  size: 'M',
  isGoalkeeper: false,
  status: 'available',
});

describe('selectShirtAssignmentSetup', () => {
  const team: Team = { id: 'team-1', name: 'Team', strength: 2, selectedPlayers: ['p1', 'p2', 'missing'] };
  const players: Player[] = [
    { id: 'p1', firstName: 'Ada', lastName: 'One', birthDate: '2014-01-01', level: 3, status: 'active', preferredShirtNumber: 7 },
    { id: 'p2', firstName: 'Ben', lastName: 'Two', birthDate: '2014-01-01', level: 3, status: 'active', preferredShirtNumber: 9 },
  ];
  const shirtSet: ShirtSet = { id: 'set-1', sponsor: 'Sponsor', color: '#123456', shirts: [shirt(9), { ...shirt(4), status: 'unavailable' }, shirt(7)] };

  it('preserves valid current assignments and sorts available shirts', () => {
    const result = selectShirtAssignmentSetup(team, players, [shirtSet], 'set-1', 'set-1', [{ playerId: 'p1', shirtNumber: 9 }], {});
    expect(result.availableShirts.map((item) => item.number)).toEqual([7, 9]);
    expect(result.assignments).toEqual([
      { playerId: 'p1', shirtNumber: 9 },
      { playerId: 'p2', shirtNumber: 0 },
      { playerId: 'missing', shirtNumber: 0 },
    ]);
  });

  it('uses preferences for a new set while excluding numbers used by another team', () => {
    expect(selectShirtAssignmentSetup(team, players, [shirtSet], 'set-1', undefined, undefined, { 'set-1': [7] }).assignments).toEqual([
      { playerId: 'p1', shirtNumber: 0 },
      { playerId: 'p2', shirtNumber: 9 },
      { playerId: 'missing', shirtNumber: 0 },
    ]);
  });

  it('returns safe empty data when the selected set does not exist', () => {
    const result = selectShirtAssignmentSetup(team, players, [shirtSet], 'missing', undefined, undefined, {});
    expect(result).toMatchObject({ shirtSet: null, availableShirts: [], assignments: [] });
    expect(result.usedInOtherTeams.size).toBe(0);
  });

  it('builds assignment rows in roster order with missing-player and number fallbacks', () => {
    expect(selectShirtAssignmentRows(team, players, [{ playerId: 'p2', shirtNumber: 9 }]).map((row) => ({
      playerId: row.player.id,
      shirtNumber: row.shirtNumber,
    }))).toEqual([
      { playerId: 'p1', shirtNumber: 0 },
      { playerId: 'p2', shirtNumber: 9 },
    ]);
    expect(selectShirtAssignmentRows({ ...team, selectedPlayers: [] }, players, [])).toEqual([]);
  });
});

describe('selectSortedShirts', () => {
  it('sorts shirts by number without mutating the source array', () => {
    const source = [shirt(3), shirt(1), shirt(2)];

    expect(selectSortedShirts(source).map((item) => item.number)).toEqual([1, 2, 3]);
    expect(source.map((item) => item.number)).toEqual([3, 1, 2]);
  });

  it('keeps duplicate numbers available for validation and editing', () => {
    const source = [shirt(7), shirt(7)];

    expect(selectSortedShirts(source)).toHaveLength(2);
  });

  it('falls back to an empty list when shirts are missing', () => {
    expect(selectSortedShirts(undefined)).toEqual([]);
    expect(selectSortedShirts(null)).toEqual([]);
  });
});

describe('shirt number and generation selectors', () => {
  it('sorts copied shirt numbers and resolves numbers for a set with exclusions', () => {
    const source = [9, 2, 7];
    expect(selectSortedShirtNumbers(source)).toEqual([2, 7, 9]);
    expect(source).toEqual([9, 2, 7]);
    expect(selectShirtNumbersForSet([{ id: 'set-1', sponsor: 'A', color: '#000', shirts: [shirt(9), shirt(2), shirt(7)] }], 'set-1', 7)).toEqual([2, 9]);
    expect(selectShirtNumbersForSet([], 'missing')).toEqual([]);
  });

  it('generates regular shirts and replaces an overlapping number with a goalkeeper shirt', () => {
    expect(selectGeneratedShirts({
      createShirts: true, startNumber: 1, endNumber: 3, size: 'M', includeGoalkeeper: true, goalkeeperNumber: 1,
    })).toEqual([
      { number: 2, size: 'M', isGoalkeeper: false, status: 'available' },
      { number: 3, size: 'M', isGoalkeeper: false, status: 'available' },
      { number: 1, size: 'M', isGoalkeeper: true, status: 'available' },
    ]);
  });

  it('returns safe generation fallbacks and permits a goalkeeper outside the regular range', () => {
    const base = { createShirts: false, startNumber: 3, endNumber: 1, size: 'S' as const, includeGoalkeeper: false, goalkeeperNumber: 1 };
    expect(selectGeneratedShirts(base)).toEqual([]);
    expect(selectGeneratedShirts({ ...base, createShirts: true })).toEqual([]);
    expect(selectGeneratedShirts({ ...base, createShirts: true, startNumber: 1, endNumber: 1, includeGoalkeeper: true, goalkeeperNumber: 99 })).toHaveLength(2);
  });
});
