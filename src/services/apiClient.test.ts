import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from './apiClient';

const validToken = 'header.eyJleHAiOjQwMDAwMDAwMDB9.signature';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Spond proxy errors', () => {
  it('keeps the app session when Spond credentials are rejected', async () => {
    const removeItem = vi.fn();
    const assign = vi.fn();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => validToken),
      removeItem,
    });
    vi.stubGlobal('window', { location: { pathname: '/spond-import', assign } });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ error: 'SPOND_AUTH_FAILED' }),
      { status: 401, statusText: 'Unauthorized', headers: { 'content-type': 'application/json' } },
    )));

    await expect(apiClient.request('/api/integrations/spond/groups', { method: 'POST' }))
      .rejects.toThrow('SPOND_AUTH_FAILED');

    expect(removeItem).not.toHaveBeenCalled();
    expect(assign).not.toHaveBeenCalled();
  });

  it('still redirects when a non-Spond protected endpoint returns 401', async () => {
    const removeItem = vi.fn();
    const assign = vi.fn();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => validToken),
      removeItem,
    });
    vi.stubGlobal('window', { location: { pathname: '/activities', assign } });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, {
      status: 401,
      statusText: 'Unauthorized',
    })));

    await expect(apiClient.request('/api/squads/squad-1/activities'))
      .rejects.toThrow('API Error: 401 - Unauthorized');

    expect(removeItem).toHaveBeenCalledWith('token');
    expect(assign).toHaveBeenCalledWith('/login?reason=logged-out');
  });
});
