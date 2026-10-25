import type { Guardian } from '../../types';
import type { ExistingGuardianUserOption } from './guardianAssignmentSelectors';
import { hasDuplicateGuardian } from '../../utils/guardians';

export function selectAvailableExistingGuardianUsers(
  guardians: Guardian[],
  existingUsers: ExistingGuardianUserOption[],
  editingGuardianId?: string,
): ExistingGuardianUserOption[] {
  const nonCurrentGuardians = guardians.filter((guardian) => guardian.id !== editingGuardianId);
  return existingUsers.filter((existingUser) => !hasDuplicateGuardian(nonCurrentGuardians, {
    id: existingUser.id,
    firstName: existingUser.firstName,
    lastName: existingUser.lastName,
    email: existingUser.email,
    isDocumentedOnly: false,
  }));
}
