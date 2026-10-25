import type { ExistingGuardianUserOption } from '../store/selectors/guardianAssignmentSelectors';
import type { Guardian } from '../types';
import { hasDuplicateGuardian } from './guardians';

export type GuardianFormMode = 'existing' | 'documented';
export type GuardianFormError = 'selectExistingUser' | 'alreadyAssigned' | 'documentedNameRequired' | 'documentedDuplicate';

export interface GuardianFormResult {
  error: GuardianFormError | null;
  guardian: Guardian | null;
}

interface BuildGuardianFormInput {
  mode: GuardianFormMode;
  selectedMemberId?: string;
  existingUsers: ExistingGuardianUserOption[];
  guardians: Guardian[];
  editingGuardian?: Guardian | null;
  existingFirstName?: string;
  existingLastName?: string;
  existingEmail?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  createId?: () => string;
}

export function buildGuardianFormResult({
  mode,
  selectedMemberId = '',
  existingUsers,
  guardians,
  editingGuardian = null,
  existingFirstName,
  existingLastName,
  existingEmail,
  firstName = '',
  lastName = '',
  email = '',
  createId = () => crypto.randomUUID(),
}: BuildGuardianFormInput): GuardianFormResult {
  const isEditMode = Boolean(editingGuardian);
  const nonCurrentGuardians = guardians.filter((guardian) => guardian.id !== editingGuardian?.id);

  if (mode === 'existing') {
    const selectedUser = existingUsers.find((entry) => entry.id === selectedMemberId);
    if (!selectedMemberId && !isEditMode || !isEditMode && !selectedUser) {
      return { error: 'selectExistingUser', guardian: null };
    }

    const candidate: Guardian = {
      id: selectedUser?.id || selectedMemberId || editingGuardian?.id || createId(),
      firstName: isEditMode
        ? (existingFirstName ?? editingGuardian?.firstName ?? '').trim()
        : selectedUser?.firstName || (existingFirstName ?? '').trim(),
      lastName: isEditMode
        ? (existingLastName ?? editingGuardian?.lastName ?? '').trim()
        : selectedUser?.lastName || (existingLastName ?? '').trim(),
      email: isEditMode
        ? ((existingEmail ?? editingGuardian?.email ?? '').trim() || undefined)
        : (selectedUser?.email || (existingEmail ?? '').trim() || undefined),
      isDocumentedOnly: false,
    };

    if (hasDuplicateGuardian(nonCurrentGuardians, candidate)) {
      return { error: 'alreadyAssigned', guardian: null };
    }

    return { error: null, guardian: candidate };
  }

  if (!firstName.trim() || !lastName.trim()) {
    return { error: 'documentedNameRequired', guardian: null };
  }

  const candidate: Guardian = {
    id: editingGuardian?.id ?? createId(),
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.trim() || undefined,
    isDocumentedOnly: true,
  };
  if (hasDuplicateGuardian(nonCurrentGuardians, candidate)) {
    return { error: 'documentedDuplicate', guardian: null };
  }

  return { error: null, guardian: candidate };
}
