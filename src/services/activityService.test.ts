import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from './apiClient';
import { cancelActivity, createActivity, restoreActivity, updateActivityInvitation } from './activityService';
import { rememberActivityRevision } from './activityIntentService';
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
    rememberActivityRevision('squad-1', 'a1', '"activity-revision-4"');
    const requestSpy = vi.spyOn(apiClient, 'requestWithMetadata').mockResolvedValue({ data: { id: 'a1', status: 'cancelled' } as never, headers: new Headers({ ETag: '"activity-revision-5"' }) });

    await cancelActivity('squad-1', 'a1');

    expect(requestSpy).toHaveBeenCalledWith('/api/squads/squad-1/activities/a1/status', expect.objectContaining({
      method: 'PUT',
      headers: expect.objectContaining({ 'If-Match': '"activity-revision-4"' }),
      body: JSON.stringify({ status: 'cancelled' }),
    }));
  });

  it('restores an activity through the activity lifecycle endpoint', async () => {
    rememberActivityRevision('squad-1', 'a1', '"activity-revision-8"');
    const requestSpy = vi.spyOn(apiClient, 'requestWithMetadata').mockResolvedValue({ data: { id: 'a1', status: 'active' } as never, headers: new Headers({ ETag: '"activity-revision-9"' }) });

    await restoreActivity('squad-1', 'a1');

    expect(requestSpy).toHaveBeenCalledWith('/api/squads/squad-1/activities/a1/status', expect.objectContaining({
      method: 'PUT',
      headers: expect.objectContaining({ 'If-Match': '"activity-revision-8"' }),
      body: JSON.stringify({ status: 'active' }),
    }));
  });

  it('persists a local decline reason without changing the invitation response', async () => {
    rememberActivityRevision('squad-1', 'a1', '"activity-revision-2"');
    const requestSpy = vi.spyOn(apiClient, 'requestWithMetadata').mockResolvedValue({ data: { id: 'a1' } as never, headers: new Headers({ ETag: '"activity-revision-3"' }) });

    await updateActivityInvitation('squad-1', 'a1', 'player-1', {
      response: 'declined',
      declineReason: 'injured',
    });

    expect(requestSpy).toHaveBeenCalledWith('/api/squads/squad-1/activities/a1/invitations/player-1', expect.objectContaining({
      method: 'PUT',
      headers: expect.objectContaining({ 'If-Match': '"activity-revision-2"' }),
      body: JSON.stringify({ response: 'declined', declineReason: 'injured' }),
    }));
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
