import { expect, test } from '@playwright/test';

const DEMO_MODE = (
  globalThis as { process?: { env?: Record<string, string | undefined> } }
).process?.env?.E2E_DEMO_MODE === '1';

test.describe('UC-GR-003 - Manage Players', () => {
  test('deletes a player from detail view and returns to the members overview', async ({ page }) => {
    const pause = async (ms = 700) => {
      if (DEMO_MODE) {
        await page.waitForTimeout(ms);
      }
    };

    const groupId = 'group-1';
    const groups = [{ id: groupId, name: 'U12 Tigers', periods: [] }];

    const membersState = {
      players: [
        {
          id: 'player-1',
          firstName: 'Nina',
          lastName: 'Player',
          birthYear: 2015,
          birthDate: '2015-04-10',
          level: 4,
          status: 'inactive',
          roles: ['player'],
          guardians: [],
        },
      ],
      trainers: [] as Array<Record<string, unknown>>,
    };

    let eventsState = [
      {
        id: 'event-1',
        name: 'Summer Match',
        date: '2026-07-01',
        maxPlayersPerTeam: 12,
        minPlayersPerTeam: 8,
        teams: [],
        invitations: [
          {
            id: 'inv-1',
            playerId: 'player-1',
            status: 'open',
          },
        ],
      },
    ];

    let updatedEventPayload: Record<string, unknown> | null = null;
    let deleteMemberCalls = 0;

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
          email: 'manager@example.com',
          firstName: 'Mona',
          lastName: 'Manager',
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
          body: JSON.stringify(membersState),
        });
        return;
      }

      if (pathname === `/api/groups/${groupId}/members/player-1` && method === 'GET') {
        const player = membersState.players.find((entry) => entry.id === 'player-1');
        if (!player) {
          await route.fulfill({
            status: 404,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'Player not found' }),
          });
          return;
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(player),
        });
        return;
      }

      if (pathname === `/api/groups/${groupId}/members/player-1` && method === 'DELETE') {
        deleteMemberCalls += 1;
        membersState.players = membersState.players.filter((player) => player.id !== 'player-1');

        await route.fulfill({
          status: 204,
          body: '',
        });
        return;
      }

      if (pathname === `/api/groups/${groupId}/events` && method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(eventsState),
        });
        return;
      }

      if (pathname === `/api/groups/${groupId}/events/event-1` && method === 'PUT') {
        updatedEventPayload = JSON.parse(request.postData() ?? '{}') as Record<string, unknown>;
        eventsState = eventsState.map((event) => (
          event.id === 'event-1'
            ? {
                ...event,
                ...updatedEventPayload,
              }
            : event
        ));

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(eventsState[0]),
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

      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ message: `Unhandled route: ${method} ${pathname}` }),
      });
    });

    await page.goto('/players/player-1');
    await pause(900);

    await expect(page).toHaveURL(/\/players\/player-1$/);
    await expect(page.getByText('Nina Player')).toBeVisible();

    await page.getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByRole('heading', { name: 'Delete Player' })).toBeVisible();

    await page.getByRole('button', { name: 'Confirm' }).click();

    await expect(page).toHaveURL(/\/members\/players$/);
    await expect(page.getByRole('heading', { name: 'All Players (0 of 0)' })).toBeVisible();
    await expect(page.getByText('Nina Player')).toHaveCount(0);

    expect(updatedEventPayload).toEqual({ invitations: [] });
    expect(deleteMemberCalls).toBe(1);
  });
});