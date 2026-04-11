import { describe, expect, it } from 'vitest';
import type { Player, Trainer } from '../../types';
import { selectTeamTrainerAssigneeById, selectTeamTrainerAssigneeMap, selectTeamTrainerOptions } from './teamTrainerSelectors';

function trainer(overrides: Partial<Trainer>): Trainer {
  return {
    id: 't-default',
    firstName: 'Alex',
    lastName: 'Coach',
    email: 'alex@example.com',
    ...overrides,
  };
}

function player(overrides: Partial<Player>): Player {
  return {
    id: 'p-default',
    firstName: 'Mia',
    lastName: 'Player',
    birthYear: 2016,
    level: 3,
    status: 'active',
    guardians: [],
    ...overrides,
  };
}

describe('team trainer selectors', () => {
  it('returns trainers and guardians sorted by name', () => {
    const trainers = [
      trainer({ id: 't-2', firstName: 'Zed', lastName: 'Trainer' }),
      trainer({ id: 't-1', firstName: 'Anna', lastName: 'Coach' }),
    ];

    const players = [
      player({
        id: 'p-1',
        guardians: [
          { id: 'g-2', firstName: 'Iris', lastName: 'Alpha' },
          { id: 'g-1', firstName: 'Noah', lastName: 'Stone' },
        ],
      }),
    ];

    const result = selectTeamTrainerOptions(trainers, players);

    expect(result.map((entry) => entry.id)).toEqual(['g-2', 't-1', 'g-1', 't-2']);
    expect(result.find((entry) => entry.id === 'g-2')?.source).toBe('guardian');
    expect(result.find((entry) => entry.id === 't-1')?.source).toBe('trainer');
  });

  it('deduplicates guardians across players and keeps trainer precedence by id', () => {
    const trainers = [
      trainer({ id: 'shared-id', firstName: 'Sam', lastName: 'Trainer' }),
    ];

    const players = [
      player({
        id: 'p-1',
        guardians: [
          { id: 'g-1', firstName: 'Robin', lastName: 'Guardian' },
          { id: 'shared-id', firstName: 'Should', lastName: 'BeIgnored' },
        ],
      }),
      player({
        id: 'p-2',
        guardians: [
          { id: 'g-1', firstName: 'Robin', lastName: 'Guardian' },
        ],
      }),
    ];

    const result = selectTeamTrainerOptions(trainers, players);

    expect(result.filter((entry) => entry.id === 'g-1')).toHaveLength(1);
    expect(result.find((entry) => entry.id === 'shared-id')).toMatchObject({
      firstName: 'Sam',
      lastName: 'Trainer',
      source: 'trainer',
    });
  });

  it('resolves assignee by trainer id and by guardian id', () => {
    const trainers = [trainer({ id: 't-1', firstName: 'Alex', lastName: 'Coach' })];
    const players = [
      player({
        guardians: [{ id: 'g-1', firstName: 'Lia', lastName: 'Parent' }],
      }),
    ];

    const trainerAssignee = selectTeamTrainerAssigneeById('t-1', trainers, players);
    const guardianAssignee = selectTeamTrainerAssigneeById('g-1', trainers, players);
    const missingAssignee = selectTeamTrainerAssigneeById('missing', trainers, players);

    expect(trainerAssignee).toMatchObject({ id: 't-1', source: 'trainer' });
    expect(guardianAssignee).toMatchObject({ id: 'g-1', source: 'guardian' });
    expect(missingAssignee).toBeNull();
  });

  describe('selectTeamTrainerAssigneeMap', () => {
    it('returns a map with trainers and guardians', () => {
      const trainers = [trainer({ id: 't-1', firstName: 'Alex', lastName: 'Coach' })];
      const players = [
        player({ guardians: [{ id: 'g-1', firstName: 'Lia', lastName: 'Parent' }] }),
      ];

      const map = selectTeamTrainerAssigneeMap(trainers, players);

      expect(map.get('t-1')).toMatchObject({ id: 't-1', source: 'trainer' });
      expect(map.get('g-1')).toMatchObject({ id: 'g-1', source: 'guardian' });
      expect(map.get('missing')).toBeUndefined();
    });

    it('trainers take precedence over guardians with the same id', () => {
      const trainers = [trainer({ id: 'shared', firstName: 'Sam', lastName: 'Trainer' })];
      const players = [
        player({ guardians: [{ id: 'shared', firstName: 'Should', lastName: 'BeIgnored' }] }),
      ];

      const map = selectTeamTrainerAssigneeMap(trainers, players);

      expect(map.get('shared')).toMatchObject({ source: 'trainer', firstName: 'Sam' });
    });

    it('deduplicates guardians appearing across multiple players', () => {
      const trainers: Trainer[] = [];
      const players = [
        player({ id: 'p-1', guardians: [{ id: 'g-1', firstName: 'Robin', lastName: 'G' }] }),
        player({ id: 'p-2', guardians: [{ id: 'g-1', firstName: 'Robin', lastName: 'G' }] }),
      ];

      const map = selectTeamTrainerAssigneeMap(trainers, players);

      expect(map.size).toBe(1);
    });

    it('returns empty map when no trainers or players', () => {
      const map = selectTeamTrainerAssigneeMap([], []);
      expect(map.size).toBe(0);
    });
  });
});
