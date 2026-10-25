import { describe, expect, it } from 'vitest';
import type { Guardian } from '../../types';
import type { ExistingGuardianUserOption } from './guardianAssignmentSelectors';
import { selectAvailableExistingGuardianUsers } from './guardianFormSelectors';

const guardian = (overrides: Partial<Guardian> = {}): Guardian => ({
  id: 'guardian-1', firstName: 'Alex', lastName: 'Parent', email: 'alex@example.com', isDocumentedOnly: false, ...overrides,
});

const user = (overrides: Partial<ExistingGuardianUserOption> = {}): ExistingGuardianUserOption => ({
  id: 'user-1', firstName: 'Alex', lastName: 'Parent', email: 'alex@example.com', source: 'guardian', ...overrides,
});

describe('selectAvailableExistingGuardianUsers', () => {
  it('excludes users already assigned by id or email and keeps unrelated users', () => {
    const options = [
      user({ id: 'linked-id', firstName: 'Linked', email: 'linked@example.com' }),
      user({ id: 'linked-email', firstName: 'Email', email: 'same@example.com' }),
      user({ id: 'available', firstName: 'Available', email: 'available@example.com' }),
    ];
    const assigned = [
      guardian({ id: 'linked-id', firstName: 'Linked', email: 'other@example.com' }),
      guardian({ id: 'other-id', firstName: 'Other', email: 'same@example.com' }),
    ];

    expect(selectAvailableExistingGuardianUsers(assigned, options).map(({ id }) => id)).toEqual(['available']);
  });

  it('keeps the guardian being edited selectable while excluding other assigned duplicates', () => {
    const current = guardian({ id: 'current' });
    const other = guardian({ id: 'other', firstName: 'Taylor', email: 'taylor@example.com' });
    const options = [
      user({ id: 'current' }),
      user({ id: 'other', firstName: 'Taylor', email: 'taylor@example.com' }),
      user({ id: 'available', email: 'new@example.com' }),
    ];

    expect(selectAvailableExistingGuardianUsers([current, other], options, current.id).map(({ id }) => id)).toEqual(['current', 'available']);
  });
});
