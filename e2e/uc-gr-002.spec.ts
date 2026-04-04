import { expect, test } from '@playwright/test';

const DEMO_MODE = (
  globalThis as { process?: { env?: Record<string, string | undefined> } }
).process?.env?.E2E_DEMO_MODE === '1';

test.describe('UC-GR-002 - Manage Trainers', () => {
  test('successfully creates a trainer from Members > Trainers', async ({ page }) => {
    const pause = async (ms = 700) => {
      if (DEMO_MODE) {
        await page.waitForTimeout(ms);
      }
    };

    const groupId = 'group-1';
    const groups = [{ id: groupId, name: 'U12 Tigers', periods: [] }];

    const membersState = {
      players: [],
      trainers: [] as Array<Record<string, unknown>>,
    };

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
          body: JSON.stringify(membersState),
        });
        return;
      }

      if (pathname === `/api/groups/${groupId}/members` && method === 'POST') {
        createPayload = JSON.parse(request.postData() ?? '{}') as Record<string, unknown>;

        const newTrainer = {
          id: 'trainer-1',
          firstName: String(createPayload.firstName ?? ''),
          lastName: String(createPayload.lastName ?? ''),
          email: createPayload.email ? String(createPayload.email) : undefined,
        };
        membersState.trainers.push(newTrainer);

        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ ...newTrainer, role: 'trainer' }),
        });
        return;
      }

      if (pathname === `/api/groups/${groupId}/events` && method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
        return;
      }

      if (pathname === `/api/groups/${groupId}/shirtsets` && method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
        return;
      }

      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ message: `Unhandled route: ${method} ${pathname}` }),
      });
    });

    await page.goto('/members/trainers');
    await pause(900);

    await expect(page.getByRole('heading', { name: 'All Trainers (0)' })).toBeVisible();
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.getByRole('heading', { name: 'Add New Trainer' })).toBeVisible();

    await page.getByLabel('First Name').fill('Nina');
    await page.getByLabel('Last Name').fill('Coach');
    await page.getByLabel('Email (optional)').fill('nina.coach@example.com');
    await page.getByRole('button', { name: 'Add Trainer' }).click();
    await pause(700);

    await expect(page.getByRole('heading', { name: 'Add New Trainer' })).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'All Trainers (1)' })).toBeVisible();
    await expect(page.getByText('Nina Coach')).toBeVisible();

    expect(createPayload).toEqual({
      firstName: 'Nina',
      lastName: 'Coach',
      email: 'nina.coach@example.com',
      role: 'trainer',
    });
  });
});