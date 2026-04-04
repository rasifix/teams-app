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
    const allowed = canManageGuardians({ id: 'u1', email: 'a@a.com', firstName: 'A', lastName: 'B' }, 'group-1');
    expect(allowed).toBe(true);
  });

  it('enforces group manager role when role data is present', () => {
    const denied = canManageGuardians(
      {
        id: 'u2',
        email: 'b@b.com',
        firstName: 'C',
        lastName: 'D',
        roles: ['trainer'],
      },
      'group-1',
    );
    const allowed = canManageGuardians(
      {
        id: 'u3',
        email: 'c@c.com',
        firstName: 'E',
        lastName: 'F',
        groupRoles: { 'group-1': ['group_manager'] },
      },
      'group-1',
    );

    expect(denied).toBe(false);
    expect(allowed).toBe(true);
  });
});
