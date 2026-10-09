import { describe, expect, it } from 'vitest';
import type { Player, Trainer } from '../../types';
import { selectTeamAssigneeById, selectTeamAssigneeMap, selectTeamAssigneeOptions, selectTeamResponsiblePeople } from './teamTrainerSelectors';

const trainer = (overrides: Partial<Trainer>): Trainer => ({ id: 't-default', firstName: 'Alex', lastName: 'Coach', ...overrides });
const player = (overrides: Partial<Player>): Player => ({
  id: 'p-default', firstName: 'Mia', lastName: 'Player', birthDate: '2016-06-15', level: 3, status: 'active', ...overrides,
});

describe('team responsible person selectors', () => {
  it('returns roster players and trainers sorted by name', () => {
    expect(selectTeamAssigneeOptions(
      [trainer({ id: 't-1', firstName: 'Anna', lastName: 'Coach' })],
      [player({ id: 'p-1', firstName: 'Mia', lastName: 'Alpha' })]
    )).toEqual([
      { id: 'p-1', firstName: 'Mia', lastName: 'Alpha', source: 'player' },
      { id: 't-1', firstName: 'Anna', lastName: 'Coach', source: 'trainer' },
    ]);
  });

  it('deduplicates overlapping member ids and returns a map', () => {
    const members = selectTeamAssigneeMap(
      [trainer({ id: 'same', firstName: 'Trainer' })],
      [player({ id: 'same', firstName: 'Player' })]
    );
    expect(members.size).toBe(1);
    expect(members.get('same')).toMatchObject({ source: 'trainer', firstName: 'Trainer' });
    expect(selectTeamAssigneeOptions([], [])).toEqual([]);
  });

  it('resolves an id or null for missing/empty ids', () => {
    const trainers = [trainer({ id: 't-1' })];
    expect(selectTeamAssigneeById('t-1', trainers, [])).toMatchObject({ id: 't-1' });
    expect(selectTeamAssigneeById('missing', trainers, [])).toBeNull();
    expect(selectTeamAssigneeById(undefined, trainers, [])).toBeNull();
  });

  it('preserves responsible person order and marks the first valid entry as lead', () => {
    const trainers = [trainer({ id: 't-1' })];
    const players = [player({ id: 'p-1' })];
    expect(selectTeamResponsiblePeople(['t-1', 'unknown', 'p-1'], trainers, players)).toEqual([
      { id: 't-1', firstName: 'Alex', lastName: 'Coach', source: 'trainer', isLead: true },
      { id: 'p-1', firstName: 'Mia', lastName: 'Player', source: 'player', isLead: false },
    ]);
    expect(selectTeamResponsiblePeople(undefined, [], [])).toEqual([]);
  });
});
