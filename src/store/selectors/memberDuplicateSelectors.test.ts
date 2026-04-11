import { describe, expect, it } from 'vitest';
import type { Event, Player, Trainer } from '../../types';
import { selectDuplicateTrainerGuardianGroups } from './memberDuplicateSelectors';

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

function event(overrides: Partial<Event>): Event {
  return {
    id: 'e-default',
    name: 'Event',
    date: '2026-01-01',
    maxPlayersPerTeam: 12,
    minPlayersPerTeam: 8,
    teams: [],
    invitations: [],
    ...overrides,
  };
}

describe('member duplicate selectors', () => {
  it('finds duplicates between trainers and guardians by exact normalized name', () => {
    const trainers = [
      trainer({ id: 't-1', firstName: 'Ali', lastName: 'Rahimi' }),
      trainer({ id: 't-2', firstName: 'Other', lastName: 'Coach' }),
    ];

    const players = [
      player({
        id: 'p-1',
        guardians: [
          { id: 'g-1', firstName: 'Ali', lastName: 'Rahimi', email: 'ali.parent@example.com' },
        ],
      }),
    ];

    const result = selectDuplicateTrainerGuardianGroups(players, trainers, []);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      firstName: 'Ali',
      lastName: 'Rahimi',
      recommendedTrainerId: 't-1',
    });
    expect(result[0].guardians[0].id).toBe('g-1');
  });

  it('recommends the trainer assigned to more teams', () => {
    const trainers = [
      trainer({ id: 't-1', firstName: 'Sam', lastName: 'Coach' }),
      trainer({ id: 't-2', firstName: 'Sam', lastName: 'Coach' }),
    ];

    const players = [
      player({
        guardians: [{ id: 'g-1', firstName: 'Sam', lastName: 'Coach' }],
      }),
    ];

    const events = [
      event({
        id: 'e-1',
        teams: [
          { id: 'team-1', name: 'A', strength: 2, startTime: '10:00', selectedPlayers: [], trainerId: 't-2' },
          { id: 'team-2', name: 'B', strength: 2, startTime: '11:00', selectedPlayers: [], trainerId: 't-2' },
        ],
      }),
    ];

    const result = selectDuplicateTrainerGuardianGroups(players, trainers, events);

    expect(result).toHaveLength(1);
    expect(result[0].recommendedTrainerId).toBe('t-2');
  });

  it('aggregates guardian usage across multiple players for the same guardian id', () => {
    const trainers = [trainer({ id: 't-1', firstName: 'Lia', lastName: 'Parent' })];
    const players = [
      player({ id: 'p-1', guardians: [{ id: 'g-1', firstName: 'Lia', lastName: 'Parent' }] }),
      player({ id: 'p-2', guardians: [{ id: 'g-1', firstName: 'Lia', lastName: 'Parent' }] }),
    ];

    const result = selectDuplicateTrainerGuardianGroups(players, trainers, []);

    expect(result).toHaveLength(1);
    expect(result[0].guardians[0].playerIds).toEqual(['p-1', 'p-2']);
  });

  it('does not return groups without both trainer and guardian members', () => {
    const trainers = [trainer({ id: 't-1', firstName: 'Only', lastName: 'Trainer' })];
    const players = [
      player({
        guardians: [{ id: 'g-1', firstName: 'Only', lastName: 'Guardian' }],
      }),
    ];

    const result = selectDuplicateTrainerGuardianGroups(players, trainers, []);

    expect(result).toEqual([]);
  });

  it('does not report duplicates when trainer and guardian have the same id', () => {
    const trainers = [trainer({ id: 'm-1', firstName: 'Ari', lastName: 'Keller' })];
    const players = [
      player({
        guardians: [{ id: 'm-1', firstName: 'Ari', lastName: 'Keller', userId: 'm-1' }],
      }),
    ];

    const result = selectDuplicateTrainerGuardianGroups(players, trainers, []);

    expect(result).toEqual([]);
  });
});
