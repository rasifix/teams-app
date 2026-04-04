import { expect, test } from '@playwright/test';

const DEMO_MODE = (
  globalThis as { process?: { env?: Record<string, string | undefined> } }
).process?.env?.E2E_DEMO_MODE === '1';

test.describe('UC-EV-002 - Invite Players', () => {
  test('successfully invites players to an event from the invite modal', async ({ page }) => {
    const pause = async (ms = 700) => {
      if (DEMO_MODE) {
        await page.waitForTimeout(ms);
      }
    };

    const groupId = 'group-1';
    const eventId = 'event-1';

    const groups = [
      {
        id: groupId,
        name: 'U12 Tigers',
        periods: [],
      },
    ];

    const players = [
      {
        id: 'player-1',
        firstName: 'Liam',
        lastName: 'Miller',
        birthYear: 2014,
        level: 3,
      },
      {
        id: 'player-2',
        firstName: 'Noah',
        lastName: 'Smith',
        birthYear: 2013,
        level: 4,
      },
    ];

    const event = {
      id: eventId,
      name: 'Saturday Matchday',
      date: '2026-08-22',
      maxPlayersPerTeam: 10,
      minPlayersPerTeam: 7,
      teams: [
        {
          id: 'team-1',
          name: 'Team 1',
          strength: 2,
          startTime: '09:30',
          selectedPlayers: [],
        },
      ],
      invitations: [],
    };

    type Invitation = { id: string; playerId: string; status: string };
    let updatePayload: Record<string, unknown> | null = null;

    await page.addInitScript((selectedId) => {
      window.localStorage.setItem('token', 'e2e-token');
      window.localStorage.setItem('selectedGroupId', selectedId);
    }, groupId);

    await page.route('**/health', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'ok' }),
      });
    });

    await page.route('**/auth/me', async (route) => {
      if (route.request().method() !== 'GET') {
        await route.continue();
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'user-1',
          email: 'trainer@example.com',
          firstName: 'Taylor',
          lastName: 'Trainer',
        }),
      });
    });

    await page.route('**/api/**', async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const { pathname } = url;
      const method = request.method();

      if (pathname === '/api/groups' && method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(groups),
        });
        return;
      }

      if (pathname === `/api/groups/${groupId}` && method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(groups[0]),
        });
        return;
      }

      if (pathname === `/api/groups/${groupId}/members` && method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ players, trainers: [] }),
        });
        return;
      }

      if (pathname === `/api/groups/${groupId}/shirtsets` && method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
        return;
      }

      if (pathname === `/api/groups/${groupId}/events` && method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([event]),
        });
        return;
      }

      if (pathname === `/api/groups/${groupId}/events/${eventId}` && method === 'PUT') {
        updatePayload = JSON.parse(request.postData() ?? '{}') as Record<string, unknown>;

        const merged = {
          ...event,
          ...updatePayload,
        };

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(merged),
        });
        return;
      }

      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ message: `Unhandled route: ${method} ${pathname}` }),
      });
    });

    await page.goto(`/events/${eventId}`);
    await pause(1200);

    await expect(page.getByRole('button', { name: 'Invite' })).toBeVisible();
    await expect(page.getByText('No invitations sent yet.')).toBeVisible();

    await page.getByRole('button', { name: 'Invite' }).click();
    await pause(600);

    await expect(page.getByRole('heading', { name: 'Invite Players' })).toBeVisible();
    await page.getByRole('radio', { name: 'Open' }).check();
    await page.getByRole('button', { name: 'Select All', exact: true }).click();
    await expect(page.getByText('2 selected')).toBeVisible();

    await page.getByRole('button', { name: 'Invite (2)' }).click();
    await pause(800);

    await expect(page.getByRole('heading', { name: 'Invite Players' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Open (2)' })).toBeVisible();

    expect(updatePayload).not.toBeNull();
    const invitations = ((updatePayload as { invitations?: Invitation[] }).invitations ?? []);
    expect(invitations).toHaveLength(2);

    const playerIds = invitations.map((inv) => inv.playerId).sort();
    expect(playerIds).toEqual(['player-1', 'player-2']);

    for (const invitation of invitations) {
      expect(invitation.id).toBeTruthy();
      expect(invitation.status).toBe('open');
    }
  });
});
