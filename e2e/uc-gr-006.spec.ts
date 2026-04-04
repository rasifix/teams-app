import { expect, test } from '@playwright/test';

const DEMO_MODE = (
  globalThis as { process?: { env?: Record<string, string | undefined> } }
).process?.env?.E2E_DEMO_MODE === '1';

test.describe('UC-GR-006 - Manage Shirt Sets', () => {
  test('successfully creates a shirt set with automatic shirt generation', async ({ page }) => {
    const pause = async (ms = 700) => {
      if (DEMO_MODE) {
        await page.waitForTimeout(ms);
      }
    };

    const groupId = 'group-1';
    const groups = [{ id: groupId, name: 'U12 Tigers', periods: [] }];
    const shirtSets: Array<Record<string, unknown>> = [];

    let createPayload: Record<string, unknown> | null = null;

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
          body: JSON.stringify({ players: [], trainers: [] }),
        });
        return;
      }

      if (pathname === `/api/groups/${groupId}/events` && method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
        return;
      }

      if (pathname === `/api/groups/${groupId}/shirtsets` && method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(shirtSets) });
        return;
      }

      if (pathname === `/api/groups/${groupId}/shirtsets` && method === 'POST') {
        createPayload = JSON.parse(request.postData() ?? '{}') as Record<string, unknown>;

        const newSet = {
          id: 'shirtset-1',
          sponsor: String(createPayload.sponsor ?? ''),
          color: String(createPayload.color ?? ''),
          shirts: Array.isArray(createPayload.shirts) ? createPayload.shirts : [],
        };
        shirtSets.push(newSet);

        await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(newSet) });
        return;
      }

      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ message: `Unhandled route: ${method} ${pathname}` }),
      });
    });

    await page.goto('/shirts');
    await pause(900);

    await expect(page.getByRole('heading', { name: 'Shirts (0)' })).toBeVisible();
    await page.getByRole('button', { name: 'Add' }).click();

    await expect(page.getByRole('heading', { name: 'Add New Shirt Set' })).toBeVisible();
    await page.getByLabel('Sponsor Name *').fill('Adidas');
    await page.locator('#color').last().fill('#00a86b');

    await page.getByLabel('Create shirts automatically').check();
    await page.locator('#startNumber').fill('1');
    await page.locator('#endNumber').fill('3');
    await page.locator('#size').selectOption('M');
    await page.getByLabel('Include GK').check();
    await page.locator('#goalkeeperNumber').fill('1');

    await page.getByRole('button', { name: 'Create Shirt Set' }).click();
    await pause(700);

    await expect(page.getByRole('heading', { name: 'Add New Shirt Set' })).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'Shirts (1)' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Adidas' })).toBeVisible();
    await expect(page.getByText('3 shirts')).toBeVisible();

    expect(createPayload).toEqual({
      sponsor: 'Adidas',
      color: '#00a86b',
      shirts: [
        { number: 2, size: 'M', isGoalkeeper: false },
        { number: 3, size: 'M', isGoalkeeper: false },
        { number: 1, size: 'M', isGoalkeeper: true },
      ],
    });
  });
});