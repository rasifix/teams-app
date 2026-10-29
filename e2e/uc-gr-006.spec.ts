import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

type Language = 'en' | 'de';
type ShirtRecord = {
  id?: string;
  number: number;
  size: string;
  isGoalkeeper: boolean;
  status?: 'available' | 'unavailable';
};
type ShirtSetRecord = { id: string; sponsor: string; color: string; shirts: ShirtRecord[] };
const captureScreenshots = (globalThis as { process?: { env?: Record<string, string | undefined> } })
  .process?.env?.DOCS_SCREENSHOT_CAPTURE === '1';

const labels = {
  en: {
    heading: 'Shirts (0)', addSet: 'Add New Shirt Set', createSet: 'Create Shirt Set',
    sponsor: 'Sponsor Name *', color: 'Color *', createAuto: 'Create shirts automatically',
    setName: 'Northstar', addShirt: 'Add New Shirt', shirtNumber: 'Shirt Number *', size: 'Size *',
    isGoalkeeper: 'This is a goalkeeper shirt', unavailable: 'Mark shirt as unavailable',
    addShirtAction: 'Add Shirt', save: 'Save Changes', removeShirt: 'Remove Shirt', remove: 'Remove',
    setEdit: 'Edit set', setEditTitle: 'Edit Shirt Set',
    setDelete: 'Delete set', setDeleteTitle: 'Delete Shirt Set', confirm: 'Delete',
  },
  de: {
    heading: 'Trikots (0)', addSet: 'Neuen Trikotsatz hinzufügen', createSet: 'Trikotsatz erstellen',
    sponsor: 'Sponsorname *', color: 'Farbe *', createAuto: 'Trikots automatisch erstellen',
    setName: 'Nordstern', addShirt: 'Neues Trikot hinzufügen', shirtNumber: 'Trikotnummer *', size: 'Grösse *',
    isGoalkeeper: 'Dies ist ein Torwarttrikot', unavailable: 'Trikot als nicht verfügbar markieren',
    addShirtAction: 'Trikot hinzufügen', save: 'Änderungen speichern', removeShirt: 'Trikot entfernen', remove: 'Entfernen',
    setEdit: 'Satz bearbeiten', setEditTitle: 'Trikotsatz bearbeiten',
    setDelete: 'Satz löschen', setDeleteTitle: 'Trikotsatz löschen', confirm: 'Löschen',
  },
} satisfies Record<Language, Record<string, string>>;

async function screenshot(page: Page, language: Language, name: string) {
  if (!captureScreenshots) return;
  const directory = resolve('docs/assets', language);
  await mkdir(directory, { recursive: true });
  await page.screenshot({ path: resolve(directory, `shirts-${name}.png`), fullPage: true, animations: 'disabled' });
}

