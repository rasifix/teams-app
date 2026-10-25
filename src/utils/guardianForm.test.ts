import { describe, expect, it } from 'vitest';
import type { Guardian } from '../types';
import { buildGuardianFormResult } from './guardianForm';

const guardian = (overrides: Partial<Guardian> = {}): Guardian => ({
  id: 'guardian-1', firstName: 'Alex', lastName: 'Parent', email: 'alex@example.com', isDocumentedOnly: false, ...overrides,
});

describe('guardian form decisions', () => {
  describe('buildGuardianFormResult', () => {
    it('requires an existing user selection for a new linked guardian', () => {
      expect(buildGuardianFormResult({ mode: 'existing', selectedMemberId: '', existingUsers: [], guardians: [] })).toMatchObject({
        error: 'selectExistingUser', guardian: null,
      });
    });

    it('rejects a linked guardian already assigned by email', () => {
      expect(buildGuardianFormResult({
        mode: 'existing', selectedMemberId: 'new-user',
        existingUsers: [{ id: 'new-user', firstName: 'Alex', lastName: 'Parent', email: 'alex@example.com', source: 'guardian' }], guardians: [guardian()],
      })).toMatchObject({ error: 'alreadyAssigned', guardian: null });
    });

    it('requires both names for a documented guardian', () => {
      expect(buildGuardianFormResult({ mode: 'documented', firstName: ' Pat ', lastName: ' ', existingUsers: [], guardians: [] }))
        .toMatchObject({ error: 'documentedNameRequired', guardian: null });
    });

    it('builds a documented guardian from trimmed values and rejects duplicate documented names', () => {
      const result = buildGuardianFormResult({
        mode: 'documented', firstName: '  Pat ', lastName: ' Parent  ', email: '  pat@example.com ',
        existingUsers: [], guardians: [], createId: () => 'new-id',
      });
      expect(result).toEqual({ error: null, guardian: {
        id: 'new-id', firstName: 'Pat', lastName: 'Parent', email: 'pat@example.com', isDocumentedOnly: true,
      } });

      expect(buildGuardianFormResult({
        mode: 'documented', firstName: ' Pat', lastName: 'Parent ', existingUsers: [], guardians: [guardian({ firstName: 'Pat', lastName: 'Parent', isDocumentedOnly: true })],
      })).toMatchObject({ error: 'documentedDuplicate', guardian: null });
    });

    it('uses the selected existing user identity and excludes the editing guardian from duplicate checks', () => {
      const current = guardian({ id: 'editing' });
      const result = buildGuardianFormResult({
        mode: 'existing', selectedMemberId: current.id, existingUsers: [{ id: current.id, firstName: current.firstName, lastName: current.lastName, email: current.email, source: 'guardian' }],
        guardians: [current], editingGuardian: current,
      });

      expect(result).toEqual({ error: null, guardian: current });
    });
  });
});
