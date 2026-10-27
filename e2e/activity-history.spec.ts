import { expect, test } from '@playwright/test';

test('opens activity change history from the actions menu', async ({ page }) => {
  const squadId = 'squad-1';
  const activityId = 'activity-1';
  const squad = { id: squadId, name: 'Tigers', periods: [], matchFormats: [], formations: [] };
  const activity = {
    id: activityId,
    squadId,
    kind: 'training',
    status: 'active',
    name: 'Tuesday training',
    startsAt: '2026-10-27T17:00:00Z',
    teams: [],
    invitations: [],
  };

  await page.addInitScript(() => {
    localStorage.setItem('token', 'e2e-token');
    localStorage.setItem('selectedGroupId', 'squad-1');
  });
  await page.route('**/health', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
  await page.route('**/auth/me', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'user-1', firstName: 'Taylor', lastName: 'Trainer' }) }));
  await page.route('**/api/**', (route) => {
    const url = new URL(route.request().url());
    let body: unknown = [];
    if (url.pathname === '/api/squads') body = [squad];
    if (url.pathname === `/api/squads/${squadId}`) body = squad;
    if (url.pathname === `/api/squads/${squadId}/members`) body = { players: [], trainers: [] };
    if (url.pathname === `/api/squads/${squadId}/activities`) body = [activity];
    if (url.pathname === `/api/squads/${squadId}/activity-events`) body = { items: [], nextCursor: undefined };
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });

  await page.goto(`/activities/${activityId}`);
  await expect(page.getByRole('heading', { name: activity.name })).toBeVisible();
  await page.getByRole('button', { name: 'Activity actions' }).click();
  await page.getByRole('menuitem', { name: 'Change history' }).click();
  await expect(page).toHaveURL(new RegExp(`/activities/${activityId}/history$`));
  await expect(page.getByRole('heading', { name: 'Change history' })).toBeVisible();
  await expect(page.getByText('No changes have been recorded yet.')).toBeVisible();
});
