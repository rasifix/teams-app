import { describe, expect, it } from 'vitest';
import type { Player, Trainer } from '../../types';
import { mergeMembersFromCollections, selectFilteredPlayers, selectPlayerBirthYears, selectPlayersFromMembers, selectTrainersFromMembers, type SquadMember } from './memberSelectors';

function player(overrides: Partial<Player>): Player {
  return {
    id: 'p-default',
    firstName: 'Mia',
    lastName: 'Player',
    birthDate: '2016-06-15',
    level: 3,
    status: 'active',
    guardians: [],
    roles: ['player'],
    ...overrides,
  };
}

function trainer(overrides: Partial<Trainer>): Trainer {
  return {
    id: 't-default',
    firstName: 'Alex',
    lastName: 'Trainer',
    email: 'alex@example.com',
    roles: ['trainer'],
    ...overrides,
  };
}

describe('member selectors', () => {
  it('extracts players and trainers from members', () => {
    const members: SquadMember[] = [
      player({ id: 'p-1', firstName: 'Lia' }),
      trainer({ id: 't-1', firstName: 'Noah' }),
    ];

    const players = selectPlayersFromMembers(members);
    const trainers = selectTrainersFromMembers(members);

    expect(players).toHaveLength(1);
    expect(players[0].id).toBe('p-1');
    expect(trainers).toHaveLength(1);
    expect(trainers[0].id).toBe('t-1');
  });

  it('sorts extracted members by last name then first name', () => {
    const members: SquadMember[] = [
      trainer({ id: 't-2', firstName: 'Zed', lastName: 'Coach' }),
      trainer({ id: 't-1', firstName: 'Anna', lastName: 'Coach' }),
      player({ id: 'p-2', firstName: 'Nora', lastName: 'Blue' }),
      player({ id: 'p-1', firstName: 'Ari', lastName: 'Blue' }),
    ];

    expect(selectPlayersFromMembers(members).map((entry) => entry.id)).toEqual(['p-1', 'p-2']);
    expect(selectTrainersFromMembers(members).map((entry) => entry.id)).toEqual(['t-1', 't-2']);
  });

  it('merges split player and trainer collections into one sorted member list', () => {
    const players = [
      player({ id: 'p-2', firstName: 'Max', lastName: 'Zeal' }),
      player({ id: 'p-1', firstName: 'Ari', lastName: 'Blue' }),
    ];
    const trainers = [
      trainer({ id: 't-1', firstName: 'Ben', lastName: 'Trainer' }),
    ];

    const merged = mergeMembersFromCollections(players, trainers);

    expect(merged.map((entry) => entry.id)).toEqual(['p-1', 't-1', 'p-2']);
  });

  it('merges overlapping member ids and keeps player fields with combined roles', () => {
    const players = [
      player({ id: 'm-1', firstName: 'Sam', lastName: 'Member', birthDate: '2013-06-15', level: 4, roles: ['player'] }),
    ];
    const trainers = [
      trainer({ id: 'm-1', firstName: 'Sam', lastName: 'Member', roles: ['trainer'] }),
    ];

    const merged = mergeMembersFromCollections(players, trainers);
    const [entry] = merged;

    expect(entry.id).toBe('m-1');
    expect('level' in entry).toBe(true);
    expect(entry.roles).toEqual(expect.arrayContaining(['player', 'trainer']));
  });

  it('selects unique birth years newest first and ignores missing dates', () => {
    const players = [
      player({ id: 'p-1', birthDate: '2014-05-01' }),
      player({ id: 'p-2', birthDate: '2016-02-01' }),
      player({ id: 'p-3', birthDate: '2014-08-01' }),
      player({ id: 'p-4', birthDate: '' }),
    ];

    expect(selectPlayerBirthYears(players)).toEqual([2016, 2014]);
  });

  it('filters players by level, year, trial, and inactive state', () => {
    const players = [
      player({ id: 'active', level: 3, birthDate: '2015-01-01', status: 'active' }),
      player({ id: 'trial', level: 3, birthDate: '2015-02-01', status: 'trial' }),
      player({ id: 'inactive', level: 4, birthDate: '2014-01-01', status: 'inactive' }),
    ];

    expect(selectFilteredPlayers(players, { levels: [3], birthYear: 2015, includeTrial: false, includeInactive: false }).map((entry) => entry.id)).toEqual(['active']);
    expect(selectFilteredPlayers(players, { levels: [], birthYear: null, includeTrial: true, includeInactive: true })).toEqual(players);
  });

  it('returns an empty result when filters have no match', () => {
    expect(selectFilteredPlayers([player({ level: 2 })], { levels: [5], birthYear: null, includeTrial: true, includeInactive: true })).toEqual([]);
  });
});
