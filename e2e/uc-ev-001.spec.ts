import { expect, test } from '@playwright/test';

const DEMO_MODE = (
  globalThis as { process?: { env?: Record<string, string | undefined> } }
).process?.env?.E2E_DEMO_MODE === '1';

test.describe('UC-EV-001 - Create Event', () => {
  test('successfully creates an event from the Events page modal', async ({ page }) => {
    const pause = async (ms = 700) => {
      if (DEMO_MODE) {
        await page.waitForTimeout(ms);
      }
    };

    const groupId = 'group-1';
    const groups = [
      {
        id: groupId,
        name: 'U12 Tigers',
        periods: [],
      },
    ];

    type EventPayload = {
      name: string;
      date: string;
      maxPlayersPerTeam: number;
      minPlayersPerTeam: number;
      location?: string;
      teams: Array<{
        id: string;
        name: string;
        strength: number;
        startTime: string;
        selectedPlayers: string[];
      }>;
      invitations: Array<unknown>;
    };

    let createPayload: EventPayload | null = null;

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
          body: JSON.stringify({ players: [], trainers: [] }),
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
          body: JSON.stringify([]),
        });
        return;
      }

      if (pathname === `/api/groups/${groupId}/events` && method === 'POST') {
        createPayload = JSON.parse(request.postData() ?? '{}') as EventPayload;

        const createdEvent = {
          id: 'event-1',
          ...createPayload,
        };

        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(createdEvent),
        });
        return;
      }

      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ message: `Unhandled route: ${method} ${pathname}` }),
      });
    });

    await page.goto('/events');
    await pause(1200);

    await expect(page.getByRole('heading', { name: 'Future Events (0)' })).toBeVisible();
    await expect(page.getByText('No events created yet. Click "Create Event" to get started.')).toBeVisible();

    await page.getByRole('button', { name: 'Add' }).click();
    await pause(800);

    await expect(page.getByRole('heading', { name: 'Create New Event' })).toBeVisible();

    await page.getByLabel('Event Name *').fill('Saturday Training Matchday');
    await page.getByLabel('Date *').fill('2026-08-22');
    await page.getByLabel('Start Time *').fill('09:30');
    await page.getByLabel('Location').fill('Main Field');
    await page.getByLabel('Number of Teams *').fill('2');
    await page.getByLabel('Max Players per Team *').fill('10');
    await page.getByLabel('Min Players per Team *').fill('7');
    await pause(700);

    await page.getByRole('button', { name: 'Create Event' }).click();
    await pause(1000);

    await expect(page.getByRole('heading', { name: 'Create New Event' })).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'Future Events (1)' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Saturday Training Matchday' })).toBeVisible();

    expect(createPayload).not.toBeNull();
    expect(createPayload).toMatchObject({
      name: 'Saturday Training Matchday',
      date: '2026-08-22',
      maxPlayersPerTeam: 10,
      minPlayersPerTeam: 7,
      location: 'Main Field',
      invitations: [],
      teams: [
        {
          name: 'Team 1',
          strength: 2,
          startTime: '09:30',
          selectedPlayers: [],
        },
        {
          name: 'Team 2',
          strength: 2,
          startTime: '09:30',
          selectedPlayers: [],
        },
      ],
    });

    expect(createPayload?.teams).toHaveLength(2);
    for (const team of createPayload?.teams ?? []) {
      expect(team.id).toBeTruthy();
    }
  });
});
