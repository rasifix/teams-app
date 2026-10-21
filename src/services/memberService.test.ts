import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from './apiClient';
import { addMember, getAllMembers, updateMember, getTrainers } from './memberService';

describe('memberService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads trainers from the grouped members endpoint', async () => {
    const requestSpy = vi.spyOn(apiClient, 'request').mockResolvedValue({
      players: [],
      trainers: [
        {
          id: 'trainer-1',
          firstName: 'Terry',
          lastName: 'Trainer',
          email: 'trainer@example.com',
          roles: ['trainer'],
        },
      ],
    });

    const trainers = await getTrainers('squad-1');

    expect(requestSpy).toHaveBeenCalledWith('/api/squads/squad-1/members');
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
          birthDate: '2014-06-15',
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

    const members = await getAllMembers('squad-1');

    expect(members).toEqual({
      players: [
        {
          id: 'player-1',
          firstName: 'Pat',
          lastName: 'Player',
          birthDate: '2014-06-15',
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

  it('omits preferredShirtNumber when null in add member payload', async () => {
    const requestSpy = vi.spyOn(apiClient, 'request').mockResolvedValue({
      id: 'player-1',
      firstName: 'Pat',
      lastName: 'Player',
      roles: ['player'],
      level: 3,
      birthDate: '2014-06-15',
      status: 'active',
    });

    await addMember('squad-1', {
      firstName: 'Pat',
      lastName: 'Player',
      roles: ['player'],
      preferredShirtNumber: null as unknown as number,
    });

    const [, options] = requestSpy.mock.calls[0] as [string, { body?: string }?];
    expect(options?.body).toBeDefined();
    expect(JSON.parse(options?.body || '{}')).not.toHaveProperty('preferredShirtNumber');
  });

  it('omits preferredShirtNumber when non-integer in update member payload', async () => {
    const requestSpy = vi.spyOn(apiClient, 'request').mockResolvedValue({
      id: 'player-1',
      firstName: 'Pat',
      lastName: 'Player',
      roles: ['player'],
      level: 3,
      birthDate: '2014-06-15',
      status: 'active',
    });

    await updateMember('squad-1', 'player-1', {
      preferredShirtNumber: 10.5,
    });

    const [, options] = requestSpy.mock.calls[0] as [string, { body?: string }?];
    expect(options?.body).toBeDefined();
    expect(JSON.parse(options?.body || '{}')).not.toHaveProperty('preferredShirtNumber');
  });

});
