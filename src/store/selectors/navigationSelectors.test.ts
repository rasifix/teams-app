import { describe, expect, it } from 'vitest';
import type { TFunction } from 'i18next';
import type { Activity, Squad } from '../../types';
import { selectDocumentTitle, selectHeaderNavItems } from './navigationSelectors';

const t = ((key: string, options?: Record<string, string>) => {
  const labels: Record<string, string> = {
    'app.documentTitle.matchWithOpponent': '{{name}} {{opponent}}',
    'app.documentTitle.activityHistory': '{{activity}} · Change history',
    'page.teamPlayerSelection.addPlayersToTeam': 'Add Players to {{team}}',
    'page.teamLineup.title': 'Lineup - {{team}}',
  };
  return (labels[key] || key).replace(/{{(\w+)}}/g, (_, name: string) => options?.[name] || '');
}) as TFunction;

const squad = { id: 'squad-1', name: 'Squad D7', periods: [] } satisfies Squad;
const activity = {
  id: 'activity-1', squadId: 'squad-1', kind: 'match', status: 'active',
  name: 'Match', opponentName: 'SC Grafenried', startsAt: '2026-10-27T18:00:00Z',
  teams: [{ id: 'team-1', name: 'D7 Blue', strength: 2, selectedPlayers: [] }], invitations: [],
} satisfies Activity;

const title = (path: string, options: { search?: string; currentSquad?: Squad | null; activities?: Activity[] } = {}) =>
  selectDocumentTitle(path, options.search || '', options.currentSquad === undefined ? squad : options.currentSquad,
    options.activities || [activity], [], [], t);

describe('navigation selectors', () => {
  it('uses squad and activity names for history entries', () => {
    expect(title('/')).toBe('Squad D7');
    expect(title('/activities/activity-1')).toBe('Match SC Grafenried');
    expect(title('/activities/activity-1/history')).toBe('Match SC Grafenried · Change history');
    expect(title('/activities/activity-1/teams/team-1')).toBe('D7 Blue');
  });

  it('distinguishes nested pages and localized route labels', () => {
    expect(title('/activities/activity-1/teams/team-1/select-players')).toBe('Add Players to D7 Blue');
    expect(title('/activities/activity-1/teams/team-1/lineup/summary')).toBe('Lineup - D7 Blue');
    expect(title('/statistics/team-selections')).toBe('page.statistics.tabs.teamSelections');
    expect(title('/members/guardians')).toBe('domain.guardian.plural');
    expect(title('/login', { search: '?register=true' })).toBe('auth.createAccount');
  });

  it('falls back when entity data has not loaded or is missing', () => {
    expect(title('/', { currentSquad: null })).toBe('page.home.publicTitle');
    expect(title('/activities/missing')).toBe('page.events.title');
    expect(title('/activities/activity-1/teams/missing')).toBe('Match SC Grafenried');
    expect(title('/activities/activity-1', { activities: [] })).toBe('page.events.title');
    expect(title('/players/missing')).toBe('nav.members');
  });

  it('hides squad-scoped navigation when no squad is selected', () => {
    const user = {
      id: 'u-admin',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
    };

    expect(selectHeaderNavItems(user, null)).toEqual([]);
    expect(selectHeaderNavItems(user, undefined)).toEqual([]);
  });

  it('shows all navigation items for admins', () => {
    const items = selectHeaderNavItems(
      {
        id: 'u-admin',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
      },
      {
        id: 'squad-1',
        name: 'Squad',
        periods: [],
        trainers: [{ id: 'u-admin', email: 'admin@example.com' }],
      },
    );

    expect(items.map((item) => item.path)).toEqual(['/members', '/activities', '/shirts', '/squad-settings', '/statistics']);
  });


  it('shows all navigation items for trainers', () => {
    const items = selectHeaderNavItems(
      {
        id: 'u-trainer',
        email: 'trainer@example.com',
        firstName: 'Trainer',
        lastName: 'User',
      },
      {
        id: 'squad-1',
        name: 'Squad',
        periods: [],
        trainers: [{ id: 'u-trainer', email: 'trainer@example.com' }],
      },
    );

    expect(items.map((item) => item.path)).toEqual(['/members', '/activities', '/shirts', '/squad-settings', '/statistics']);
  });

  it('hides shirts and statistics for guardians without admin or trainer role', () => {
    const items = selectHeaderNavItems(
      {
        id: 'u-guardian',
        email: 'guardian@example.com',
        firstName: 'Guardian',
        lastName: 'User',
      },
      {
        id: 'squad-1',
        name: 'Squad',
        periods: [],
        trainers: [{ id: 'u-trainer', email: 'trainer@example.com' }],
      },
    );

    expect(items.map((item) => item.path)).toEqual(['/members', '/activities']);
  });
});
