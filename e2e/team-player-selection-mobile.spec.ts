import { expect, test } from '@playwright/test';
import type { Activity, Player, Squad } from '../src/types';

test('moving an available player on mobile enables saving exactly one addition', async ({ page }) => {
  const squadId = 'squad-mobile-selection';
  const activityId = 'activity-mobile-selection';
  const teamId = 'team-mobile-selection';
  const player: Player = {
    id: 'player-1',
    firstName: 'Riley',
    lastName: 'Example',
    birthDate: '2015-06-15',
    level: 3,
    status: 'active',
  };
  const squad: Squad = {
    id: squadId,
    name: 'Mobile Selection Squad',
    periods: [],
    members: [{ id: 'user-1', email: 'coach@example.test', roles: ['admin'] }],
  };
  let activity: Activity = {
    id: activityId,
    squadId,
    kind: 'match',
    status: 'active',
    name: 'Future Match',
    startsAt: '2027-01-01T10:00:00.000Z',
    maxPlayersPerTeam: 1,
    teams: [{ id: teamId, name: 'Blue Team', strength: 2, selectedPlayers: [] }],
    invitations: [{ id: 'invitation-1', playerId: player.id, response: 'accepted' }],
  };
  let selectionChanges: { add: string[]; remove: Array<{ playerId: string }> } | null = null;

  await page.setViewportSize({ width: 375, height: 812 });
  await page.addInitScript((selectedSquadId) => {
    window.localStorage.setItem('token', 'e2e-token');
    window.localStorage.setItem('selectedGroupId', selectedSquadId);
    window.localStorage.setItem('my-teams-language-preference', 'en');
  }, squadId);

  await page.route('**/health', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ status: 'ok' }),
  }));
  await page.route('**/auth/me', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ id: 'user-1', email: 'coach@example.test', firstName: 'Casey', lastName: 'Coach' }),
  }));
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const { pathname } = new URL(request.url());
    const method = request.method();

    if (pathname === '/api/sfv-categories' && method === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ version: 'test', source: 'test', categories: {} }) });
    } else if (pathname === '/api/squads' && method === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([squad]) });
    } else if (pathname === `/api/squads/${squadId}` && method === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(squad) });
    } else if (pathname === `/api/squads/${squadId}/members` && method === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ players: [player], trainers: [] }) });
    } else if (pathname === `/api/squads/${squadId}/members/user-1` && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'user-1', firstName: 'Casey', lastName: 'Coach', roles: ['admin'] }),
      });
    } else if (pathname === `/api/squads/${squadId}/activities` && method === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([activity]) });
    } else if (pathname === `/api/squads/${squadId}/shirtsets` && method === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    } else if (pathname === `/api/squads/${squadId}/activities/${activityId}` && method === 'GET') {
      await route.fulfill({ status: 200, headers: { ETag: '"v1"' }, contentType: 'application/json', body: JSON.stringify(activity) });
    } else if (pathname === `/api/squads/${squadId}/activities/${activityId}/teams/${teamId}/selection-changes` && method === 'POST') {
      selectionChanges = JSON.parse(request.postData() ?? '{}') as typeof selectionChanges;
      activity = {
        ...activity,
        teams: activity.teams.map((team) => team.id === teamId
          ? { ...team, selectedPlayers: [...team.selectedPlayers, ...selectionChanges!.add] }
          : team),
      };
      await route.fulfill({ status: 200, headers: { ETag: '"v2"' }, contentType: 'application/json', body: JSON.stringify(activity) });
    } else {
      await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
    }
  });

  await page.goto(`/activities/${activityId}/teams/${teamId}/select-players`);

  const unselectedColumn = page.locator('.team-selection-column').nth(1);
  const moveButton = unselectedColumn.locator('.team-selection-mobile-move');
  await expect(moveButton).toBeVisible();
  await moveButton.click();

  const selectedColumn = page.locator('.team-selection-column--selected');
  await expect(selectedColumn.getByText('Riley Example', { exact: true })).toHaveCount(1);
  const saveButton = page.getByRole('button', { name: 'Save', exact: true });
  await expect(saveButton).toBeEnabled();
  await saveButton.click();

  await expect.poll(() => selectionChanges).toEqual({ add: [player.id], remove: [] });
});
