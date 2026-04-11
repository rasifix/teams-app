import { expect, test } from '@playwright/test';

const DEMO_MODE = (
  globalThis as { process?: { env?: Record<string, string | undefined> } }
).process?.env?.E2E_DEMO_MODE === '1';

test.describe('UC-GR-004 - Manage Guardians', () => {
  test('successfully assigns an existing user as guardian', async ({ page }) => {
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
      guardians: [] as Array<Record<string, unknown>>,
    };

    let guardianPostPayload: Record<string, unknown> | null = null;

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

      if (pathname === `/api/groups/${groupId}/members/${playerId}/guardians` && method === 'POST') {
        guardianPostPayload = JSON.parse(request.postData() ?? '{}') as Record<string, unknown>;
        const linkedGuardianId = String(guardianPostPayload?.guardianId ?? '');
        const linkedTrainer = trainers.find((trainer) => trainer.id === linkedGuardianId);
        player = {
          ...player,
          guardians: [
            {
              id: linkedTrainer?.id || 'guardian-1',
              userId: linkedTrainer?.id,
              groupId,
              firstName: linkedTrainer?.firstName || '',
              lastName: linkedTrainer?.lastName || '',
              email: linkedTrainer?.email || undefined,
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

    await expect(page.getByText('Guardians (0)')).toBeVisible();
    await page.getByRole('button', { name: 'Add Guardian' }).click();

    await expect(page.getByRole('heading', { name: 'Assign Guardian' })).toBeVisible();
    await page.locator('#guardian-existing').selectOption('trainer-1');

    await page.getByRole('button', { name: 'Assign' }).click();
    await pause(700);

    await expect(page.getByRole('heading', { name: 'Assign Guardian' })).not.toBeVisible();
    await expect(page.getByText('Guardians (1)')).toBeVisible();
    await expect(page.getByText('Alex Guardian')).toBeVisible();
    await expect(page.getByText('alex.guardian@example.com')).toBeVisible();

    expect(guardianPostPayload).toEqual({
      guardianId: 'trainer-1',
    });
  });

  test('successfully assigns a documented-only guardian', async ({ page }) => {
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
      guardians: [] as Array<Record<string, unknown>>,
    };

    let createMemberPayload: Record<string, unknown> | null = null;
    let guardianPostPayload: Record<string, unknown> | null = null;

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

      if (pathname === `/api/groups/${groupId}/members` && method === 'POST') {
        createMemberPayload = JSON.parse(request.postData() ?? '{}') as Record<string, unknown>;
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'guardian-member-2',
            firstName: String(createMemberPayload.firstName ?? ''),
            lastName: String(createMemberPayload.lastName ?? ''),
            email: createMemberPayload.email ? String(createMemberPayload.email) : undefined,
            roles: ['guardian'],
          }),
        });
        return;
      }

      if (pathname === `/api/groups/${groupId}/members/${playerId}/guardians` && method === 'POST') {
        guardianPostPayload = JSON.parse(request.postData() ?? '{}') as Record<string, unknown>;
        player = {
          ...player,
          guardians: [
            {
              id: String(guardianPostPayload.guardianId ?? 'guardian-member-2'),
              groupId,
              firstName: String(createMemberPayload?.firstName ?? ''),
              lastName: String(createMemberPayload?.lastName ?? ''),
              email: createMemberPayload?.email ? String(createMemberPayload.email) : undefined,
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

    await expect(page.getByText('Guardians (0)')).toBeVisible();
    await page.getByRole('button', { name: 'Add Guardian' }).click();

    await expect(page.getByRole('heading', { name: 'Assign Guardian' })).toBeVisible();
    await page.getByRole('radio', { name: 'Documented only' }).check();
    await page.getByLabel('First Name').fill('Pat');
    await page.getByLabel('Last Name').fill('Doe');
    await page.getByLabel('Email (optional)').fill('pat.doe@example.com');

    await page.getByRole('button', { name: 'Assign' }).click();
    await pause(700);

    await expect(page.getByRole('heading', { name: 'Assign Guardian' })).not.toBeVisible();
    await expect(page.getByText('Guardians (1)')).toBeVisible();
    await expect(page.getByText('Pat Doe')).toBeVisible();
    await expect(page.getByText('pat.doe@example.com')).toBeVisible();

    expect(guardianPostPayload).toEqual({
      guardianId: 'guardian-member-2',
    });

    expect(createMemberPayload).toEqual({
      firstName: 'Pat',
      lastName: 'Doe',
      email: 'pat.doe@example.com',
      roles: ['guardian'],
    });
  });
});
