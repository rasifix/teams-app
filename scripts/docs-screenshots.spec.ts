import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

type Language = 'en' | 'de';

const labels = {
  en: {
    overview: 'Overview', selectSquad: 'Select Your Squad', createNew: 'Create a new squad',
    createTitle: 'Create New Squad', createAction: 'Create Squad', squadName: 'Squad name',
    club: 'Club', description: 'Description', playersTitle: 'All Players',
    trainersTitle: 'All Trainers', add: 'Add', addPlayer: 'Add New Player',
    addPlayerAction: 'Add Player', addTrainer: 'Add New Trainer', addTrainerAction: 'Add Trainer', firstName: 'First name', lastName: 'Last name',
    birthDate: 'Birth Date', email: 'Email',
  },
  de: {
    overview: 'Übersicht', selectSquad: 'Mannschaft auswählen', createNew: 'Neue Mannschaft erstellen',
    createTitle: 'Neue Mannschaft erstellen', createAction: 'Mannschaft erstellen', squadName: 'Mannschaftsname',
    club: 'Verein', description: 'Beschreibung', playersTitle: 'Alle Spieler',
    trainersTitle: 'Alle Trainer', add: 'Hinzufügen', addPlayer: 'Neuen Spieler hinzufügen',
    addPlayerAction: 'Spieler hinzufügen', addTrainer: 'Neuen Trainer hinzufügen', addTrainerAction: 'Trainer hinzufügen', firstName: 'Vorname', lastName: 'Nachname',
    birthDate: 'Geburtsdatum', email: 'E-Mail',
  },
} satisfies Record<Language, Record<string, string>>;

async function screenshot(page: Page, language: Language, name: string) {
  const directory = resolve('docs/assets', language);
  await mkdir(directory, { recursive: true });
  await page.screenshot({ path: resolve(directory, `setup-${name}.png`), fullPage: true, animations: 'disabled' });
}

for (const language of ['en', 'de'] as const) {
  test(`capture squad setup guide in ${language}`, async ({ page }) => {
    const text = labels[language];
    const squads: Array<Record<string, unknown>> = [];
    const members: { players: Array<Record<string, unknown>>; trainers: Array<Record<string, unknown>> } = { players: [], trainers: [] };

    await page.addInitScript((locale) => {
      localStorage.setItem('token', 'docs-screenshot-token');
      localStorage.setItem('my-teams-language-preference', locale);
    }, language);

    await page.route('**/health', (route) => route.fulfill({
      status: 200, contentType: 'application/json', body: '{"status":"ok"}',
    }));
    await page.route('**/auth/me', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'manager-1', firstName: 'Alex', lastName: 'Coach', email: 'alex@example.test' }),
    }));
    await page.route('**/api/**', async (route) => {
      const { pathname } = new URL(route.request().url());
      const method = route.request().method();
      let data: unknown;

      if (pathname === '/api/squads' && method === 'GET') {
        data = squads;
      } else if (pathname === '/api/squads' && method === 'POST') {
        const request = JSON.parse(route.request().postData() ?? '{}') as Record<string, unknown>;
        const created = {
          ...request, id: 'squad-1', periods: [], matchFormats: [], formations: [],
          members: [{ id: 'manager-1', email: 'alex@example.test', roles: ['admin'] }],
        };
        squads.push(created);
        data = created;
      } else if (pathname === '/api/squads/squad-1' && method === 'GET') {
        data = squads[0];
      } else if (pathname === '/api/squads/squad-1/members' && method === 'GET') {
        data = members;
      } else if (pathname === '/api/squads/squad-1/members' && method === 'POST') {
        const request = JSON.parse(route.request().postData() ?? '{}') as Record<string, unknown>;
        const isPlayer = Array.isArray(request.roles) && request.roles.includes('player');
        const created = { ...request, id: isPlayer ? 'player-1' : 'trainer-1', ...(isPlayer ? { guardians: [] } : {}) };
        if (isPlayer) members.players.push(created);
        else members.trainers.push(created);
        data = created;
      } else if (pathname === '/api/squads/squad-1/activities' && method === 'GET') {
        data = [];
      } else if (pathname === '/api/squads/squad-1/shirtsets' && method === 'GET') {
        data = [];
      } else if (pathname === '/api/sfv-categories') {
        data = { categories: {} };
      } else {
        await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ message: `Unhandled ${method} ${pathname}` }) });
        return;
      }

      await route.fulfill({ status: method === 'POST' ? 201 : 200, contentType: 'application/json', body: JSON.stringify(data) });
    });

    await page.goto('/squads');
    await expect(page.getByRole('heading', { name: text.selectSquad })).toBeVisible();
    await screenshot(page, language, 'select-squad');

    await page.getByRole('button', { name: text.createNew }).click();
    await expect(page.getByRole('heading', { name: text.createTitle })).toBeVisible();
    await page.getByLabel(text.squadName).fill('Harbor U12');
    await page.getByLabel(text.club).fill('Harbor FC');
    await page.getByLabel(text.description).fill(language === 'en' ? 'Training squad' : 'Trainingsmannschaft');
    await screenshot(page, language, 'create-squad');
    await page.getByRole('button', { name: text.createAction, exact: true }).click();
    await expect(page.getByRole('heading', { name: text.overview })).toBeVisible();
    await screenshot(page, language, 'overview');

    await page.goto('/members/players');
    await expect(page.getByRole('heading', { name: new RegExp(`^${text.playersTitle}`) })).toBeVisible();
    await screenshot(page, language, 'players');
    await page.getByRole('button', { name: text.add, exact: true }).click();
    await expect(page.getByRole('heading', { name: text.addPlayer })).toBeVisible();
    await page.getByLabel(text.firstName).fill('Noah');
    await page.getByLabel(text.lastName).fill('Beispiel');
    await page.getByLabel(text.birthDate).fill('2015-03-20');
    await screenshot(page, language, 'add-player');
    await page.getByRole('button', { name: text.addPlayerAction, exact: true }).click();
    await expect(page.getByText('Noah Beispiel')).toBeVisible();
    await screenshot(page, language, 'player-added');

    await page.goto('/members/trainers');
    await expect(page.getByRole('heading', { name: new RegExp(`^${text.trainersTitle}`) })).toBeVisible();
    await screenshot(page, language, 'trainers');
    await page.getByRole('button', { name: text.add, exact: true }).click();
    await expect(page.getByRole('heading', { name: text.addTrainer })).toBeVisible();
    await page.getByLabel(text.firstName).fill('Mara');
    await page.getByLabel(text.lastName).fill('Muster');
    await page.getByLabel(text.email).fill('mara@example.test');
    await screenshot(page, language, 'add-trainer');
    await page.getByRole('button', { name: text.addTrainerAction, exact: true }).click();
    await expect(page.getByText('Mara Muster')).toBeVisible();
    await screenshot(page, language, 'trainer-added');
  });
}
