import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from './apiClient';
import { createSpondReadClient } from './spondService';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Spond proxy client', () => {
  it('loads groups and snapshots exclusively through backend proxy endpoints', async () => {
    const request = vi.spyOn(apiClient, 'request')
      .mockResolvedValueOnce([{ id: 'group-1', name: 'U12' }])
      .mockResolvedValueOnce({
        group: { id: 'group-1', name: 'U12', members: [] },
        events: [],
        sourceReadAt: '2026-10-10T12:00:00.000Z',
      });
    const client = createSpondReadClient();

    await client.login('coach@example.com', 'password');
    expect(await client.getGroups()).toEqual([{ id: 'group-1', name: 'U12', members: [] }]);
    await client.getSnapshot('group-1', '2026-01-01T00:00:00.000Z', '2027-01-01T00:00:00.000Z');

    expect(request).toHaveBeenNthCalledWith(1, '/api/integrations/spond/groups', {
      method: 'POST',
      body: JSON.stringify({ email: 'coach@example.com', password: 'password' }),
    });
    expect(request).toHaveBeenNthCalledWith(2, '/api/integrations/spond/snapshot', {
      method: 'POST',
      body: JSON.stringify({
        email: 'coach@example.com',
        password: 'password',
        groupId: 'group-1',
        from: '2026-01-01T00:00:00.000Z',
        to: '2027-01-01T00:00:00.000Z',
      }),
    });
    expect(request.mock.calls.every(([endpoint]) => String(endpoint).startsWith('/api/'))).toBe(true);
  });

  it('clears credentials and cached groups when disposed', async () => {
    vi.spyOn(apiClient, 'request').mockResolvedValue([{ id: 'group-1', name: 'U12' }]);
    const client = createSpondReadClient();
    await client.login('coach@example.com', 'password');

    client.dispose();

    await expect(client.getGroups()).rejects.toThrow('SPOND_AUTH_REQUIRED');
    await expect(client.getSnapshot('group-1', 'from', 'to')).rejects.toThrow('SPOND_AUTH_REQUIRED');
  });

  it('passes selected Spond subgroup IDs when loading a snapshot', async () => {
    const request = vi.spyOn(apiClient, 'request')
      .mockResolvedValueOnce([{ id: 'group-1', name: 'U12', subGroups: [{ id: 'sub-1', name: 'Team orange' }] }])
      .mockResolvedValueOnce({
        group: { id: 'group-1', name: 'U12', subGroups: [{ id: 'sub-1', name: 'Team orange' }], members: [] },
        events: [],
        sourceReadAt: '2026-10-10T12:00:00.000Z',
      });
    const client = createSpondReadClient();

    await client.login('coach@example.com', 'password');
    await client.getSnapshot('group-1', 'from', 'to', 'sub-1');

    expect(request).toHaveBeenNthCalledWith(2, '/api/integrations/spond/snapshot', {
      method: 'POST',
      body: JSON.stringify({
        email: 'coach@example.com',
        password: 'password',
        groupId: 'group-1',
        subGroupId: 'sub-1',
        from: 'from',
        to: 'to',
      }),
    });
  });

  it('normalizes Spond UTC instants to the activity wall-clock convention', async () => {
    vi.spyOn(apiClient, 'request')
      .mockResolvedValueOnce([{ id: 'group-1', name: 'U12' }])
      .mockResolvedValueOnce({
        group: { id: 'group-1', name: 'U12', members: [] },
        events: [{
          id: 'event-1', groupId: 'group-1', name: 'Training',
          startsAt: '2026-07-10T16:30:00.000Z', endsAt: '2026-07-10T18:00:00.000Z', responses: [],
        }],
        sourceReadAt: '2026-07-01T12:00:00.000Z',
      });
    const client = createSpondReadClient();
    await client.login('coach@example.com', 'password');

    const snapshot = await client.getSnapshot('group-1', 'from', 'to');

    expect(snapshot.events[0]).toMatchObject({
      startsAt: '2026-07-10T18:30:00.000Z',
      endsAt: '2026-07-10T20:00:00.000Z',
    });
  });
});
