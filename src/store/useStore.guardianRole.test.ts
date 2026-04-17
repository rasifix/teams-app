import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GroupMember } from './selectors/memberSelectors';
import { mergeMembersFromCollections } from './selectors/memberSelectors';
import type { Player, Trainer } from '../types';

const memberServiceMocks = vi.hoisted(() => ({
  getAllMembers: vi.fn(),
  getMemberById: vi.fn(),
  addMember: vi.fn(),
  updateMember: vi.fn(),
  deleteMember: vi.fn(),
  revokeMemberRole: vi.fn(),
  addGuardianToPlayer: vi.fn(),
  deleteGuardianFromPlayer: vi.fn(),
}));

vi.mock('../services/memberService', () => ({
  ...memberServiceMocks,
  MEMBER_ROLE_PLAYER: 'player',
  MEMBER_ROLE_TRAINER: 'trainer',
  MEMBER_ROLE_GUARDIAN: 'guardian',
}));

import { useStore } from './useStore';

function createPlayer(overrides: Partial<Player>): Player {
  return {
    id: 'p-1',
    firstName: 'Lina',
    lastName: 'Player',
    birthYear: 2016,
    level: 2,
    status: 'active',
    guardians: [],
    roles: ['player'],
    ...overrides,
  };
}

function createTrainer(overrides: Partial<Trainer>): Trainer {
  return {
    id: 't-1',
    firstName: 'Tom',
    lastName: 'Trainer',
    email: 'tom@example.com',
    roles: ['trainer'],
    ...overrides,
  };
}

describe('useStore addGuardianToPlayer role sync', () => {
  const baseState = useStore.getState();

  beforeEach(() => {
    vi.clearAllMocks();
    useStore.setState(baseState, true);
  });

  it('adds guardian role to an existing trainer before linking as guardian', async () => {
    const player = createPlayer({ id: 'p-1' });
    const trainer = createTrainer({ id: 't-1', roles: ['trainer'] });

    useStore.setState({
      group: {
        id: 'group-1',
        name: 'Group 1',
        periods: [],
        members: [
          { id: 'p-1', roles: ['player'] },
          { id: 't-1', email: 'tom@example.com', roles: ['trainer'] },
        ],
      },
      members: mergeMembersFromCollections([player], [trainer]),
    });

    memberServiceMocks.getMemberById.mockResolvedValue({
      ...trainer,
      roles: ['trainer'],
    });

    memberServiceMocks.updateMember.mockResolvedValue({
      ...trainer,
      roles: ['trainer', 'guardian'],
    });

    memberServiceMocks.addGuardianToPlayer.mockResolvedValue({
      ...player,
      guardians: [
        {
          id: 't-1',
          userId: 't-1',
          firstName: 'Tom',
          lastName: 'Trainer',
          email: 'tom@example.com',
        },
      ],
    });

    const success = await useStore.getState().addGuardianToPlayer('p-1', { guardianId: 't-1' });

    expect(success).toBe(true);
    expect(memberServiceMocks.updateMember).toHaveBeenCalledWith(
      'group-1',
      't-1',
      expect.objectContaining({
        roles: expect.arrayContaining(['trainer', 'guardian']),
      })
    );
    expect(memberServiceMocks.addGuardianToPlayer).toHaveBeenCalledWith('group-1', 'p-1', { guardianId: 't-1' });

    const updatedTrainer = (useStore.getState().members as GroupMember[]).find((member) => member.id === 't-1') as Trainer;
    expect(updatedTrainer.roles).toEqual(expect.arrayContaining(['trainer', 'guardian']));
  });

  it('merges duplicate guardians by moving player references to target guardian', async () => {
    const playerOne = createPlayer({
      id: 'p-1',
      guardians: [
        {
          id: 'g-source',
          firstName: 'Ana',
          lastName: 'Parent',
          email: 'ana@example.com',
        },
      ],
    });

    const playerTwo = createPlayer({
      id: 'p-2',
      firstName: 'Mia',
      guardians: [
        {
          id: 'g-target',
          userId: 'g-target',
          firstName: 'Ana',
          lastName: 'Parent',
          email: 'ana@example.com',
        },
      ],
    });

    useStore.setState({
      group: {
        id: 'group-1',
        name: 'Group 1',
        periods: [],
        members: [
          { id: 'p-1', roles: ['player'] },
          { id: 'p-2', roles: ['player'] },
          { id: 'g-target', email: 'ana@example.com', roles: ['guardian'] },
        ],
      },
      members: mergeMembersFromCollections([playerOne, playerTwo], [createTrainer({ id: 'g-target', roles: ['guardian'] })]),
    });

    memberServiceMocks.getMemberById.mockResolvedValue({
      id: 'g-target',
      firstName: 'Ana',
      lastName: 'Parent',
      email: 'ana@example.com',
      roles: ['guardian'],
    });

    memberServiceMocks.addGuardianToPlayer.mockResolvedValue({
      ...playerOne,
      guardians: [
        {
          id: 'g-source',
          firstName: 'Ana',
          lastName: 'Parent',
          email: 'ana@example.com',
        },
        {
          id: 'g-target',
          userId: 'g-target',
          firstName: 'Ana',
          lastName: 'Parent',
          email: 'ana@example.com',
        },
      ],
    });

    memberServiceMocks.deleteGuardianFromPlayer.mockResolvedValue({
      ...playerOne,
      guardians: [
        {
          id: 'g-target',
          userId: 'g-target',
          firstName: 'Ana',
          lastName: 'Parent',
          email: 'ana@example.com',
        },
      ],
    });

    const success = await useStore.getState().mergeGuardianDuplicates('g-source', 'g-target');

    expect(success).toBe(true);
    expect(memberServiceMocks.addGuardianToPlayer).toHaveBeenCalledWith('group-1', 'p-1', { guardianId: 'g-target' });
    expect(memberServiceMocks.deleteGuardianFromPlayer).toHaveBeenCalledWith('group-1', 'p-1', 'g-source');

    const updatedPlayerOne = useStore.getState().getPlayerById('p-1');
    expect(updatedPlayerOne?.guardians?.some((guardian) => guardian.id === 'g-source' || guardian.userId === 'g-source')).toBe(false);
    expect(updatedPlayerOne?.guardians?.some((guardian) => guardian.id === 'g-target' || guardian.userId === 'g-target')).toBe(true);
  });
});