for (const language of ['en', 'de'] as const) {
  test(`UC-GR-006 manages shirt sets and inventory in ${language}`, async ({ page }) => {
    const text = labels[language];
    const squadId = 'squad-shirt-guide';
    const squads = [{
      id: squadId, name: 'Harbor U12', periods: [], matchPlanningEnabled: false,
      members: [{ id: 'manager-1', email: 'coach@example.test', roles: ['admin'] }],
    }];
    const shirtSets: ShirtSetRecord[] = [];
    const methods: string[] = [];

    await page.addInitScript((locale) => {
      localStorage.setItem('token', 'docs-shirt-token');
      localStorage.setItem('selectedGroupId', 'squad-shirt-guide');
      localStorage.setItem('my-teams-language-preference', locale);
    }, language);
    await page.route('**/health', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"status":"ok"}' }));
    await page.route('**/auth/me', (route) => route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ id: 'manager-1', firstName: 'Alex', lastName: 'Coach', email: 'coach@example.test' }),
    }));
    await page.route('**/api/**', async (route) => {
      const request = route.request();
      const { pathname } = new URL(request.url());
      const method = request.method();
      methods.push(`${method} ${pathname}`);

      if (pathname === '/api/squads' && method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(squads) });
      } else if (pathname === `/api/squads/${squadId}` && method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(squads[0]) });
      } else if (pathname === `/api/squads/${squadId}/members` && method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ players: [], trainers: [] }) });
      } else if (pathname === `/api/squads/${squadId}/members/manager-1` && method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(squads[0].members[0]) });
      } else if (pathname === `/api/squads/${squadId}/activities` && method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      } else if (pathname === `/api/squads/${squadId}/shirtsets` && method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(shirtSets) });
      } else if (pathname === `/api/squads/${squadId}/shirtsets/set-1` && method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(shirtSets[0]) });
      } else if (pathname === `/api/squads/${squadId}/shirtsets` && method === 'POST') {
        const input = JSON.parse(request.postData() ?? '{}') as Record<string, unknown>;
        const shirts = Array.isArray(input.shirts) ? input.shirts as ShirtRecord[] : [];
        const created: ShirtSetRecord = {
          id: 'set-1', sponsor: String(input.sponsor ?? ''), color: String(input.color ?? ''),
          shirts: shirts.map((shirt, index) => ({ ...shirt, id: `shirt-${index + 1}`, status: shirt.status ?? 'available' })),
        };
        shirtSets.push(created);
        await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(created) });
      } else if (pathname === `/api/squads/${squadId}/shirtsets/set-1` && method === 'PUT') {
        const input = JSON.parse(request.postData() ?? '{}') as Record<string, unknown>;
        const shirts = Array.isArray(input.shirts) ? input.shirts as ShirtRecord[] : [];
        shirtSets[0] = {
          ...shirtSets[0], sponsor: String(input.sponsor ?? shirtSets[0].sponsor), color: String(input.color ?? shirtSets[0].color),
          shirts: shirts.map((shirt, index) => ({ ...shirt, id: shirt.id ?? `shirt-${index + 1}`, status: shirt.status ?? 'available' })),
        };
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(shirtSets[0]) });
      } else if (pathname === `/api/squads/${squadId}/shirtsets/set-1` && method === 'DELETE') {
        shirtSets.splice(0, 1);
        await route.fulfill({ status: 204, body: '' });
      } else {
        await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ message: `Unhandled ${method} ${pathname}` }) });
      }
    });

    await page.goto('/shirts');
    await expect(page.getByRole('heading', { name: text.heading })).toBeVisible();
    await screenshot(page, language, 'empty');
    await page.getByRole('button', { name: text.addSet }).click();
    await expect(page.getByRole('heading', { name: text.addSet })).toBeVisible();
    await page.getByLabel(text.sponsor).fill(text.setName);
    await page.locator('#color').last().fill('#176B52');
    await page.getByLabel(text.createAuto).check();
    await page.locator('#startNumber').fill('10');
    await page.locator('#endNumber').fill('12');
    await page.locator('#size').selectOption('M');
    await screenshot(page, language, 'create-set');
    await page.getByRole('button', { name: text.createSet }).click();

    await expect(page.locator('.shirt-set-toggle').getByText(text.setName, { exact: true })).toBeVisible();
    await expect(page.getByText(language === 'en' ? '3 shirts' : '3 Trikots')).toBeVisible();
    const setToggle = page.locator('.shirt-set-toggle');
    await setToggle.click();
    await expect(page.getByText('#10')).toBeVisible();
    await screenshot(page, language, 'set-created');

    await page.getByRole('button', { name: text.addShirt, exact: true }).click();
    await page.getByLabel(text.shirtNumber).fill('14');
    await page.getByLabel(text.size).selectOption('L');
    await page.getByLabel(text.isGoalkeeper).check();
    await page.getByLabel(text.unavailable).check();
    await screenshot(page, language, 'add-shirt');
    await page.getByRole('button', { name: text.addShirtAction, exact: true }).click();
    await expect(page.getByText('#14', { exact: true })).toBeVisible();
    await expect(page.getByText(language === 'en' ? 'UNAV' : 'NICHT VERF')).toBeVisible();
    await screenshot(page, language, 'inventory');

    await page.getByRole('button', { name: text.removeShirt }).last().click();
    await expect(page.getByRole('heading', { name: text.removeShirt })).toBeVisible();
    await page.getByRole('button', { name: text.remove, exact: true }).click();
    await expect(page.getByText('#14', { exact: true })).not.toBeVisible();

    await page.getByRole('button', { name: text.setEdit, exact: true }).click();
    await expect(page.getByRole('heading', { name: text.setEditTitle, exact: true })).toBeVisible();
    await page.getByLabel(text.sponsor).fill(`${text.setName} FC`);
    await page.getByRole('button', { name: text.save, exact: true }).click();
    await expect(page.locator('.shirt-set-toggle').getByText(`${text.setName} FC`, { exact: true })).toBeVisible();

    await page.getByRole('button', { name: text.setDelete, exact: true }).click();
    await expect(page.getByRole('heading', { name: text.setDeleteTitle, exact: true })).toBeVisible();
    await page.getByRole('button', { name: text.confirm, exact: true }).click();
    await expect(page.getByRole('heading', { name: text.heading })).toBeVisible();

    expect(methods).toContain(`POST /api/squads/${squadId}/shirtsets`);
    expect(methods.filter((entry) => entry === `PUT /api/squads/${squadId}/shirtsets/set-1`).length).toBeGreaterThanOrEqual(3);
    expect(methods).toContain(`DELETE /api/squads/${squadId}/shirtsets/set-1`);
  });

  test(`UC-GR-006 rejects duplicate shirt numbers in ${language}`, async ({ page }) => {
    // The primary management flow exercises persistence; this focused case guards the
    // same-set uniqueness rule before a request is submitted.
    const text = labels[language];
    const squadId = 'squad-shirt-guide';
    const set = { id: 'set-1', sponsor: 'Northstar', color: '#176B52', shirts: [{ id: 'shirt-1', number: 10, size: 'M', isGoalkeeper: false, status: 'available' }] };
    let updateRequests = 0;
    await page.addInitScript((locale) => {
      localStorage.setItem('token', 'docs-shirt-token');
      localStorage.setItem('selectedGroupId', 'squad-shirt-guide');
      localStorage.setItem('my-teams-language-preference', locale);
    }, language);
    await page.route('**/health', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"status":"ok"}' }));
    await page.route('**/auth/me', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'manager-1', email: 'coach@example.test' }) }));
    await page.route('**/api/**', async (route) => {
      const { pathname } = new URL(route.request().url());
      const method = route.request().method();
      let body: unknown = [];
      if (pathname === '/api/squads' && method === 'GET') body = [{ id: squadId, name: 'Harbor U12', periods: [], members: [{ id: 'manager-1', email: 'coach@example.test', roles: ['admin'] }] }];
      else if (pathname === `/api/squads/${squadId}`) body = { id: squadId, name: 'Harbor U12', periods: [], members: [{ id: 'manager-1', email: 'coach@example.test', roles: ['admin'] }] };
      else if (pathname === `/api/squads/${squadId}/members`) body = { players: [], trainers: [] };
      else if (pathname === `/api/squads/${squadId}/members/manager-1`) body = { id: 'manager-1', email: 'coach@example.test', roles: ['admin'] };
      else if (pathname === `/api/squads/${squadId}/shirtsets` && method === 'GET') body = [set];
      else if (pathname === `/api/squads/${squadId}/shirtsets/set-1` && method === 'PUT') { updateRequests += 1; body = set; }
      else if (pathname === `/api/squads/${squadId}/activities`) body = [];
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
    });
    await page.goto('/shirts');
    await page.locator('.shirt-set-toggle').click();
    await page.getByRole('button', { name: text.addShirt, exact: true }).click();
    await page.getByLabel(text.shirtNumber).fill('10');
    await expect(page.getByRole('button', { name: text.addShirtAction, exact: true })).toBeDisabled();
    await page.locator('form').evaluate((form) => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    await expect(page.getByText(language === 'en' ? 'Shirt #10 already exists in this set' : 'Trikot #10 existiert bereits in diesem Satz')).toBeVisible();
    expect(updateRequests).toBe(0);
  });
}
