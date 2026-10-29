import { expect, test } from '@playwright/test';

for (const locale of ['en', 'de'] as const) {
  test(`UC-GR-013 syncs the full linked Spond group from Members > Trainers (${locale})`, async ({ page }) => {
    const trainers: Array<Record<string, unknown>> = [];
    let importPayload: Record<string, unknown> | null = null;
    const squad = {
      id: 'squad-1', name: 'Harbor U12', spondId: 'spond-group-1', periods: [], matchPlanningEnabled: false,
      trainers: [{ id: 'manager-1', email: 'coach@example.test' }],
      members: [{ id: 'manager-1', email: 'coach@example.test', roles: ['admin'] }],
    };

    await page.addInitScript((language) => {
      localStorage.setItem('token', 'e2e-token');
      localStorage.setItem('selectedGroupId', 'squad-1');
      localStorage.setItem('my-teams-language-preference', language);
    }, locale);
    await page.route('**/health', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"status":"ok"}' }));
    await page.route('**/auth/me', route => route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ id: 'manager-1', firstName: 'Alex', lastName: 'Coach', email: 'coach@example.test' }),
    }));
    await page.route('**/api/**', async (route) => {
      const request = route.request();
      const { pathname } = new URL(request.url());
      const method = request.method();
      if (pathname === '/api/squads' && method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([squad]) });
      } else if (pathname === '/api/squads/squad-1' && method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(squad) });
      } else if (pathname === '/api/squads/squad-1/members' && method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ players: [], trainers }) });
      } else if (pathname === '/api/squads/squad-1/activities' || pathname === '/api/squads/squad-1/shirtsets') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      } else if (pathname === '/api/sfv-categories') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ categories: {} }) });
      } else if (pathname === '/api/integrations/spond/groups' && method === 'POST') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: 'spond-group-1', name: 'Harbor FC U12' }]) });
      } else if (pathname === '/api/integrations/spond/snapshot' && method === 'POST') {
        await route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({
            group: { id: 'spond-group-1', name: 'Harbor FC U12', members: [
              { id: 'spond-trainer-1', firstName: 'Pat', lastName: 'Coach', roles: ['coach'], guardians: [] },
              { id: 'spond-player-1', firstName: 'Rae', lastName: 'Player', birthDate: '2015-04-12', roles: ['player'], guardians: [] },
              { id: 'spond-admin-1', firstName: 'Alex', lastName: 'Admin', roles: ['admin'], guardians: [] },
            ] },
            activities: [], sourceReadAt: '2026-10-29T10:00:00.000Z',
          }),
        });
      } else if (pathname === '/api/squads/squad-1/spond/import' && method === 'POST') {
        importPayload = JSON.parse(request.postData() ?? '{}') as Record<string, unknown>;
        trainers.push({ id: 'trainer-1', spondId: 'spond-trainer-1', firstName: 'Pat', lastName: 'Coach', roles: ['trainer'] });
        await route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({ importId: 'import-1', created: 1, linked: 0, updated: 0, unchanged: 0, skipped: 0, warnings: [] }),
        });
      } else {
        await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ message: `Unhandled ${method} ${pathname}` }) });
      }
    });

    await page.goto('/members/trainers');
    await page.getByRole('button', { name: locale === 'en' ? 'Sync' : 'Sync' }).click();
    await page.getByLabel(locale === 'en' ? 'Spond email' : 'Spond-E-Mail').fill('coach@example.test');
    await page.getByLabel(locale === 'en' ? 'Spond password' : 'Spond-Passwort').fill('temporary-password');
    await page.getByRole('button', { name: locale === 'en' ? 'Continue' : 'Weiter' }).click();
    await page.getByRole('button', { name: locale === 'en' ? 'Continue' : 'Weiter' }).click();

    await expect(page.getByText('Pat Coach')).toBeVisible();
    await expect(page.getByText('Rae Player')).toBeVisible();
    await expect(page.getByText('Alex Admin')).toHaveCount(0);
    await page.getByRole('button', { name: locale === 'en' ? 'Sync all data' : 'Alle Daten synchronisieren' }).click();
    await expect(page).toHaveURL(/\/members\/trainers$/);
    await expect(page.getByText(locale === 'en' ? /2 created/ : /2 erstellt/)).toBeVisible();
    expect(importPayload?.trainers).toEqual([{ action: 'create-trainer', spondMemberId: 'spond-trainer-1' }]);
    expect(importPayload?.members).toEqual([{
      action: 'create-player', spondMemberId: 'spond-player-1', birthDate: '2015-04-12', level: 1, status: 'active', guardianIds: [],
    }]);
    expect(importPayload?.activities).toEqual([]);
  });
}
