import { expect, test } from '@playwright/test';

const DEMO_MODE = (
  globalThis as { process?: { env?: Record<string, string | undefined> } }
).process?.env?.E2E_DEMO_MODE === '1';

test.describe('UC-GR-005 - Edit Guardian', () => {
  test('successfully edits an existing-user guardian', async ({ page }) => {
    const pause = async (ms = 700) => {
      if (DEMO_MODE) {
        await page.waitForTimeout(ms);
      }
    };

    const groupId = 'group-1';
    const playerId = 'player-1';

    const groups = [{ id: groupId, name: 'U12 Tigers', periods: [] }];
    const trainers = [
      { id: 'trainer-1', firstName: 'Alex', lastName: 'Guardian', email: 'alex.guardian@example.com' },
    ];

    let player = {
      id: playerId,
      firstName: 'Liam',
      lastName: 'Miller',
      birthYear: 2014,
      birthDate: '2014-04-15',
      level: 3,
      guardians: [
        {
          id: 'guardian-existing-1',
          groupId,
          firstName: 'Alex',
          lastName: 'Guardian',
          email: 'alex.guardian@example.com',
        },
      ],
    };

    const calls: string[] = [];
    let addPayload: Record<string, unknown> | null = null;

    await page.addInitScript((selectedId) => {
      window.localStorage.setItem('token', 'e2e-token');
      window.localStorage.setItem('selectedGroupId', selectedId);
    }, groupId);

    await page.route('**/health', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'ok' }) });
    });

    await page.route('**/auth/me', async (route) => {
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
          body: JSON.stringify({ players: [player], trainers }),
        });
        return;
      }

      if (pathname === `/api/groups/${groupId}/shirtsets` && method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
        return;
      }

      if (pathname === `/api/groups/${groupId}/events` && method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
        return;
      }

      if (pathname === `/api/groups/${groupId}/members/${playerId}/guardians/guardian-existing-1` && method === 'DELETE') {
        calls.push('DELETE');
        player = { ...player, guardians: [] };
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...player, role: 'player' }) });
        return;
      }

      if (pathname === `/api/groups/${groupId}/members/${playerId}/guardians` && method === 'POST') {
        calls.push('POST');
        addPayload = JSON.parse(request.postData() ?? '{}') as Record<string, unknown>;
        player = {
          ...player,
          guardians: [
            {
              id: 'guardian-existing-2',
              groupId,
              firstName: String(addPayload.firstName ?? ''),
              lastName: String(addPayload.lastName ?? ''),
              email: String(addPayload.email ?? ''),
            },
          ],
        };
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...player, role: 'player' }) });
        return;
      }

      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ message: `Unhandled route: ${method} ${pathname}` }),
      });
    });

    await page.goto(`/players/${playerId}`);
    await pause(900);

    await expect(page.getByText('Alex Guardian')).toBeVisible();
    await page.getByRole('button', { name: 'Edit' }).nth(1).click();

    await expect(page.getByRole('heading', { name: 'Edit Guardian' })).toBeVisible();
    await page.getByLabel('First Name').fill('Alexa');
    await page.getByLabel('Last Name').fill('Guardian-Senior');
    await page.getByLabel('Email').fill('alexa.guardian@example.com');

    await page.getByRole('button', { name: 'Save' }).click();
    await pause(700);

    await expect(page.getByRole('heading', { name: 'Edit Guardian' })).not.toBeVisible();
    await expect(page.getByText('Alexa Guardian-Senior')).toBeVisible();
    await expect(page.getByText('alexa.guardian@example.com')).toBeVisible();

    expect(calls).toEqual(['DELETE', 'POST']);
    expect(addPayload).toEqual({
      firstName: 'Alexa',
      lastName: 'Guardian-Senior',
      email: 'alexa.guardian@example.com',
    });
  });

  test('successfully edits a documented-only guardian', async ({ page }) => {
    const pause = async (ms = 700) => {
      if (DEMO_MODE) {
        await page.waitForTimeout(ms);
      }
    };

    const groupId = 'group-1';
    const playerId = 'player-2';

    const groups = [{ id: groupId, name: 'U12 Tigers', periods: [] }];

    let player = {
      id: playerId,
      firstName: 'Noah',
      lastName: 'Smith',
      birthYear: 2015,
      birthDate: '2015-07-21',
      level: 2,
      guardians: [
        {
          id: 'guardian-doc-1',
          groupId,
          firstName: 'Pat',
          lastName: 'Doe',
        },
      ],
    };

    const calls: string[] = [];
    let addPayload: Record<string, unknown> | null = null;

    await page.addInitScript((selectedId) => {
      window.localStorage.setItem('token', 'e2e-token');
      window.localStorage.setItem('selectedGroupId', selectedId);
    }, groupId);

    await page.route('**/health', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'ok' }) });
    });

    await page.route('**/auth/me', async (route) => {
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
          body: JSON.stringify({ players: [player], trainers: [] }),
        });
        return;
      }

      if (pathname === `/api/groups/${groupId}/shirtsets` && method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
        return;
      }

      if (pathname === `/api/groups/${groupId}/events` && method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
        return;
      }

      if (pathname === `/api/groups/${groupId}/members/${playerId}/guardians/guardian-doc-1` && method === 'DELETE') {
        calls.push('DELETE');
        player = { ...player, guardians: [] };
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...player, role: 'player' }) });
        return;
      }

      if (pathname === `/api/groups/${groupId}/members/${playerId}/guardians` && method === 'POST') {
        calls.push('POST');
        addPayload = JSON.parse(request.postData() ?? '{}') as Record<string, unknown>;
        player = {
          ...player,
          guardians: [
            {
              id: 'guardian-doc-2',
              groupId,
              firstName: String(addPayload.firstName ?? ''),
              lastName: String(addPayload.lastName ?? ''),
            },
          ],
        };
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...player, role: 'player' }) });
        return;
      }

      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ message: `Unhandled route: ${method} ${pathname}` }),
      });
    });

    await page.goto(`/players/${playerId}`);
    await pause(900);

    await expect(page.getByText('Pat Doe')).toBeVisible();
    await page.getByRole('button', { name: 'Edit' }).nth(1).click();

    await expect(page.getByRole('heading', { name: 'Edit Guardian' })).toBeVisible();
    await page.getByRole('radio', { name: 'Documented only' }).check();
    await page.getByLabel('First Name').fill('Patricia');
    await page.getByLabel('Last Name').fill('Doe-Smith');

    await page.getByRole('button', { name: 'Save' }).click();
    await pause(700);

    await expect(page.getByRole('heading', { name: 'Edit Guardian' })).not.toBeVisible();
    await expect(page.getByText('Patricia Doe-Smith')).toBeVisible();

    expect(calls).toEqual(['DELETE', 'POST']);
    expect(addPayload).toEqual({
      firstName: 'Patricia',
      lastName: 'Doe-Smith',
    });
  });
});
