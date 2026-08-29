import type { User } from '../../services/authService';
import type { Group, Trainer } from '../../types';
import { canAccessRestrictedManagement } from '../../utils/permissions';

export interface HeaderNavItem {
  path: '/members' | '/events' | '/shirts' | '/statistics' | '/match-planning';
  labelKey: 'nav.members' | 'nav.events' | 'nav.shirts' | 'nav.statistics' | 'nav.matchPlanning';
}

const BASE_NAV_ITEMS: HeaderNavItem[] = [
  { path: '/members', labelKey: 'nav.members' },
  { path: '/events', labelKey: 'nav.events' },
  { path: '/shirts', labelKey: 'nav.shirts' },
  { path: '/match-planning', labelKey: 'nav.matchPlanning' },
  { path: '/statistics', labelKey: 'nav.statistics' },
];

export const selectHeaderNavItems = (
  user: User | null | undefined,
  group: Group | null | undefined,
  trainers: Trainer[] = [],
): HeaderNavItem[] => {
  if (canAccessRestrictedManagement(user, { group, trainers })) {
    return BASE_NAV_ITEMS;
  }

  return BASE_NAV_ITEMS.filter((item) => item.path !== '/shirts' && item.path !== '/statistics' && item.path !== '/match-planning');
};