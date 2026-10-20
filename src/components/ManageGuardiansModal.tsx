import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Guardian } from '../types';
import type { ExistingGuardianUserOption } from '../store/selectors/guardianAssignmentSelectors';
import { hasDuplicateGuardian } from '../utils/guardians';
import { Alert, Button, ChoiceGroup, FieldLabel, Input, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle, Radio, RequiredFieldsNote, RequiredMark, Select, Stack } from './ui';

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

  const availableExistingUsers = useMemo(() => {
    const nonCurrentGuardians = guardians.filter((guardian) => guardian.id !== editingGuardian?.id);
    return existingUsers.filter((existingUser) => !hasDuplicateGuardian(nonCurrentGuardians, {
      id: existingUser.id,
      firstName: existingUser.firstName,
      lastName: existingUser.lastName,
      email: existingUser.email,
      isDocumentedOnly: false,
    }));
  }, [guardians, existingUsers, editingGuardian?.id]);

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

    if (mode === 'existing') {
      if (!selectedMemberId && !isEditMode) {
        setError(t('guardians.errors.selectExistingUser'));
        return;
      }

      const selectedUser = existingUsers.find((entry) => entry.id === selectedMemberId);

      if (!isEditMode && !selectedUser) {
        setError(t('guardians.errors.selectExistingUser'));
        return;
      }

      const guardian: Guardian = {
        id: selectedUser?.id || selectedMemberId || editingGuardian?.id || crypto.randomUUID(),
        firstName: isEditMode ? existingFirstName.trim() : (selectedUser?.firstName || existingFirstName.trim()),
        lastName: isEditMode ? existingLastName.trim() : (selectedUser?.lastName || existingLastName.trim()),
        email: isEditMode ? (existingEmail.trim() || undefined) : (selectedUser?.email || existingEmail.trim() || undefined),
        isDocumentedOnly: false,
      };

      const nonCurrentGuardians = guardians.filter((existingGuardian) => existingGuardian.id !== editingGuardian?.id);
      if (hasDuplicateGuardian(nonCurrentGuardians, guardian)) {
        setError(t('guardians.errors.alreadyAssigned'));
        return;
      }

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
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      setError(t('guardians.errors.documentedNameRequired'));
      return;
    }

    const guardian: Guardian = {
      id: crypto.randomUUID(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: documentedEmail.trim() || undefined,
      isDocumentedOnly: true,
    };

    const nonCurrentGuardians = guardians.filter((existingGuardian) => existingGuardian.id !== editingGuardian?.id);
    if (hasDuplicateGuardian(nonCurrentGuardians, guardian)) {
      setError(t('guardians.errors.documentedDuplicate'));
      return;
    }

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
        <ModalTitle>{isEditMode ? t('guardians.editTitle') : t('guardians.assignTitle')}</ModalTitle>
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
                {t('guardians.existingUser')}
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
                {t('guardians.newGuardian')}
              </label>
            </ChoiceGroup>

            {mode === 'existing' ? (
              <div>
                <FieldLabel htmlFor="guardian-existing">{t('guardians.existingUser')}{!isEditMode && <RequiredMark />}</FieldLabel>
                <Select
                  id="guardian-existing"
                  value={selectedMemberId}
                  onChange={(e) => handleSelectedExistingUserChange(e.target.value)}
                  disabled={isEditMode}
                >
                  <option value="">{t('guardians.selectUser')}</option>
                  {availableExistingUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </option>
                  ))}
                </Select>
                {availableExistingUsers.length === 0 && (
                  <p className="field-help">{t('guardians.noAvailableUsers')}</p>
                )}
                {isEditMode && (
                  <p className="field-help">{t('guardians.selectionLocked')}</p>
                )}
                {isEditMode && (
                <Stack gap="sm" className="guardian-edit-fields">
                  <div>
                    <FieldLabel htmlFor="guardian-existing-first-name">{t('auth.firstName')}<RequiredMark /></FieldLabel>
                    <Input
                      id="guardian-existing-first-name"
                      type="text"
                      value={existingFirstName}
                      onChange={(e) => setExistingFirstName(e.target.value)}
                      placeholder={t('auth.firstName')}
                      required={mode === 'existing'}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="guardian-existing-last-name">{t('auth.lastName')}<RequiredMark /></FieldLabel>
                    <Input
                      id="guardian-existing-last-name"
                      type="text"
                      value={existingLastName}
                      onChange={(e) => setExistingLastName(e.target.value)}
                      placeholder={t('auth.lastName')}
                      required={mode === 'existing'}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="guardian-existing-email">{t('auth.emailAddress')}<RequiredMark /></FieldLabel>
                    <Input
                      id="guardian-existing-email"
                      type="email"
                      value={existingEmail}
                      onChange={(e) => setExistingEmail(e.target.value)}
                      placeholder={t('auth.emailAddress')}
                      required={mode === 'existing'}
                    />
                  </div>
                </Stack>
                )}
              </div>
            ) : (
              <>
                <div>
                  <FieldLabel htmlFor="guardian-first-name">{t('auth.firstName')}<RequiredMark /></FieldLabel>
                  <Input
                    id="guardian-first-name"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder={t('guardians.placeholderFirstName')}
                    required
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="guardian-last-name">{t('auth.lastName')}<RequiredMark /></FieldLabel>
                  <Input
                    id="guardian-last-name"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder={t('guardians.placeholderLastName')}
                    required
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="guardian-documented-email">{t('guardians.emailOptional')}</FieldLabel>
                  <Input
                    id="guardian-documented-email"
                    type="email"
                    value={documentedEmail}
                    onChange={(e) => setDocumentedEmail(e.target.value)}
                    placeholder={t('guardians.placeholderEmail')}
                  />
                </div>
                <p className="field-help">{t('guardians.documentedHint')}</p>
              </>
            )}

            {error && <Alert>{error}</Alert>}
          </Stack>
        </ModalBody>

        <ModalFooter>
          <Button type="button" variant="secondary" onClick={handleClose}>
            {t('common.actions.cancel')}
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isEditMode ? t('common.actions.save') : t('guardians.assignAction')}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
