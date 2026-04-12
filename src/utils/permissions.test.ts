import { describe, expect, it } from 'vitest';
import { canAccessRestrictedManagement, withResolvedGroupPermissions } from './permissions';

describe('permissions utils', () => {
  it('allows access for admin role on current group', () => {
    const allowed = canAccessRestrictedManagement(
      {
        id: 'u1',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
      },
      {
        group: {
          id: 'group-1',
          name: 'Group',
          periods: [],
          trainers: [{ id: 'u1', email: 'admin@example.com' }],
        },
      },
    );

    expect(allowed).toBe(true);
  });

  it('allows access for trainer role on current group', () => {
    const allowed = canAccessRestrictedManagement(
      {
        id: 'u2',
        email: 'trainer@example.com',
        firstName: 'Trainer',
        lastName: 'User',
      },
      {
        group: {
          id: 'group-1',
          name: 'Group',
          periods: [],
          trainers: [{ id: 'u2', email: 'trainer@example.com' }],
        },
      },
    );

    expect(allowed).toBe(true);
  });

  it('denies access when user has no admin or trainer role', () => {
    const denied = canAccessRestrictedManagement(
      {
        id: 'u3',
        email: 'guardian@example.com',
        firstName: 'Guardian',
        lastName: 'User',
      },
      {
        group: {
          id: 'group-1',
          name: 'Group',
          periods: [],
          trainers: [{ id: 'coach-1', email: 'coach@example.com' }],
        },
      },
    );

    expect(denied).toBe(false);
  });

  it('denies access when no user is available', () => {
    expect(canAccessRestrictedManagement(null, { group: { id: 'group-1', name: 'Group', periods: [] } })).toBe(false);
  });

  it('denies restricted access for users without elevated membership', () => {
    const allowed = canAccessRestrictedManagement(
      {
        id: 'legacy',
        email: 'legacy@example.com',
        firstName: 'Legacy',
        lastName: 'User',
      },
      {
        group: {
          id: 'group-1',
          name: 'Group',
          periods: [],
          trainers: [{ id: 'coach-1', email: 'coach@example.com' }],
        },
      },
    );

    expect(allowed).toBe(false);
  });

  it('allows access when trainer match is found by email', () => {
    const allowed = canAccessRestrictedManagement(
      {
        id: 'u5',
        email: 'manager@example.com',
        firstName: 'Group',
        lastName: 'Manager',
      },
      {
        group: {
          id: 'group-1',
          name: 'Group',
          periods: [],
          trainers: [{ id: 'trainer-other-id', email: 'manager@example.com' }],
        },
      },
    );

    expect(allowed).toBe(true);
  });

  it('does not allow access when active group is missing', () => {
    const allowed = canAccessRestrictedManagement(
      {
        id: 'u7',
        email: 'manager2@example.com',
        firstName: 'Group',
        lastName: 'Manager',
      },
      { group: null },
    );

    expect(allowed).toBe(false);
  });

  it('allows access when current user is a group member with admin role', () => {
    const allowed = canAccessRestrictedManagement(
      {
        id: 'u10',
        email: 'member-admin@example.com',
        firstName: 'Member',
        lastName: 'Admin',
      },
      {
        group: {
          id: 'group-1',
          name: 'Group',
          periods: [],
          trainers: [],
          members: [{ id: 'u10', email: 'member-admin@example.com', roles: ['admin'] }],
        },
      },
    );

    expect(allowed).toBe(true);
  });

  it('denies access when current user is only a guardian member', () => {
    const allowed = canAccessRestrictedManagement(
      {
        id: 'u11',
        email: 'member-guardian@example.com',
        firstName: 'Member',
        lastName: 'Guardian',
      },
      {
        group: {
          id: 'group-1',
          name: 'Group',
          periods: [],
          trainers: [],
          members: [{ id: 'u11', email: 'member-guardian@example.com', roles: ['guardian'] }],
        },
      },
    );

    expect(allowed).toBe(false);
  });

  it('preserves member roles from fallback group data when the fresh payload omits members', () => {
    const resolved = withResolvedGroupPermissions(
      {
        id: 'group-1',
        name: 'Group',
        periods: [],
      },
      [
        {
          id: 'group-1',
          name: 'Group',
          periods: [],
          members: [{ id: 'u10', email: 'member-admin@example.com', roles: ['admin'] }],
        },
      ],
    );

    expect(resolved?.members).toEqual([
      { id: 'u10', email: 'member-admin@example.com', roles: ['admin'] },
    ]);
  });

  it('preserves trainers from fallback group data when the fresh payload omits trainers', () => {
    const resolved = withResolvedGroupPermissions(
      {
        id: 'group-1',
        name: 'Group',
        periods: [],
      },
      [
        {
          id: 'group-1',
          name: 'Group',
          periods: [],
          trainers: [{ id: 'u2', email: 'trainer@example.com' }],
        },
      ],
    );

    expect(resolved?.trainers).toEqual([{ id: 'u2', email: 'trainer@example.com' }]);
  });
});