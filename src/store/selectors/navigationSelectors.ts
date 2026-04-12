import type { User } from '../../services/authService';
import type { Group, Trainer } from '../../types';
import { canAccessRestrictedManagement } from '../../utils/permissions';

export interface HeaderNavItem {
  path: '/members' | '/events' | '/shirts' | '/statistics';
  labelKey: 'nav.members' | 'nav.events' | 'nav.shirts' | 'nav.statistics';
}

const BASE_NAV_ITEMS: HeaderNavItem[] = [
  { path: '/members', labelKey: 'nav.members' },
  { path: '/events', labelKey: 'nav.events' },
  { path: '/shirts', labelKey: 'nav.shirts' },
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

  return BASE_NAV_ITEMS.filter((item) => item.path !== '/shirts' && item.path !== '/statistics');
};