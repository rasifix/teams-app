import { describe, expect, it } from 'vitest';
import type { Player, Trainer } from '../../types';
import { filterTeamAssignees, selectTeamAssigneeById, selectTeamAssigneeMap, selectTeamAssigneeOptions, selectTeamResponsiblePeople, selectTrainerForUser } from './teamTrainerSelectors';

const trainer = (overrides: Partial<Trainer>): Trainer => ({ id: 't-default', firstName: 'Alex', lastName: 'Coach', ...overrides });

const player = (overrides: Partial<Player>): Player => ({
  id: 'p-default', firstName: 'Mia', lastName: 'Player', birthDate: '2016-06-15', level: 3, status: 'active', ...overrides,
});

describe('team responsible person selectors', () => {
  it('returns only trainers sorted by name', () => {
    expect(selectTeamAssigneeOptions([
      trainer({ id: 't-2', firstName: 'Zoe', lastName: 'Coach' }),
      trainer({ id: 't-1', firstName: 'Anna', lastName: 'Coach' }),
    ])).toEqual([
      { id: 't-1', firstName: 'Anna', lastName: 'Coach', source: 'trainer' },
      { id: 't-2', firstName: 'Zoe', lastName: 'Coach', source: 'trainer' },
    ]);
    expect(selectTeamAssigneeOptions([])).toEqual([]);
  });

  it('returns a map keyed by trainer id', () => {
    const members = selectTeamAssigneeMap([trainer({ id: 'same', firstName: 'Trainer' })]);
    expect(members.size).toBe(1);
    expect(members.get('same')).toMatchObject({ source: 'trainer', firstName: 'Trainer' });
  });

  it('resolves an id or null for missing/empty ids', () => {
    const trainers = [trainer({ id: 't-1' })];
    expect(selectTeamAssigneeById('t-1', trainers)).toMatchObject({ id: 't-1' });
    expect(selectTeamAssigneeById('missing', trainers)).toBeNull();
    expect(selectTeamAssigneeById(undefined, trainers)).toBeNull();
  });

  it('returns only the first valid responsible person and drops player or unknown ids', () => {
    const trainers = [trainer({ id: 't-1' }), trainer({ id: 't-2', firstName: 'Bea' })];
    expect(selectTeamResponsiblePeople('t-2', trainers)).toEqual([
      { id: 't-2', firstName: 'Bea', lastName: 'Coach', source: 'trainer' },
    ]);
    expect(selectTeamResponsiblePeople(undefined, [])).toEqual([]);
  });

  it('includes guardians but never players, listing a trainer-guardian once as trainer', () => {
    const players = [player({
      id: 'p-1',
      guardians: [
        { id: 'g-1', firstName: 'Greta', lastName: 'Parent' },
        { id: 't-1', firstName: 'Alex', lastName: 'Coach' },
      ],
    })];
    expect(selectTeamAssigneeOptions([trainer({ id: 't-1' })], players)).toEqual([
      { id: 't-1', firstName: 'Alex', lastName: 'Coach', source: 'trainer' },
      { id: 'g-1', firstName: 'Greta', lastName: 'Parent', source: 'guardian' },
    ]);
  });

  it('resolves guardians as responsible people and ignores player ids', () => {
    const players = [player({ id: 'p-1', guardians: [{ id: 'g-1', firstName: 'Greta', lastName: 'Parent' }] })];
    expect(selectTeamResponsiblePeople('g-1', [], players)).toEqual([
      { id: 'g-1', firstName: 'Greta', lastName: 'Parent', source: 'guardian' },
    ]);
  });

  it('resolves the authenticated trainer by id, then by normalized email', () => {
    const trainers = [
      trainer({ id: 't-1', email: 'alex@example.com' }),
      trainer({ id: 't-2', firstName: 'Bea', email: 'bea@example.com' }),
    ];
    expect(selectTrainerForUser({ id: 't-2', email: 'other@example.com' }, trainers)?.id).toBe('t-2');
    expect(selectTrainerForUser({ id: 'user-1', email: ' BEA@example.com ' }, trainers)?.id).toBe('t-2');
  });

  it('does not resolve assign-to-me for missing users or non-trainers', () => {
    const trainers = [trainer({ id: 't-1', email: 'alex@example.com' })];
    expect(selectTrainerForUser(null, trainers)).toBeNull();
    expect(selectTrainerForUser({ id: 'user-1', email: '' }, trainers)).toBeNull();
    expect(selectTrainerForUser({ id: 'user-1', email: 'missing@example.com' }, trainers)).toBeNull();
  });

  it('filters by case-insensitive name terms in any order', () => {
    const options = selectTeamAssigneeOptions([
      trainer({ id: 't-1', firstName: 'Anna', lastName: 'Meier' }),
      trainer({ id: 't-2', firstName: 'Bob', lastName: 'Meyer' }),
    ]);
    expect(filterTeamAssignees(options, '')).toEqual(options);
    expect(filterTeamAssignees(options, '  ')).toEqual(options);
    expect(filterTeamAssignees(options, 'meier anna').map((o) => o.id)).toEqual(['t-1']);
    expect(filterTeamAssignees(options, 'MEY').map((o) => o.id)).toEqual(['t-2']);
    expect(filterTeamAssignees(options, 'zzz')).toEqual([]);
  });
});
