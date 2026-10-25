import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Guardian } from '../types';
import type { ExistingGuardianUserOption } from '../store/selectors/guardianAssignmentSelectors';
import { selectAvailableExistingGuardianUsers } from '../store/selectors/guardianFormSelectors';
import { buildGuardianFormResult } from '../utils/guardianForm';
import { Alert, Button, ChoiceGroup, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle, Radio, RequiredFieldsNote, Stack } from './ui';
import ExistingGuardianSection from './ExistingGuardianSection';
import DocumentedGuardianSection from './DocumentedGuardianSection';

interface ManageGuardiansModalProps {
  isOpen: boolean;
  onClose: () => void;
  guardians: Guardian[];
  existingUsers: ExistingGuardianUserOption[];
  onAssign: (guardian: Guardian) => Promise<boolean>;
  editingGuardian?: Guardian | null;
  onEdit?: (guardianId: string, guardianData: Pick<Guardian, 'firstName' | 'lastName' | 'email'>) => Promise<boolean>;
}

type Mode = 'existing' | 'documented';

export default function ManageGuardiansModal({ isOpen, onClose, guardians, existingUsers, onAssign, editingGuardian = null, onEdit }: ManageGuardiansModalProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>('existing');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [existingFirstName, setExistingFirstName] = useState('');
  const [existingLastName, setExistingLastName] = useState('');
  const [existingEmail, setExistingEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [documentedEmail, setDocumentedEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = Boolean(editingGuardian);

  const availableExistingUsers = useMemo(
    () => selectAvailableExistingGuardianUsers(guardians, existingUsers, editingGuardian?.id),
    [guardians, existingUsers, editingGuardian?.id],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (editingGuardian) {
      const nextMode: Mode = editingGuardian.email ? 'existing' : 'documented';
      setMode(nextMode);
      setSelectedMemberId(editingGuardian.id || '');
      setExistingFirstName(editingGuardian.firstName || '');
      setExistingLastName(editingGuardian.lastName || '');
      setExistingEmail(editingGuardian.email || '');
      setFirstName(editingGuardian.firstName || '');
      setLastName(editingGuardian.lastName || '');
      setDocumentedEmail(editingGuardian.email || '');
      setError(null);
      setIsSubmitting(false);
      return;
    }

    reset();
  }, [isOpen, editingGuardian]);

  const reset = () => {
    setMode('existing');
    setSelectedMemberId('');
    setExistingFirstName('');
    setExistingLastName('');
    setExistingEmail('');
    setFirstName('');
    setLastName('');
    setDocumentedEmail('');
    setError(null);
    setIsSubmitting(false);
  };

  const handleSelectedExistingUserChange = (memberId: string) => {
    setSelectedMemberId(memberId);
    const user = existingUsers.find((entry) => entry.id === memberId);
    if (!user) {
      setExistingFirstName('');
      setExistingLastName('');
      setExistingEmail('');
      return;
    }

    setExistingFirstName(user.firstName || '');
    setExistingLastName(user.lastName || '');
    setExistingEmail(user.email || '');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const result = buildGuardianFormResult({
      mode,
      selectedMemberId,
      existingUsers,
      guardians,
      editingGuardian,
      existingFirstName,
      existingLastName,
      existingEmail,
      firstName,
      lastName,
      email: documentedEmail,
    });
    if (result.error || !result.guardian) {
      setError(t(`page.guardians.errors.${result.error ?? 'documentedNameRequired'}`));
      return;
    }

    const guardian = result.guardian;
    setIsSubmitting(true);
    const success = isEditMode && editingGuardian && onEdit
      ? await onEdit(editingGuardian.id, {
          firstName: guardian.firstName,
          lastName: guardian.lastName,
          email: guardian.email,
        })
      : await onAssign(guardian);
    if (success) {
      handleClose();
    } else {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalHeader>
        <ModalTitle>{isEditMode ? t('page.guardians.editTitle') : t('page.guardians.assignTitle')}</ModalTitle>
      </ModalHeader>

      <form onSubmit={handleSubmit}>
        <ModalBody>
          <Stack>
            <RequiredFieldsNote />
            <ChoiceGroup>
              <label className="checkbox-label">
                <Radio
                  name="guardianMode"
                  value="existing"
                  checked={mode === 'existing'}
                  onChange={() => {
                    setMode('existing');
                    setError(null);
                  }}
                />
                {t('page.guardians.existingUser')}
              </label>
              <label className="checkbox-label">
                <Radio
                  name="guardianMode"
                  value="documented"
                  checked={mode === 'documented'}
                  onChange={() => {
                    setMode('documented');
                    setError(null);
                  }}
                />
                {t('page.guardians.newGuardian')}
              </label>
            </ChoiceGroup>

            {mode === 'existing' ? (
              <ExistingGuardianSection
                availableUsers={availableExistingUsers}
                selectedMemberId={selectedMemberId}
                isEditMode={isEditMode}
                firstName={existingFirstName}
                lastName={existingLastName}
                email={existingEmail}
                onSelect={handleSelectedExistingUserChange}
                onFirstNameChange={setExistingFirstName}
                onLastNameChange={setExistingLastName}
                onEmailChange={setExistingEmail}
              />
            ) : (
              <DocumentedGuardianSection
                firstName={firstName}
                lastName={lastName}
                email={documentedEmail}
                onFirstNameChange={setFirstName}
                onLastNameChange={setLastName}
                onEmailChange={setDocumentedEmail}
              />
            )}

            {error && <Alert>{error}</Alert>}
          </Stack>
        </ModalBody>

        <ModalFooter>
          <Button type="button" variant="secondary" onClick={handleClose}>
            {t('common.actions.cancel')}
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isEditMode ? t('common.actions.save') : t('page.guardians.assignAction')}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
