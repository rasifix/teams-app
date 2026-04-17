import { describe, expect, it } from 'vitest';
import type { Player, Trainer } from '../../types';
import { mergeMembersFromCollections, selectPlayersFromMembers, selectTrainersFromMembers, type GroupMember } from './memberSelectors';

function player(overrides: Partial<Player>): Player {
  return {
    id: 'p-default',
    firstName: 'Mia',
    lastName: 'Player',
    birthYear: 2016,
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
    const members: GroupMember[] = [
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
    const members: GroupMember[] = [
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
      player({ id: 'm-1', firstName: 'Sam', lastName: 'Member', birthYear: 2013, level: 4, roles: ['player'] }),
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
});
