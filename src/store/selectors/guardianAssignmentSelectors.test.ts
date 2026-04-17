import { describe, expect, it } from 'vitest';
import type { Player, Trainer } from '../../types';
import { selectExistingGuardianUsers } from './guardianAssignmentSelectors';

function player(overrides: Partial<Player>): Player {
  return {
    id: 'p-default',
    firstName: 'Player',
    lastName: 'Default',
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
    firstName: 'Trainer',
    lastName: 'Default',
    email: 'trainer@example.com',
    ...overrides,
  };
}

describe('guardian assignment selectors', () => {
  it('returns trainers and linked guardians as existing-user options', () => {
    const players = [
      player({
        id: 'p-1',
        guardians: [
          { id: 'g-1', userId: 'g-1', firstName: 'Gina', lastName: 'Archer', email: 'gina@example.com' },
        ],
      }),
    ];

    const trainers = [
      trainer({ id: 't-1', firstName: 'Tom', lastName: 'Baker', email: 'tom@example.com' }),
    ];

    expect(selectExistingGuardianUsers(players, trainers)).toEqual([
      { id: 'g-1', firstName: 'Gina', lastName: 'Archer', email: 'gina@example.com', source: 'guardian' },
      { id: 't-1', firstName: 'Tom', lastName: 'Baker', email: 'tom@example.com', source: 'trainer' },
    ]);
  });

  it('dedupes users by id and keeps trainer source when both trainer and guardian', () => {
    const players = [
      player({
        id: 'p-1',
        guardians: [
          { id: 't-1', userId: 't-1', firstName: 'Tom', lastName: 'Baker', email: 'tom@example.com' },
          { id: 't-1', userId: 't-1', firstName: 'Tom', lastName: 'Baker' },
        ],
      }),
    ];

    const trainers = [
      trainer({ id: 't-1', firstName: 'Tom', lastName: 'Baker', email: 'tom@example.com' }),
    ];

    expect(selectExistingGuardianUsers(players, trainers)).toEqual([
      { id: 't-1', firstName: 'Tom', lastName: 'Baker', email: 'tom@example.com', source: 'trainer' },
    ]);
  });

  it('excludes documented-only guardians without linked user id', () => {
    const players = [
      player({
        id: 'p-1',
        guardians: [
          { id: 'doc-1', firstName: 'Dana', lastName: 'Contact', isDocumentedOnly: true },
          { id: 'g-2', firstName: 'Lena', lastName: 'Guardian' },
        ],
      }),
    ];

    const result = selectExistingGuardianUsers(players, []);

    expect(result).toEqual([
      { id: 'g-2', firstName: 'Lena', lastName: 'Guardian', email: undefined, source: 'guardian' },
    ]);
  });
});