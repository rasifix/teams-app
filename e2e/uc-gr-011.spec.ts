import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

async function captureGuideScreenshot(page: import('@playwright/test').Page, locale: 'en' | 'de', name: string) {
  if (process.env.DOCS_SCREENSHOT_CAPTURE !== '1') return;
  const directory = resolve('docs/assets', locale);
  await mkdir(directory, { recursive: true });
  await page.screenshot({ path: resolve(directory, `setup-${name}.png`), fullPage: true, animations: 'disabled' });
}

for (const locale of ['en', 'de'] as const) {
  test(`UC-GR-011 links a Spond group without importing data (${locale})`, async ({ page }) => {
    let updatedSquad: Record<string, unknown> | null = null;
    const squad = {
      id: 'squad-1', name: 'Harbor U12', periods: [], matchPlanningEnabled: false,
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
      const { pathname } = new URL(route.request().url());
      const method = route.request().method();
      if (pathname === '/api/squads' && method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([squad]) });
      } else if (pathname === '/api/squads/squad-1' && method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(updatedSquad ?? squad) });
      } else if (pathname === '/api/integrations/spond/groups' && method === 'POST') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: 'spond-group-1', name: 'Harbor FC U12' }]) });
      } else if (pathname === '/api/squads/squad-1' && method === 'PUT') {
        updatedSquad = { ...squad, ...(JSON.parse(route.request().postData() ?? '{}') as Record<string, unknown>) };
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(updatedSquad) });
      } else if (pathname === '/api/squads/squad-1/members' || pathname === '/api/squads/squad-1/activities' || pathname === '/api/squads/squad-1/shirtsets') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(pathname.endsWith('/members') ? { players: [], trainers: [] } : []) });
      } else if (pathname === '/api/sfv-categories') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ categories: {} }) });
      } else {
        await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ message: `Unhandled ${method} ${pathname}` }) });
      }
    });

    await page.goto('/squad-settings');
    await captureGuideScreenshot(page, locale, 'spond-settings');
    await page.getByRole('link', { name: locale === 'en' ? 'Link Spond group' : 'Spond-Gruppe verknüpfen' }).click();
    await page.getByLabel(locale === 'en' ? 'Spond email' : 'Spond-E-Mail').fill('coach@example.test');
    await page.getByLabel(locale === 'en' ? 'Spond password' : 'Spond-Passwort').fill('example-password');
    await captureGuideScreenshot(page, locale, 'spond-credentials');
    await page.getByRole('button', { name: locale === 'en' ? 'Continue' : 'Weiter' }).click();
    await expect(page.getByText('Harbor FC U12')).toBeVisible();
    await captureGuideScreenshot(page, locale, 'spond-group');
    await page.getByRole('radio').check();
    const linkResponse = page.waitForResponse((response) => (
      response.url().endsWith('/api/squads/squad-1')
      && response.request().method() === 'PUT'
    ));
    await page.getByRole('button', { name: locale === 'en' ? 'Continue' : 'Weiter' }).click();
    await linkResponse;

    expect(updatedSquad).toMatchObject({ spondId: 'spond-group-1' });
    await expect(page.getByRole('heading', { name: locale === 'en' ? 'Group linked' : 'Gruppe verknüpft', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: locale === 'en' ? 'Done' : 'Fertig' })).toBeVisible();
    await captureGuideScreenshot(page, locale, 'spond-linked');
  });
}
