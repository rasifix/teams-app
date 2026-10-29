import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { ActivityPayload } from '../src/types';

type Language = 'en' | 'de';

const labels = {
  en: {
    add: 'Add', activitiesTitle: 'Activities', futureTitle: 'Future Activities ({{count}})',
    empty: 'No activities created yet. Click "Create Activity" to get started.',
    modalTitle: 'Create New Activity', kind: 'Activity type', match: 'Match', tournament: 'Tournament',
    name: 'Activity Name *', date: 'Date *', startTime: 'Start time', location: 'Location',
    opponent: 'Opponent', teams: 'Number of Teams *', maxPlayers: 'Max Players per Team *',
    minPlayers: 'Min Players per Team *', submit: 'Add',
    matchName: 'Saturday Friendly', tournamentName: 'Summer Tournament',
  },
  de: {
    add: 'Hinzufügen', activitiesTitle: 'Aktivitäten', futureTitle: 'Kommende Aktivitäten ({{count}})',
    empty: 'Noch keine Aktivitäten erstellt. Klicke auf "Aktivität erstellen", um zu starten.',
    modalTitle: 'Neue Aktivität erstellen', kind: 'Aktivitätsart', match: 'Spiel', tournament: 'Turnier',
    name: 'Aktivitätsname *', date: 'Datum *', startTime: 'Startzeit', location: 'Ort',
    opponent: 'Gegner', teams: 'Anzahl Teams *', maxPlayers: 'Max. Spieler pro Team *',
    minPlayers: 'Min. Spieler pro Team *', submit: 'Hinzufügen',
    matchName: 'Samstagsspiel', tournamentName: 'Sommerturnier',
  },
} satisfies Record<Language, Record<string, string>>;

async function screenshot(page: Page, language: Language, name: string) {
  if (process.env.DOCS_SCREENSHOT_CAPTURE !== '1') return;
  const directory = resolve('docs/assets', language);
  await mkdir(directory, { recursive: true });
  await page.screenshot({ path: resolve(directory, `activity-${name}.png`), fullPage: true, animations: 'disabled' });
}

function futureDateInput(daysAhead: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

for (const language of ['en', 'de'] as const) {
  test(`UC-EV-001 creates a match and tournament (${language})`, async ({ page }) => {
    const text = labels[language];
    const squadId = 'squad-activity-guide';
    const squad = {
      id: squadId, name: 'Harbor U12', periods: [], matchPlanningEnabled: false,
      members: [{ id: 'manager-1', email: 'coach@example.test', roles: ['admin'] }],
    };
    const createdActivities: Array<ActivityPayload & { id: string; squadId: string }> = [];

    await page.addInitScript((locale) => {
      localStorage.setItem('token', 'docs-activity-token');
      localStorage.setItem('selectedGroupId', 'squad-activity-guide');
      localStorage.setItem('my-teams-language-preference', locale);
    }, language);
    await page.route('**/health', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"status":"ok"}' }));
    await page.route('**/auth/me', (route) => route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ id: 'manager-1', firstName: 'Alex', lastName: 'Coach', email: 'coach@example.test' }),
    }));
    await page.route('**/api/**', async (route) => {
      const { pathname } = new URL(route.request().url());
      const method = route.request().method();
      if (pathname === '/api/squads' && method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([squad]) });
      } else if (pathname === `/api/squads/${squadId}` && method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(squad) });
      } else if (pathname === `/api/squads/${squadId}/members` && method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ players: [], trainers: [] }) });
      } else if (pathname === `/api/squads/${squadId}/members/manager-1` && method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(squad.members[0]) });
      } else if (pathname === `/api/squads/${squadId}/activities` && method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(createdActivities) });
      } else if (pathname === `/api/squads/${squadId}/activities` && method === 'POST') {
        const payload = JSON.parse(route.request().postData() ?? '{}') as ActivityPayload;
        const created = { id: `activity-${createdActivities.length + 1}`, squadId, ...payload };
        createdActivities.push(created);
        await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(created) });
      } else if (pathname === `/api/squads/${squadId}/shirtsets` && method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      } else {
        await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ message: `Unhandled ${method} ${pathname}` }) });
      }
    });

    await page.goto('/activities');
    await expect(page.getByRole('heading', { name: text.activitiesTitle, exact: true })).toBeVisible();
    await expect(page.getByText(text.empty, { exact: true })).toBeVisible();
    await screenshot(page, language, 'empty');

    const openForm = async () => {
      await page.getByRole('button', { name: text.add, exact: true }).first().click();
      const dialog = page.getByRole('dialog');
      await expect(dialog.getByRole('heading', { name: text.modalTitle, exact: true })).toBeVisible();
      return dialog;
    };
    const fillCoreFields = async (dialog: ReturnType<typeof page.getByRole>, name: string) => {
      await dialog.getByLabel(text.name).fill(name);
      await dialog.getByLabel(text.date).fill(futureDateInput(14));
      await dialog.getByLabel(text.startTime).fill('10:30');
      await dialog.getByLabel(text.location).fill('Harbor Field');
    };

    const matchForm = await openForm();
    await expect(matchForm.getByLabel(text.kind)).toHaveValue('match');
    await fillCoreFields(matchForm, text.matchName);
    await matchForm.getByLabel(text.opponent).fill('Riverside U12');
    await screenshot(page, language, 'create-match');
    await matchForm.getByRole('button', { name: text.submit, exact: true }).click();
    await expect(page.getByRole('heading', { name: text.futureTitle.replace('{{count}}', '1'), exact: true })).toBeVisible();
    await expect(page.getByText(text.matchName, { exact: true })).toBeVisible();
    await screenshot(page, language, 'match-created');

    expect(createdActivities[0]).toMatchObject({
      kind: 'match', name: text.matchName, location: 'Harbor Field', opponentName: 'Riverside U12',
      minPlayersPerTeam: 6, maxPlayersPerTeam: 9, invitations: [],
    });
    expect(createdActivities[0].teams).toHaveLength(1);
    expect(createdActivities[0].teams[0]).toMatchObject({ strength: 2, selectedPlayers: [], startTime: '10:30' });

    const tournamentForm = await openForm();
    await tournamentForm.getByLabel(text.kind).selectOption('tournament');
    await fillCoreFields(tournamentForm, text.tournamentName);
    await tournamentForm.getByLabel(text.teams).fill('2');
    await screenshot(page, language, 'create-tournament');
    await tournamentForm.getByRole('button', { name: text.submit, exact: true }).click();
    await expect(page.getByRole('heading', { name: text.futureTitle.replace('{{count}}', '2'), exact: true })).toBeVisible();
    await expect(page.getByText(text.tournamentName, { exact: true })).toBeVisible();

    expect(createdActivities[1]).toMatchObject({ kind: 'tournament', name: text.tournamentName, invitations: [] });
    expect(createdActivities[1].teams).toHaveLength(2);
    expect(createdActivities[1].teams.every((team) => team.strength === 2 && team.selectedPlayers.length === 0)).toBe(true);
    await screenshot(page, language, 'created');
  });
}
