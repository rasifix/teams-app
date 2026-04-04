import { expect, test } from '@playwright/test';

const DEMO_MODE = (
  globalThis as { process?: { env?: Record<string, string | undefined> } }
).process?.env?.E2E_DEMO_MODE === '1';

test.describe('UC-EV-005 - Assign Shirt Set And Shirts', () => {
  test('blocks selecting shirts already used in another team of the same event', async ({ page }) => {
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
      { id: 'player-1', firstName: 'Liam', lastName: 'Miller', birthYear: 2014, level: 3 },
      { id: 'player-2', firstName: 'Noah', lastName: 'Smith', birthYear: 2014, level: 4 },
      { id: 'player-3', firstName: 'Evan', lastName: 'Clark', birthYear: 2013, level: 2 },
    ];

    const shirtSets = [
      {
        id: 'shirtset-1',
        sponsor: 'Adidas',
        color: '#00a86b',
        shirts: [
          { number: 10, size: 'M', isGoalkeeper: false },
          { number: 11, size: 'M', isGoalkeeper: false },
        ],
      },
    ];

    let event = {
      id: eventId,
      name: 'Saturday Matchday',
      date: '2026-08-22',
      maxPlayersPerTeam: 10,
      minPlayersPerTeam: 6,
      teams: [
        {
          id: 'team-1',
          name: 'Team 1',
          strength: 2,
          startTime: '09:30',
          selectedPlayers: ['player-1', 'player-2'],
        },
        {
          id: 'team-2',
          name: 'Team 2',
          strength: 2,
          startTime: '09:30',
          selectedPlayers: ['player-3'],
          shirtSetId: 'shirtset-1',
          shirtAssignments: [{ playerId: 'player-3', shirtNumber: 10 }],
        },
      ],
      invitations: [
        { id: 'inv-1', playerId: 'player-1', status: 'accepted' },
        { id: 'inv-2', playerId: 'player-2', status: 'accepted' },
        { id: 'inv-3', playerId: 'player-3', status: 'accepted' },
      ],
    };

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
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(groups) });
        return;
      }

      if (pathname === `/api/groups/${groupId}` && method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(groups[0]) });
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
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(shirtSets) });
        return;
      }

      if (pathname === `/api/groups/${groupId}/events` && method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([event]) });
        return;
      }

      if (pathname === `/api/groups/${groupId}/events/${eventId}` && method === 'PUT') {
        updatePayload = JSON.parse(request.postData() ?? '{}') as Record<string, unknown>;

        event = {
          ...event,
          ...updatePayload,
          teams: (updatePayload.teams as typeof event.teams | undefined) ?? event.teams,
        };

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(event),
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

    await expect(page.getByRole('button', { name: '👕 Shirts' }).first()).toBeVisible();
    await page.getByRole('button', { name: '👕 Shirts' }).first().click();
    await pause(500);

    await expect(page.getByRole('heading', { name: 'Assign Shirts to Team' })).toBeVisible();
    await page.locator('#shirtSet').selectOption('shirtset-1');
    await pause(400);

    await expect(page.getByText('Shirts already used in other teams for this event are disabled.')).toBeVisible();

    const liamRow = page.locator('div.flex.items-center.gap-3.p-2.bg-gray-50.rounded').filter({ hasText: 'Liam Miller' });
    const liamSelect = liamRow.locator('select');

    await expect(liamSelect.locator('option[value="10"]')).toBeDisabled();
    await liamSelect.selectOption('11');

    await page.getByRole('button', { name: 'Assign Shirts' }).click();
    await pause(700);

    await expect(page.getByRole('heading', { name: 'Assign Shirts to Team' })).not.toBeVisible();

    expect(updatePayload).not.toBeNull();
    if (!updatePayload) {
      throw new Error('Expected update payload after saving shirt assignments');
    }

    const teams = ((updatePayload as { teams?: Array<Record<string, unknown>> }).teams ?? []);
    const updatedTeam1 = teams.find((team) => team.id === 'team-1');
    expect(updatedTeam1).toBeTruthy();
    expect(updatedTeam1).toMatchObject({
      shirtSetId: 'shirtset-1',
      shirtAssignments: [{ playerId: 'player-1', shirtNumber: 11 }],
    });
  });
});
