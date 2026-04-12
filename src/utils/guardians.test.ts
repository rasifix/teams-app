import { describe, expect, it } from 'vitest';
import { canManageGuardians, getPlayerAge, hasDuplicateGuardian, isPlayerUnderage } from './guardians';

describe('guardians utils', () => {
  it('computes age from birthDate', () => {
    const age = getPlayerAge({ birthDate: '2012-06-10', birthYear: 2012 }, new Date('2026-04-04'));
    expect(age).toBe(13);
  });

  it('identifies underage players', () => {
    const underage = isPlayerUnderage({ birthDate: '2010-05-15', birthYear: 2010 });
    const adult = isPlayerUnderage({ birthDate: '2000-05-15', birthYear: 2000 });
    expect(underage).toBe(true);
    expect(adult).toBe(false);
  });

  it('detects duplicate documented guardians by name', () => {
    const duplicate = hasDuplicateGuardian(
      [{ id: 'g1', firstName: 'Jane', lastName: 'Doe', isDocumentedOnly: true }],
      { id: 'g2', firstName: ' jane ', lastName: 'DOE', isDocumentedOnly: true },
    );
    expect(duplicate).toBe(true);
  });

  it('allows fallback authorization when no role data exists', () => {
    const allowed = canManageGuardians(
      { id: 'u1', email: 'a@a.com', firstName: 'A', lastName: 'B' },
      {
        id: 'group-1',
        name: 'Group',
        periods: [],
        trainers: [{ id: 'u1', email: 'a@a.com' }],
      }
    );
    expect(allowed).toBe(true);
  });

  it('denies guardian management when user is not listed as trainer', () => {
    const denied = canManageGuardians(
      {
        id: 'u2',
        email: 'b@b.com',
        firstName: 'C',
        lastName: 'D',
      },
      {
        id: 'group-1',
        name: 'Group',
        periods: [],
        trainers: [{ id: 'another-user', email: 'x@y.com' }],
      },
    );
    const allowed = canManageGuardians(
      {
        id: 'u3',
        email: 'c@c.com',
        firstName: 'E',
        lastName: 'F',
      },
      {
        id: 'group-1',
        name: 'Group',
        periods: [],
        trainers: [{ id: 'u3', email: 'c@c.com' }],
      },
    );

    expect(denied).toBe(false);
    expect(allowed).toBe(true);
  });

  it('allows guardian management for elevated group member roles', () => {
    const allowed = canManageGuardians(
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
        trainers: [],
        members: [{ id: 'u-admin', email: 'admin@example.com', roles: ['group_manager'] }],
      },
    );

    expect(allowed).toBe(true);
  });
});
