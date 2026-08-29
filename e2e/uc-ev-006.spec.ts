import { expect, test } from '@playwright/test';

test.describe('UC-EV-006 - Assign Playing Mode To Event', () => {
  test('sends the selected playing mode id when editing an event', async ({ page }) => {
    const groupId = 'group-1';
    const eventId = 'event-1';
    const selectedPlayingModeId = 'mode-2';
    const group = {
      id: groupId,
      name: 'U12 Tigers',
      periods: [],
      matchPlanningEnabled: true,
      playingModes: [
        { id: 'mode-1', name: '3x20', numberOfPeriods: 3, periodLengthMinutes: 20 },
        { id: selectedPlayingModeId, name: '4x20', numberOfPeriods: 4, periodLengthMinutes: 20 },
      ],
      formations: [],
    };
    const event = {
      id: eventId,
      name: 'Saturday Matchday',
      date: '2026-09-05',
      maxPlayersPerTeam: 9,
      minPlayersPerTeam: 6,
      playingModeId: null,
      teams: [],
      invitations: [],
    };
    let updatePayload: Record<string, unknown> | null = null;

    await page.addInitScript((selectedId) => {
      window.localStorage.setItem('token', 'e2e-token');
      window.localStorage.setItem('selectedGroupId', selectedId);
    }, groupId);

    await page.route('**/health', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'ok' }),
    }));

    await page.route('**/auth/me', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'user-1', email: 'trainer@example.com' }),
    }));

    await page.route('**/api/**', async (route) => {
      const request = route.request();
      const { pathname } = new URL(request.url());
      const method = request.method();

      if (pathname === '/api/groups' && method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([group]) });
        return;
      }
      if (pathname === `/api/groups/${groupId}` && method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(group) });
        return;
      }
      if (pathname === `/api/groups/${groupId}/members` && method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ players: [], trainers: [] }) });
        return;
      }
      if (pathname === `/api/groups/${groupId}/events` && method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([event]) });
        return;
      }
      if (pathname === `/api/groups/${groupId}/events/${eventId}` && method === 'PUT') {
        updatePayload = JSON.parse(request.postData() ?? '{}') as Record<string, unknown>;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...event, ...updatePayload }),
        });
        return;
      }

      await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
    });

    await page.goto(`/events/${eventId}`);
    await page.getByRole('button', { name: 'Edit' }).click();

    const playingModeSelect = page.getByLabel('Playing mode');
    await expect(playingModeSelect).toBeVisible();
    await playingModeSelect.selectOption(selectedPlayingModeId);
    await expect(playingModeSelect).toHaveValue(selectedPlayingModeId);

    await page.getByRole('button', { name: 'Save' }).click();
    await expect.poll(() => updatePayload).not.toBeNull();
    expect(updatePayload).toMatchObject({ playingModeId: selectedPlayingModeId });
  });
});
