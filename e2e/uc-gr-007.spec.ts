import { expect, test } from '@playwright/test';

const DEMO_MODE = (
  globalThis as { process?: { env?: Record<string, string | undefined> } }
).process?.env?.E2E_DEMO_MODE === '1';

test.describe('UC-GR-007 - Sync Members From Another Group', () => {
  test('imports selected members, hides existing members, links guardians, and shows progress', async ({ page }) => {
    const pause = async (ms = 700) => {
      if (DEMO_MODE) {
        await page.waitForTimeout(ms);
      }
    };

    const targetGroupId = 'group-target';
    const sourceGroupId = 'group-source';

    const groups = [
      { id: targetGroupId, name: 'U12 Tigers', periods: [] },
      { id: sourceGroupId, name: 'U11 Wolves', periods: [] },
    ];

    const targetMembersState = {
      players: [
        {
          id: 'tp-1',
          firstName: 'Ari',
          lastName: 'Existing',
          birthYear: 2016,
          birthDate: '2016-03-10',
          level: 3,
          status: 'active',
          guardians: [],
          roles: ['player'],
        },
      ] as Array<Record<string, unknown>>,
      trainers: [
        {
          id: 'tt-1',
          firstName: 'Tom',
          lastName: 'Coach',
          email: 'tom.coach@example.com',
          roles: ['trainer'],
        },
        {
          id: 'tt-2',
          firstName: 'Lia',
          lastName: 'Parent',
          email: 'lia.parent@example.com',
          roles: ['trainer'],
        },
      ] as Array<Record<string, unknown>>,
    };

    const sourceMembersState = {
      players: [
        {
          id: 'sp-inactive',
          firstName: 'Ingo',
          lastName: 'Inactive',
          birthYear: 2014,
          birthDate: '2014-05-20',
          level: 1,
          status: 'inactive',
          guardians: [],
          roles: ['player'],
        },
        {
          id: 'sp-dup',
          firstName: 'Ari',
          lastName: 'Existing',
          birthYear: 2016,
          birthDate: '2016-03-10',
          level: 2,
          status: 'active',
          guardians: [],
          roles: ['player'],
        },
        {
          id: 'sp-new',
          firstName: 'Nina',
          lastName: 'Import',
          birthYear: 2015,
          birthDate: '2015-08-12',
          level: 4,
          status: 'active',
          guardians: [
            {
              id: 'sg-1',
              firstName: 'Lia',
              lastName: 'Parent',
              email: 'lia.parent@example.com',
            },
          ],
          roles: ['player'],
        },
      ],
      trainers: [
        {
          id: 'st-dup',
          firstName: 'Tom',
          lastName: 'Coach',
          email: 'tom.coach@example.com',
          roles: ['trainer'],
        },
        {
          id: 'st-new',
          firstName: 'Mila',
          lastName: 'ImportCoach',
          email: 'mila.import@example.com',
          roles: ['trainer'],
        },
      ],
    };

    const createdMembers: Array<Record<string, unknown>> = [];
    const linkedGuardianPayloads: Array<Record<string, unknown>> = [];

    await page.addInitScript((selectedId) => {
      window.localStorage.setItem('token', 'e2e-token');
      window.localStorage.setItem('selectedGroupId', selectedId);
    }, targetGroupId);

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
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(groups),
        });
        return;
      }

      if (pathname === `/api/groups/${targetGroupId}` && method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(groups[0]),
        });
        return;
      }

      if (pathname === `/api/groups/${targetGroupId}/members` && method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(targetMembersState),
        });
        return;
      }

      if (pathname === `/api/groups/${sourceGroupId}/members` && method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(sourceMembersState),
        });
        return;
      }

      if (pathname === `/api/groups/${targetGroupId}/events` && method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
        return;
      }

      if (pathname === `/api/groups/${targetGroupId}/shirtsets` && method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
        return;
      }

      if (pathname === `/api/groups/${targetGroupId}/members/tt-2` && method === 'GET') {
        const targetTrainer = targetMembersState.trainers.find((trainer) => trainer.id === 'tt-2');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(targetTrainer),
        });
        return;
      }

      if (pathname === `/api/groups/${targetGroupId}/members/tt-2` && method === 'PUT') {
        const payload = JSON.parse(request.postData() ?? '{}') as Record<string, unknown>;
        const nextRoles = Array.isArray(payload.roles) ? payload.roles : ['trainer', 'guardian'];
        targetMembersState.trainers = targetMembersState.trainers.map((trainer) => {
          if (trainer.id !== 'tt-2') {
            return trainer;
          }

          return {
            ...trainer,
            ...payload,
            roles: nextRoles,
          };
        });

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(targetMembersState.trainers.find((trainer) => trainer.id === 'tt-2')),
        });
        return;
      }

      if (pathname === `/api/groups/${targetGroupId}/members` && method === 'POST') {
        const payload = JSON.parse(request.postData() ?? '{}') as Record<string, unknown>;
        createdMembers.push(payload);

        const isPlayer = Array.isArray(payload.roles) && payload.roles.includes('player');
        const id = isPlayer ? `tp-new-${createdMembers.length}` : `tt-new-${createdMembers.length}`;

        const created = {
          id,
          ...payload,
        };

        if (isPlayer) {
          targetMembersState.players.push(created);
        } else {
          targetMembersState.trainers.push(created);
        }

        await new Promise((resolve) => setTimeout(resolve, 120));

        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(created),
        });
        return;
      }

      const guardianLinkMatch = pathname.match(new RegExp(`^/api/groups/${targetGroupId}/members/([^/]+)/guardians$`));
      if (guardianLinkMatch && method === 'POST') {
        const playerId = guardianLinkMatch[1];
        const payload = JSON.parse(request.postData() ?? '{}') as Record<string, unknown>;
        linkedGuardianPayloads.push(payload);

        const guardianId = String(payload.guardianId ?? '');
        const linkedTrainer = targetMembersState.trainers.find((trainer) => trainer.id === guardianId);
        const targetPlayer = targetMembersState.players.find((player) => player.id === playerId);

        const updatedPlayer = {
          ...targetPlayer,
          guardians: [
            ...(((targetPlayer?.guardians || []) as Array<Record<string, unknown>>)),
            {
              id: guardianId,
              userId: guardianId,
              firstName: linkedTrainer?.firstName || 'Linked',
              lastName: linkedTrainer?.lastName || 'Guardian',
              email: linkedTrainer?.email,
            },
          ],
        };

        targetMembersState.players = targetMembersState.players.map((player) => (
          player.id === playerId ? updatedPlayer : player
        ));

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(updatedPlayer),
        });
        return;
      }

      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ message: `Unhandled route: ${method} ${pathname}` }),
      });
    });

    await page.goto('/members/players');
    await pause(900);

    await page.getByRole('button', { name: 'Import' }).click();

    const modal = page.locator('.modal-content');
    await expect(modal.getByRole('heading', { name: 'Import Members' })).toBeVisible();

    await modal.locator('#source-group').selectOption(sourceGroupId);

    await expect(modal.getByText('Source members: 5')).toBeVisible();
    await expect(modal.getByText('Importable members: 2')).toBeVisible();
    await expect(modal.getByText('Already existing (hidden): 3')).toBeVisible();
    await expect(modal.getByText('Ingo Inactive')).toHaveCount(0);

    await modal.getByRole('button', { name: '2015' }).click();

    await expect(modal.getByText('Source members: 3')).toBeVisible();
    await expect(modal.getByText('Importable members: 2')).toBeVisible();
    await expect(modal.getByText('Already existing (hidden): 1')).toBeVisible();
    await expect(modal.getByText('Ingo Inactive')).toHaveCount(0);

    await expect(modal.getByText('Nina Import')).toBeVisible();
    await expect(modal.getByText('Mila ImportCoach')).toBeVisible();

    await expect(modal.getByText('Ari Existing')).toHaveCount(0);
    await expect(modal.getByText('Tom Coach')).toHaveCount(0);

    await modal.getByRole('button', { name: 'Select all' }).click();
    await modal.getByRole('button', { name: 'Apply import' }).click();

    await expect(modal.getByText('Import in progress')).toBeVisible();
    await expect(modal.getByText('Import finished')).toBeVisible();

    await expect(modal.getByText('Imported players: 1')).toBeVisible();
    await expect(modal.getByText('Imported trainers: 1')).toBeVisible();
    await expect(modal.getByText('Imported guardians: 1')).toBeVisible();

    expect(createdMembers).toHaveLength(2);
    expect(createdMembers[0]).toMatchObject({
      firstName: 'Nina',
      lastName: 'Import',
      roles: ['player'],
      level: 4,
      status: 'active',
    });
    expect(createdMembers[1]).toMatchObject({
      firstName: 'Mila',
      lastName: 'ImportCoach',
      email: 'mila.import@example.com',
      roles: ['trainer'],
    });

    expect(linkedGuardianPayloads).toEqual([{ guardianId: 'tt-2' }]);
  });
});
