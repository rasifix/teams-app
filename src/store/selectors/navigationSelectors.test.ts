import { describe, expect, it } from 'vitest';
import { selectHeaderNavItems } from './navigationSelectors';

describe('navigation selectors', () => {
  it('shows all navigation items for admins', () => {
    const items = selectHeaderNavItems(
      {
        id: 'u-admin',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
      },
      {
        id: 'group-1',
        name: 'Group',
        periods: [],
        trainers: [{ id: 'u-admin', email: 'admin@example.com' }],
      },
    );

    expect(items.map((item) => item.path)).toEqual(['/members', '/events', '/shirts', '/statistics']);
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
        id: 'group-1',
        name: 'Group',
        periods: [],
        trainers: [{ id: 'u-trainer', email: 'trainer@example.com' }],
      },
    );

    expect(items.map((item) => item.path)).toEqual(['/members', '/events', '/shirts', '/statistics']);
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
        id: 'group-1',
        name: 'Group',
        periods: [],
        trainers: [{ id: 'u-trainer', email: 'trainer@example.com' }],
      },
    );

    expect(items.map((item) => item.path)).toEqual(['/members', '/events']);
  });
});