import type { User } from '../../services/authService';
import type { Squad, Trainer } from '../../types';
import type { Activity, Player } from '../../types';
import type { TFunction } from 'i18next';
import { canAccessRestrictedManagement } from '../../utils/permissions';

export interface HeaderNavItem {
  path: '/members' | '/activities' | '/shirts' | '/statistics' | '/squad-settings';
  labelKey: 'nav.members' | 'nav.events' | 'nav.shirts' | 'nav.statistics' | 'nav.squadSettings';
}

const BASE_NAV_ITEMS: HeaderNavItem[] = [
  { path: '/members', labelKey: 'nav.members' },
  { path: '/activities', labelKey: 'nav.events' },
  { path: '/shirts', labelKey: 'nav.shirts' },
  { path: '/squad-settings', labelKey: 'nav.squadSettings' },
  { path: '/statistics', labelKey: 'nav.statistics' },
];

export const selectHeaderNavItems = (
  user: User | null | undefined,
  squad: Squad | null | undefined,
  trainers: Trainer[] = [],
): HeaderNavItem[] => {
  if (!squad) {
    return [];
  }

  if (canAccessRestrictedManagement(user, { squad, trainers })) {
    return BASE_NAV_ITEMS;
  }

  return BASE_NAV_ITEMS.filter((item) => item.path !== '/shirts' && item.path !== '/statistics' && item.path !== '/squad-settings');
};

export const selectDocumentTitle = (
  pathname: string,
  search: string,
  squad: Squad | null | undefined,
  activities: Activity[],
  players: Player[],
  trainers: Trainer[],
  t: TFunction,
): string => {
  if (pathname === '/') return squad?.name || t('page.home.publicTitle');
  if (pathname === '/login') return t(search.includes('register=true') ? 'auth.createAccount' : 'auth.signInToAccount');
  if (pathname === '/reset-password') return t(search.includes('token=') ? 'resetPassword.resetTitle' : 'resetPassword.requestTitle');
  if (pathname === '/squads') return t('page.squads.selectTitle');

  const segments = pathname.split('/').filter(Boolean);
  if (segments[0] === 'activities') {
    const activity = activities.find((item) => item.id === segments[1]);
    if (!activity) return t('page.events.title');
    const activityTitle = activity.kind === 'match' && activity.opponentName
      ? t('app.documentTitle.matchWithOpponent', { name: activity.name, opponent: activity.opponentName })
      : activity.name;
    if (segments[2] === 'history') return t('app.documentTitle.activityHistory', { activity: activityTitle });
    if (segments[2] === 'teams') {
      const team = activity.teams.find((item) => item.id === segments[3]);
      if (!team) return activityTitle;
      if (segments[4] === 'select-players') return t('page.teamPlayerSelection.addPlayersToTeam', { team: team.name });
      if (segments[4] === 'lineup') return t('page.teamLineup.title', { team: team.name });
      return team.name;
    }
    return activityTitle;
  }
  if (segments[0] === 'players') {
    const player = players.find((item) => item.id === segments[1]);
    return player ? `${player.firstName} ${player.lastName}` : t('nav.members');
  }
  if (segments[0] === 'trainers') {
    const trainer = trainers.find((item) => item.id === segments[1]);
    return trainer ? `${trainer.firstName} ${trainer.lastName}` : t('nav.members');
  }
  if (segments[0] === 'members') {
    if (segments[1] === 'players') return t('domain.player.plural');
    if (segments[1] === 'trainers') return t('domain.trainer.plural');
    if (segments[1] === 'guardians') return t('domain.guardian.plural');
    return t('page.members.title');
  }
  if (segments[0] === 'statistics') {
    const tab = segments[1] === 'event-participation' ? 'eventParticipation'
      : segments[1] === 'team-selections' ? 'teamSelections' : 'playerStatistics';
    return t(`page.statistics.tabs.${tab}`);
  }
  const staticTitles: Record<string, string> = {
    '/spond-import': 'spondSync.title',
    '/shirts': 'nav.shirts',
    '/squad-settings': 'page.squadSettings.title',
    '/match-planning': 'page.squadSettings.title',
    '/ui-kit': 'page.uiKit.title',
  };
  return t(staticTitles[pathname] || 'app.name');
};
