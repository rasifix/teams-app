import { expect, test } from '@playwright/test';

const DEMO_MODE = (
  globalThis as { process?: { env?: Record<string, string | undefined> } }
).process?.env?.E2E_DEMO_MODE === '1';

test.describe('UC-GR-001 - Create New Group', () => {
  test('successfully creates a group from the Home page modal', async ({ page }) => {
    const pause = async (ms = 700) => {
      if (DEMO_MODE) {
        await page.waitForTimeout(ms);
      }
    };

    const groupsById: Record<string, { id: string; name: string; club?: string; description?: string; periods: Array<{ id: string; name: string; startDate: string; endDate: string }> }> = {
      '1': {
        id: '1',
        name: 'Default Group',
        periods: [],
      },
    };

    let createPayload: Record<string, unknown> | null = null;

    await page.addInitScript(() => {
      window.localStorage.setItem('token', 'e2e-token');
    });

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
          email: 'coach@example.com',
          firstName: 'Coach',
          lastName: 'Tester',
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
          body: JSON.stringify(Object.values(groupsById)),
        });
        return;
      }

      if (pathname === '/api/groups' && method === 'POST') {
        const bodyText = request.postData() ?? '{}';
        createPayload = JSON.parse(bodyText) as Record<string, unknown>;

        const newGroup = {
          id: 'group-99',
          name: String(createPayload.name ?? ''),
          club: createPayload.club ? String(createPayload.club) : undefined,
          description: createPayload.description ? String(createPayload.description) : undefined,
          periods: [],
        };
        groupsById[newGroup.id] = newGroup;

        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(newGroup),
        });
        return;
      }

      const groupMatch = pathname.match(/^\/api\/groups\/([^/]+)$/);
      if (groupMatch && method === 'GET') {
        const groupId = groupMatch[1];
        const group = groupsById[groupId];

        if (!group) {
          await route.fulfill({
            status: 404,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'Group not found' }),
          });
          return;
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(group),
        });
        return;
      }

      if (/^\/api\/groups\/[^/]+\/members$/.test(pathname) && method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ players: [], trainers: [] }),
        });
        return;
      }

      if (/^\/api\/groups\/[^/]+\/events$/.test(pathname) && method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
        return;
      }

      if (/^\/api\/groups\/[^/]+\/shirtsets$/.test(pathname) && method === 'GET') {
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

    await page.goto('/');
    await pause(1200);

    await expect(page.getByRole('button', { name: 'Create a new group' })).toBeVisible();
    await pause();
    await page.getByRole('button', { name: 'Create a new group' }).click();
    await pause(900);

    await expect(page.getByRole('heading', { name: 'Create New Group' })).toBeVisible();
    await page.getByLabel('Group Name').fill('U12 New Squad');
    await pause();
    await page.getByLabel('Club (optional)').fill('SC Test Club');
    await pause();
    await page.getByLabel('Description (optional)').fill('Saturday team for spring season');
    await pause();

    await page.getByRole('button', { name: 'Create Group' }).click();
    await pause(1400);

    await expect(page.getByRole('heading', { name: 'Create New Group' })).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'U12 New Squad' })).toBeVisible();
    await pause(1600);

    expect(createPayload).toMatchObject({
      name: 'U12 New Squad',
      club: 'SC Test Club',
      description: 'Saturday team for spring season',
    });
  });
});
