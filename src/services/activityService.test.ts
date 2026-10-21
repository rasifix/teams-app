import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from './apiClient';
import { cancelActivity, restoreActivity, updateActivityInvitation } from './activityService';

describe('activityService lifecycle', () => {
  afterEach(() => vi.restoreAllMocks());

  it('cancels an activity through the activity lifecycle endpoint', async () => {
    const requestSpy = vi.spyOn(apiClient, 'request').mockResolvedValue({ id: 'a1', status: 'cancelled' });

    await cancelActivity('squad-1', 'a1');

    expect(requestSpy).toHaveBeenCalledWith('/api/squads/squad-1/activities/a1/status', {
      method: 'PUT',
      body: JSON.stringify({ status: 'cancelled' }),
    });
  });

  it('restores an activity through the activity lifecycle endpoint', async () => {
    const requestSpy = vi.spyOn(apiClient, 'request').mockResolvedValue({ id: 'a1', status: 'active' });

    await restoreActivity('squad-1', 'a1');

    expect(requestSpy).toHaveBeenCalledWith('/api/squads/squad-1/activities/a1/status', {
      method: 'PUT',
      body: JSON.stringify({ status: 'active' }),
    });
  });

  it('persists a local decline reason without changing the invitation response', async () => {
    const requestSpy = vi.spyOn(apiClient, 'request').mockResolvedValue({ id: 'a1' });

    await updateActivityInvitation('squad-1', 'a1', 'player-1', {
      response: 'declined',
      declineReason: 'injured',
    });

    expect(requestSpy).toHaveBeenCalledWith('/api/squads/squad-1/activities/a1/invitations/player-1', {
      method: 'PUT',
      body: JSON.stringify({ response: 'declined', declineReason: 'injured' }),
    });
  });
});
