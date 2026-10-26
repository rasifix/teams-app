import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from './apiClient';
import { cancelActivity, createActivity, restoreActivity, setActivityInvitations, updateActivityInvitation } from './activityService';
import type { ActivityPayload } from '../types';

const activityPayload: ActivityPayload = {
  kind: 'match',
  status: 'active',
  name: 'Match',
  startsAt: '2026-10-23T18:00:00.000Z',
  teams: [],
  invitations: [],
};

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

  it('sets invitations through the dedicated endpoint', async () => {
    const requestSpy = vi.spyOn(apiClient, 'request').mockResolvedValue({ id: 'a1' });
    const invitations = [{ id: 'invite-1', playerId: 'player-1', response: 'open' as const }];

    await setActivityInvitations('squad-1', 'a1', invitations);

    expect(requestSpy).toHaveBeenCalledWith('/api/squads/squad-1/activities/a1/invitations', {
      method: 'PUT',
      body: JSON.stringify({ invitations }),
    });
  });
});

describe('activityService creation', () => {
  afterEach(() => vi.restoreAllMocks());

  it('sends a client-generated idempotency key for activity creation', async () => {
    const requestSpy = vi.spyOn(apiClient, 'request').mockResolvedValue({ id: 'a1' });
    const randomUUID = vi.fn(() => 'generated-key');
    vi.stubGlobal('crypto', { randomUUID });

    await createActivity('squad-1', activityPayload);

    expect(randomUUID).toHaveBeenCalledOnce();
    expect(requestSpy).toHaveBeenCalledWith('/api/squads/squad-1/activities', {
      method: 'POST',
      headers: { 'Idempotency-Key': 'generated-key' },
      body: JSON.stringify(activityPayload),
    });
  });

  it('reuses a supplied idempotency key for retries of the same request', async () => {
    const requestSpy = vi.spyOn(apiClient, 'request').mockResolvedValue({ id: 'a1' });

    await createActivity('squad-1', activityPayload, 'retry-key');

    expect(requestSpy).toHaveBeenCalledWith('/api/squads/squad-1/activities', {
      method: 'POST',
      headers: { 'Idempotency-Key': 'retry-key' },
      body: JSON.stringify(activityPayload),
    });
  });
});
