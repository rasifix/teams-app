import { describe, expect, it } from 'vitest';
import type { Player, Trainer } from '../../types';
import { selectPlayerImportDiff, type ParsedPlayerImportCandidate } from './memberImportSelectors';

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

function candidate(overrides: Partial<ParsedPlayerImportCandidate>): ParsedPlayerImportCandidate {
  return {
    id: 'row-1',
    sourceRow: 2,
    firstName: 'New',
    lastName: 'Player',
    birthDate: '2016-03-31',
    guardians: [],
    issues: [],
    ...overrides,
  };
}

describe('member import selectors', () => {
  it('creates new player with defaults and planned guardians', () => {
    const candidates = [
      candidate({
        guardians: [
          { firstName: 'Jane', lastName: 'Player', email: 'jane@example.com' },
        ],
      }),
    ];

    const result = selectPlayerImportDiff(candidates, [], []);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].createPlayer).toMatchObject({
      firstName: 'New',
      lastName: 'Player',
      level: 1,
      status: 'active',
      birthDate: '2016-03-31',
      birthYear: 2016,
    });
    expect(result.rows[0].guardiansToAdd).toHaveLength(1);
    expect(result.summary.newPlayers).toBe(1);
  });

  it('matches existing player by name and birth date and plans birthDate fill', () => {
    const players = [
      player({
        id: 'p-1',
        firstName: 'Ali',
        lastName: 'Rahimi',
        birthDate: undefined,
        birthYear: 2016,
      }),
    ];

    const candidates = [
      candidate({
        firstName: 'Ali',
        lastName: 'Rahimi',
        birthDate: '2016-03-31',
      }),
    ];

    const result = selectPlayerImportDiff(candidates, players, []);

    expect(result.rows[0].existingPlayerId).toBe('p-1');
    expect(result.rows[0].fillBirthDate).toBe('2016-03-31');
    expect(result.rows[0].createPlayer).toBeUndefined();
  });

  it('matches existing player by name only when csv has no birth date', () => {
    const players = [
      player({ id: 'p-1', firstName: 'Alan', lastName: 'Mosca', birthDate: undefined }),
    ];

    const candidates = [
      candidate({ firstName: 'Alan', lastName: 'Mosca', birthDate: undefined }),
    ];

    const result = selectPlayerImportDiff(candidates, players, []);

    expect(result.rows[0].existingPlayerId).toBe('p-1');
    expect(result.rows[0].createPlayer).toBeUndefined();
  });

  it('links guardian to trainer by matching email', () => {
    const trainers = [
      trainer({ id: 't-1', firstName: 'Flurim', lastName: 'Berisha', email: 'errnesaberisha01@icloud.com' }),
    ];

    const candidates = [
      candidate({
        guardians: [
          {
            firstName: 'Flurim',
            lastName: 'Berisha',
            email: 'errnesaberisha01@icloud.com',
          },
        ],
      }),
    ];

    const result = selectPlayerImportDiff(candidates, [], trainers);

    expect(result.rows[0].guardiansToAdd).toHaveLength(1);
    expect(result.rows[0].guardiansToAdd[0].trainerId).toBe('t-1');
    expect(result.rows[0].guardiansToAdd[0].firstName).toBe('Flurim');
  });

  it('suppresses guardian duplicates already assigned to existing player', () => {
    const players = [
      player({
        id: 'p-1',
        firstName: 'Ali',
        lastName: 'Rahimi',
        birthDate: '2016-03-31',
        guardians: [
          {
            id: 'g-1',
            firstName: 'Sakina',
            lastName: 'Rahimi',
            email: 'sakinarahimi1116@gmail.com',
            isDocumentedOnly: true,
          },
        ],
      }),
    ];

    const candidates = [
      candidate({
        firstName: 'Ali',
        lastName: 'Rahimi',
        birthDate: '2016-03-31',
        guardians: [
          {
            firstName: 'Sakina',
            lastName: 'Rahimi',
            email: 'sakinarahimi1116@gmail.com',
          },
        ],
      }),
    ];

    const result = selectPlayerImportDiff(candidates, players, []);

    expect(result.rows[0].guardiansToAdd).toHaveLength(0);
    expect(result.rows[0].isActionable).toBe(false);
  });

  it('suppresses guardian duplicates by email even when existing guardian has no documented flag', () => {
    const players = [
      player({
        id: 'p-1',
        firstName: 'Ali',
        lastName: 'Rahimi',
        birthDate: '2016-03-31',
        guardians: [
          {
            id: 'g-backend',
            firstName: 'Sakina',
            lastName: 'Rahimi',
            email: 'sakinarahimi1116@gmail.com',
          },
        ],
      }),
    ];

    const candidates = [
      candidate({
        firstName: 'Ali',
        lastName: 'Rahimi',
        birthDate: '2016-03-31',
        guardians: [
          {
            firstName: 'Sakina',
            lastName: 'Rahimi',
            email: 'sakinarahimi1116@gmail.com',
          },
        ],
      }),
    ];

    const result = selectPlayerImportDiff(candidates, players, []);

    expect(result.rows[0].guardiansToAdd).toHaveLength(0);
    expect(result.rows[0].isActionable).toBe(false);
  });

  it('marks ambiguous player matches as non-actionable', () => {
    const players = [
      player({ id: 'p-1', firstName: 'Leo', lastName: 'Kage', birthDate: undefined }),
      player({ id: 'p-2', firstName: 'Leo', lastName: 'Kage', birthDate: undefined }),
    ];

    const candidates = [
      candidate({ firstName: 'Leo', lastName: 'Kage', birthDate: undefined }),
    ];

    const result = selectPlayerImportDiff(candidates, players, []);

    expect(result.rows[0].isActionable).toBe(false);
    expect(result.rows[0].issues).toContain('ambiguous-player-match');
  });

  it('marks new rows without birth date as invalid for player creation', () => {
    const candidates = [
      candidate({
        firstName: 'No',
        lastName: 'Birthdate',
        birthDate: undefined,
      }),
    ];

    const result = selectPlayerImportDiff(candidates, [], []);

    expect(result.rows[0].createPlayer).toBeUndefined();
    expect(result.rows[0].isActionable).toBe(false);
    expect(result.rows[0].issues).toContain('missing-birth-date-for-new-player');
  });
});
