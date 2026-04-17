import { describe, expect, it } from 'vitest';
import type { Player, Trainer } from '../../types';
import {
  selectPlayerImportDiff,
  selectVisiblePlayerImportRows,
  type ParsedPlayerImportCandidate,
} from './memberImportSelectors';

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

  it('matches unique same-name player and updates differing birth date instead of creating duplicate', () => {
    const players = [
      player({
        id: 'p-1',
        firstName: 'Ali',
        lastName: 'Rahimi',
        birthDate: '2016-03-30',
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
    expect(result.rows[0].createPlayer).toBeUndefined();
    expect(result.rows[0].fillBirthDate).toBe('2016-03-31');
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

  it('links guardian to trainer by matching first name, last name and email', () => {
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

  it('suppresses guardian duplicates by full identity even when existing guardian has no documented flag', () => {
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

  it('hides unchanged existing players from visible import rows', () => {
    const players = [
      player({ id: 'p-1', firstName: 'Alan', lastName: 'Mosca', birthDate: '2016-03-31' }),
    ];

    const candidates = [
      candidate({ firstName: 'Alan', lastName: 'Mosca', birthDate: '2016-03-31' }),
    ];

    const result = selectPlayerImportDiff(candidates, players, []);
    const visibleRows = selectVisiblePlayerImportRows(result.rows);

    expect(result.rows).toHaveLength(1);
    expect(visibleRows).toHaveLength(0);
  });

  it('keeps actionable and issue rows visible', () => {
    const players = [
      player({ id: 'p-1', firstName: 'Ali', lastName: 'Rahimi', birthDate: undefined }),
    ];

    const candidates = [
      candidate({ id: 'row-action', firstName: 'Ali', lastName: 'Rahimi', birthDate: '2016-03-31' }),
      candidate({ id: 'row-issue', firstName: '', lastName: 'Invalid', birthDate: '2016-03-31' }),
    ];

    const result = selectPlayerImportDiff(candidates, players, []);
    const visibleRows = selectVisiblePlayerImportRows(result.rows);

    expect(visibleRows.map((row) => row.id)).toEqual(['row-action', 'row-issue']);
  });

  it('links guardian to existing guardian member from another player', () => {
    const players = [
      player({
        id: 'p-existing',
        firstName: 'Child',
        lastName: 'One',
        guardians: [
          {
            id: 'guardian-member-1',
            userId: 'guardian-member-1',
            firstName: 'Max',
            lastName: 'Parent',
            email: 'max.parent@example.com',
          },
        ],
      }),
    ];

    const candidates = [
      candidate({
        id: 'row-link-existing-guardian',
        firstName: 'Child',
        lastName: 'Two',
        guardians: [
          {
            firstName: 'Max',
            lastName: 'Parent',
            email: 'max.parent@example.com',
          },
        ],
      }),
    ];

    const result = selectPlayerImportDiff(candidates, players, []);

    expect(result.rows[0].guardiansToAdd).toHaveLength(1);
    expect(result.rows[0].guardiansToAdd[0].trainerId).toBe('guardian-member-1');
  });

  it('reuses the same existing guardian member when imported for two players', () => {
    const players = [
      player({
        id: 'p-existing',
        firstName: 'Child',
        lastName: 'One',
        guardians: [
          {
            id: 'guardian-member-1',
            userId: 'guardian-member-1',
            firstName: 'Max',
            lastName: 'Parent',
            email: 'max.parent@example.com',
          },
        ],
      }),
    ];

    const candidates = [
      candidate({
        id: 'row-link-1',
        firstName: 'Child',
        lastName: 'Two',
        guardians: [
          {
            firstName: 'Max',
            lastName: 'Parent',
            email: 'max.parent@example.com',
          },
        ],
      }),
      candidate({
        id: 'row-link-2',
        firstName: 'Child',
        lastName: 'Three',
        guardians: [
          {
            firstName: 'Max',
            lastName: 'Parent',
            email: 'max.parent@example.com',
          },
        ],
      }),
    ];

    const result = selectPlayerImportDiff(candidates, players, []);

    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].guardiansToAdd[0].trainerId).toBe('guardian-member-1');
    expect(result.rows[1].guardiansToAdd[0].trainerId).toBe('guardian-member-1');
  });

  it('dedupes guardian additions across duplicate rows for the same existing player', () => {
    const players = [
      player({
        id: 'p-1',
        firstName: 'Ali',
        lastName: 'Rahimi',
        birthDate: '2016-03-31',
        guardians: [],
      }),
    ];

    const candidates = [
      candidate({
        id: 'row-dup-1',
        sourceRow: 2,
        firstName: 'Ali',
        lastName: 'Rahimi',
        birthDate: '2016-03-31',
        guardians: [
          {
            firstName: 'Sakina',
            lastName: 'Rahimi',
            email: 'sakina@example.com',
          },
        ],
      }),
      candidate({
        id: 'row-dup-2',
        sourceRow: 3,
        firstName: 'Ali',
        lastName: 'Rahimi',
        birthDate: '2016-03-31',
        guardians: [
          {
            firstName: 'Sakina',
            lastName: 'Rahimi',
            email: 'sakina@example.com',
          },
        ],
      }),
    ];

    const result = selectPlayerImportDiff(candidates, players, []);

    expect(result.rows[0].guardiansToAdd).toHaveLength(1);
    expect(result.rows[0].isActionable).toBe(true);
    expect(result.rows[1].guardiansToAdd).toHaveLength(0);
    expect(result.rows[1].isActionable).toBe(false);
    expect(result.summary.guardiansToAdd).toBe(1);
  });

  it('does not match guardians by email alone when name differs', () => {
    const players = [
      player({
        id: 'p-existing',
        firstName: 'Child',
        lastName: 'One',
        guardians: [
          {
            id: 'guardian-member-1',
            userId: 'guardian-member-1',
            firstName: 'Max',
            lastName: 'Parent',
            email: 'shared@example.com',
          },
        ],
      }),
    ];

    const candidates = [
      candidate({
        id: 'row-email-only-match',
        firstName: 'Child',
        lastName: 'Two',
        guardians: [
          {
            firstName: 'Other',
            lastName: 'Person',
            email: 'shared@example.com',
          },
        ],
      }),
    ];

    const result = selectPlayerImportDiff(candidates, players, []);

    expect(result.rows[0].guardiansToAdd).toHaveLength(1);
    expect(result.rows[0].guardiansToAdd[0].trainerId).toBeUndefined();
  });

  it('does not match guardians by name alone when email differs', () => {
    const players = [
      player({
        id: 'p-existing',
        firstName: 'Child',
        lastName: 'One',
        guardians: [
          {
            id: 'guardian-member-1',
            userId: 'guardian-member-1',
            firstName: 'Max',
            lastName: 'Parent',
            email: 'first@example.com',
          },
        ],
      }),
    ];

    const candidates = [
      candidate({
        id: 'row-name-only-match',
        firstName: 'Child',
        lastName: 'Two',
        guardians: [
          {
            firstName: 'Max',
            lastName: 'Parent',
            email: 'second@example.com',
          },
        ],
      }),
    ];

    const result = selectPlayerImportDiff(candidates, players, []);

    expect(result.rows[0].guardiansToAdd).toHaveLength(1);
    expect(result.rows[0].guardiansToAdd[0].trainerId).toBeUndefined();
  });
});
