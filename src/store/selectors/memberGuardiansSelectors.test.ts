import { describe, expect, it } from 'vitest';
import type { Player } from '../../types';
import { selectMemberGuardians, selectUniqueMemberGuardians } from './memberGuardiansSelectors';

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

describe('member guardians selectors', () => {
  it('returns an empty list when no players have guardians', () => {
    const players = [
      player({ id: 'p-1', firstName: 'Ali', lastName: 'Rahimi', guardians: [] }),
      player({ id: 'p-2', firstName: 'Mia', lastName: 'Zingg', guardians: undefined }),
    ];

    expect(selectMemberGuardians(players)).toEqual([]);
  });

  it('flattens guardians with player references', () => {
    const players = [
      player({
        id: 'p-1',
        firstName: 'Ali',
        lastName: 'Rahimi',
        guardians: [
          { id: 'g-1', firstName: 'Sakina', lastName: 'Rahimi', email: 'sakina@example.com' },
        ],
      }),
    ];

    const result = selectMemberGuardians(players);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      playerId: 'p-1',
      playerFirstName: 'Ali',
      playerLastName: 'Rahimi',
      guardian: {
        id: 'g-1',
        firstName: 'Sakina',
        lastName: 'Rahimi',
      },
    });
  });

  it('sorts guardians by guardian name, then player name', () => {
    const players = [
      player({
        id: 'p-2',
        firstName: 'Nora',
        lastName: 'Zimmer',
        guardians: [
          { id: 'g-2', firstName: 'Anna', lastName: 'Meier' },
        ],
      }),
      player({
        id: 'p-1',
        firstName: 'Luca',
        lastName: 'Bauer',
        guardians: [
          { id: 'g-1', firstName: 'Anna', lastName: 'Meier' },
          { id: 'g-3', firstName: 'Ben', lastName: 'Aebi' },
        ],
      }),
    ];

    const result = selectMemberGuardians(players);

    expect(result.map((entry) => `${entry.guardian.lastName},${entry.guardian.firstName}:${entry.playerLastName}`)).toEqual([
      'Aebi,Ben:Bauer',
      'Meier,Anna:Bauer',
      'Meier,Anna:Zimmer',
    ]);
  });

  it('returns one card per guardian with linked players', () => {
    const players = [
      player({
        id: 'p-1',
        firstName: 'Luca',
        lastName: 'Bauer',
        guardians: [
          { id: 'g-1', userId: 'm-1', firstName: 'Anna', lastName: 'Meier', email: 'anna@example.com' },
        ],
      }),
      player({
        id: 'p-2',
        firstName: 'Nora',
        lastName: 'Zimmer',
        guardians: [
          { id: 'g-2', userId: 'm-1', firstName: 'Anna', lastName: 'Meier', email: 'anna@example.com' },
          { id: 'g-3', firstName: 'Ben', lastName: 'Aebi', email: 'ben@example.com' },
        ],
      }),
    ];

    const result = selectUniqueMemberGuardians(players);

    expect(result).toHaveLength(2);
    expect(result[0].guardian.lastName).toBe('Aebi');
    expect(result[0].playerRefs).toHaveLength(1);

    const anna = result.find((entry) => (entry.guardian.userId || entry.guardian.id) === 'm-1');
    expect(anna).toBeDefined();
    expect(anna?.playerRefs.map((entry) => entry.playerId)).toEqual(['p-1', 'p-2']);
  });
});
