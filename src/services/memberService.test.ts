import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from './apiClient';
import { getAllMembers, getTrainers } from './memberService';

describe('memberService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads trainers from the full members endpoint and filters flat member payloads', async () => {
    const requestSpy = vi.spyOn(apiClient, 'request').mockResolvedValue([
      {
        id: 'player-1',
        firstName: 'Pat',
        lastName: 'Player',
        birthYear: 2014,
        level: 3,
        status: 'active',
        roles: ['player'],
      },
      {
        id: 'trainer-1',
        firstName: 'Terry',
        lastName: 'Trainer',
        email: 'trainer@example.com',
        roles: ['trainer'],
      },
      {
        id: 'admin-1',
        firstName: 'Alex',
        lastName: 'Admin',
        email: 'admin@example.com',
        roles: ['admin'],
      },
    ]);

    const trainers = await getTrainers('group-1');

    expect(requestSpy).toHaveBeenCalledWith('/api/groups/group-1/members');
    expect(trainers).toEqual([
      {
        id: 'trainer-1',
        firstName: 'Terry',
        lastName: 'Trainer',
        email: 'trainer@example.com',
        roles: ['trainer'],
      },
    ]);
  });

  it('normalizes grouped members payloads', async () => {
    vi.spyOn(apiClient, 'request').mockResolvedValue({
      players: [
        {
          id: 'player-1',
          firstName: 'Pat',
          lastName: 'Player',
          birthYear: 2014,
          level: 3,
        },
      ],
      trainers: [
        {
          id: 'trainer-1',
          firstName: 'Terry',
          lastName: 'Trainer',
          email: 'trainer@example.com',
        },
      ],
    });

    const members = await getAllMembers('group-1');

    expect(members).toEqual({
      players: [
        {
          id: 'player-1',
          firstName: 'Pat',
          lastName: 'Player',
          birthYear: 2014,
          level: 3,
          status: 'active',
          roles: [],
        },
      ],
      trainers: [
        {
          id: 'trainer-1',
          firstName: 'Terry',
          lastName: 'Trainer',
          email: 'trainer@example.com',
          roles: [],
        },
      ],
    });
  });

  it('keeps legacy trainer entries without roles when the backend returns a flat list', async () => {
    vi.spyOn(apiClient, 'request').mockResolvedValue([
      {
        id: 'trainer-1',
        firstName: 'Terry',
        lastName: 'Trainer',
        email: 'trainer@example.com',
      },
    ]);

    const trainers = await getTrainers('group-1');

    expect(trainers).toEqual([
      {
        id: 'trainer-1',
        firstName: 'Terry',
        lastName: 'Trainer',
        email: 'trainer@example.com',
        roles: [],
      },
    ]);
  });

});