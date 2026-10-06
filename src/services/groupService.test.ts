import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from './apiClient';
import { updateGroupCategory } from './groupService';

describe('groupService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('includes the current group name when updating the category', async () => {
    const requestSpy = vi.spyOn(apiClient, 'request').mockResolvedValue({
      id: 'group-1',
      name: 'Juniors',
      category: 'D7',
      periods: [],
    });

    await updateGroupCategory('group-1', 'Juniors', 'D7');

    expect(requestSpy).toHaveBeenCalledWith('/api/groups/group-1', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Juniors', category: 'D7' }),
    });
  });

  it('includes the current group name when clearing the category', async () => {
    const requestSpy = vi.spyOn(apiClient, 'request').mockResolvedValue({
      id: 'group-1',
      name: 'Juniors',
      category: null,
      periods: [],
    });

    await updateGroupCategory('group-1', 'Juniors', null);

    const [, options] = requestSpy.mock.calls[0] as [string, { body?: string }?];
    expect(JSON.parse(options?.body ?? '{}')).toEqual({ name: 'Juniors', category: null });
  });
});
