import { describe, expect, it } from 'vitest';
import type { Player, Trainer } from '../../types';
import {
  isDuplicateTargetMember,
  selectImportableGroupMembers,
  selectSourceGroupCandidates,
  selectSourceMemberBirthYears,
  type GroupImportCandidate,
} from './memberGroupImportSelectors';

function player(overrides: Partial<Player>): Player {
  return {
    id: 'p-default',
    firstName: 'John',
    lastName: 'Doe',
    birthYear: 2016,
    birthDate: '2016-01-01',
    level: 3,
    status: 'active',
    guardians: [],
    ...overrides,
  };
}

function trainer(overrides: Partial<Trainer>): Trainer {
  return {
    id: 't-default',
    firstName: 'Alex',
    lastName: 'Coach',
    email: 'alex@example.com',
    ...overrides,
  };
}

function candidate(overrides: Partial<GroupImportCandidate>): GroupImportCandidate {
  return {
    id: 'c-1',
    role: 'player',
    firstName: 'Ari',
    lastName: 'Meyer',
    birthDate: '2016-02-03',
    birthYear: 2016,
    ...overrides,
  };
}

describe('member group import selectors', () => {
  it('sorts source candidates by name with players before trainers on same name', () => {
    const sourcePlayers = [
      player({ id: 'p-2', firstName: 'Ben', lastName: 'Zimmer' }),
      player({ id: 'p-1', firstName: 'Ari', lastName: 'Meyer' }),
    ];
    const sourceTrainers = [
      trainer({ id: 't-1', firstName: 'Ari', lastName: 'Meyer', email: 'ari@example.com' }),
    ];

    const result = selectSourceGroupCandidates(sourcePlayers, sourceTrainers);

    expect(result.map((entry) => `${entry.role}:${entry.id}`)).toEqual(['player:p-1', 'trainer:t-1', 'player:p-2']);
  });

  it('detects duplicate player by normalized name and birthDate', () => {
    const duplicate = isDuplicateTargetMember(
      candidate({
        role: 'player',
        firstName: '  Ari ',
        lastName: 'Meyer',
        birthDate: '2016-02-03',
      }),
      [player({ id: 'p-1', firstName: 'ari', lastName: 'meyer', birthDate: '2016-02-03' })],
      []
    );

    expect(duplicate).toBe(true);
  });

  it('detects duplicate player by birthYear when birthDate is missing', () => {
    const duplicate = isDuplicateTargetMember(
      candidate({
        role: 'player',
        firstName: 'Ari',
        lastName: 'Meyer',
        birthDate: undefined,
        birthYear: 2016,
      }),
      [player({ id: 'p-1', firstName: 'Ari', lastName: 'Meyer', birthDate: undefined, birthYear: 2016 })],
      []
    );

    expect(duplicate).toBe(true);
  });

  it('detects duplicate trainer by name and email', () => {
    const duplicate = isDuplicateTargetMember(
      candidate({
        role: 'trainer',
        firstName: 'Lea',
        lastName: 'Coach',
        email: 'lea@example.com',
      }),
      [],
      [trainer({ id: 't-1', firstName: 'Lea', lastName: 'Coach', email: 'lea@example.com' })]
    );

    expect(duplicate).toBe(true);
  });

  it('hides already existing members from importable list', () => {
    const sourcePlayers = [
      player({ id: 'sp-1', firstName: 'Ari', lastName: 'Meyer', birthDate: '2016-02-03', birthYear: 2016 }),
      player({ id: 'sp-2', firstName: 'Nia', lastName: 'Keller', birthDate: '2015-04-01', birthYear: 2015 }),
    ];
    const sourceTrainers = [
      trainer({ id: 'st-1', firstName: 'Lia', lastName: 'Coach', email: 'lia@example.com' }),
      trainer({ id: 'st-2', firstName: 'Tim', lastName: 'Coach', email: 'tim@example.com' }),
    ];

    const targetPlayers = [
      player({ id: 'tp-1', firstName: 'Ari', lastName: 'Meyer', birthDate: '2016-02-03', birthYear: 2016 }),
    ];
    const targetTrainers = [
      trainer({ id: 'tt-1', firstName: 'Lia', lastName: 'Coach', email: 'lia@example.com' }),
    ];

    const result = selectImportableGroupMembers(sourcePlayers, sourceTrainers, targetPlayers, targetTrainers);

    expect(result.map((entry) => entry.id)).toEqual(['st-2', 'sp-2']);
  });

  it('returns sorted unique birth years from source players', () => {
    const years = selectSourceMemberBirthYears([
      player({ id: 'p-1', birthDate: '2016-01-01' }),
      player({ id: 'p-2', birthDate: '2014-06-15' }),
      player({ id: 'p-3', birthDate: '2016-09-30' }),
      player({ id: 'p-4', birthDate: '2015-12-24' }),
    ]);

    expect(years).toEqual([2014, 2015, 2016]);
  });

  it('filters importable members by one or more selected birth years while keeping trainers visible', () => {
    const sourcePlayers = [
      player({ id: 'sp-1', firstName: 'Ari', lastName: 'Meyer', birthDate: '2016-02-03', birthYear: 2016 }),
      player({ id: 'sp-2', firstName: 'Nia', lastName: 'Meyer', birthDate: '2015-03-10', birthYear: 2015 }),
    ];
    const sourceTrainers = [trainer({ id: 'st-1', firstName: 'Lia', lastName: 'Coach', email: 'lia@example.com' })];

    const result = selectImportableGroupMembers(sourcePlayers, sourceTrainers, [], [], [2015]);

    expect(result.map((entry) => `${entry.role}:${entry.id}`)).toEqual(['trainer:st-1', 'player:sp-2']);
  });

  it('excludes inactive players from importable results', () => {
    const sourcePlayers = [
      player({ id: 'sp-active', firstName: 'Ari', lastName: 'Meyer', birthDate: '2016-02-03', status: 'active' }),
      player({ id: 'sp-inactive', firstName: 'Nia', lastName: 'Meyer', birthDate: '2015-03-10', status: 'inactive' }),
    ];

    const result = selectImportableGroupMembers(sourcePlayers, [], [], [], [2015, 2016]);

    expect(result.map((entry) => entry.id)).toEqual(['sp-active']);
  });
});
