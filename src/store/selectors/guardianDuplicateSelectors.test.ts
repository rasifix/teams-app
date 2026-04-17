import { describe, expect, it } from 'vitest';
import type { Player } from '../../types';
import { selectDuplicateGuardianGroups } from './guardianDuplicateSelectors';

function player(overrides: Partial<Player>): Player {
  return {
    id: 'p-default',
    firstName: 'Player',
    lastName: 'Default',
    birthYear: 2016,
    level: 3,
    status: 'active',
    guardians: [],
    ...overrides,
  };
}

describe('guardian duplicate selectors', () => {
  it('returns empty when no duplicate guardian identity exists', () => {
    const players = [
      player({
        id: 'p-1',
        guardians: [{ id: 'g-1', firstName: 'Ana', lastName: 'Parent', email: 'ana@example.com' }],
      }),
      player({
        id: 'p-2',
        guardians: [{ id: 'g-1', userId: 'g-1', firstName: 'Ana', lastName: 'Parent', email: 'ana@example.com' }],
      }),
    ];

    expect(selectDuplicateGuardianGroups(players)).toEqual([]);
  });

  it('detects duplicates by same name and email across different guardian ids', () => {
    const players = [
      player({
        id: 'p-1',
        guardians: [{ id: 'g-1', firstName: 'Ana', lastName: 'Parent', email: 'ana@example.com' }],
      }),
      player({
        id: 'p-2',
        guardians: [{ id: 'g-2', firstName: 'Ana', lastName: 'Parent', email: 'ana@example.com' }],
      }),
    ];

    const groups = selectDuplicateGuardianGroups(players);

    expect(groups).toHaveLength(1);
    expect(groups[0].guardians.map((entry) => entry.id)).toEqual(['g-1', 'g-2']);
    expect(groups[0].linkedPlayerCount).toBe(2);
  });

  it('prefers linked member entries as merge target recommendation', () => {
    const players = [
      player({
        id: 'p-1',
        guardians: [{ id: 'doc-1', firstName: 'Ana', lastName: 'Parent', email: 'ana@example.com', isDocumentedOnly: true }],
      }),
      player({
        id: 'p-2',
        guardians: [{ id: 'any-id', userId: 'member-1', firstName: 'Ana', lastName: 'Parent', email: 'ana@example.com' }],
      }),
    ];

    const [group] = selectDuplicateGuardianGroups(players);
    expect(group.recommendedGuardianId).toBe('member-1');
  });
});