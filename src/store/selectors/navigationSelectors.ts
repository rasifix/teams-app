import type { User } from '../../services/authService';
import type { Squad, Trainer } from '../../types';
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
