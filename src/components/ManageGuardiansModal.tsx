import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Guardian, Trainer } from '../types';
import { hasDuplicateGuardian } from '../utils/guardians';
import { Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from './ui';
import Button from './ui/Button';

interface ManageGuardiansModalProps {
  isOpen: boolean;
  onClose: () => void;
  guardians: Guardian[];
  trainers: Trainer[];
  onAssign: (guardian: Guardian) => Promise<boolean>;
  editingGuardian?: Guardian | null;
  onEdit?: (guardianId: string, guardianData: Pick<Guardian, 'firstName' | 'lastName' | 'email'>) => Promise<boolean>;
}

type Mode = 'existing' | 'documented';

export default function ManageGuardiansModal({ isOpen, onClose, guardians, trainers, onAssign, editingGuardian = null, onEdit }: ManageGuardiansModalProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>('existing');
  const [selectedTrainerId, setSelectedTrainerId] = useState('');
  const [existingFirstName, setExistingFirstName] = useState('');
  const [existingLastName, setExistingLastName] = useState('');
  const [existingEmail, setExistingEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [documentedEmail, setDocumentedEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = Boolean(editingGuardian);

  const availableTrainers = useMemo(() => {
    const nonCurrentGuardians = guardians.filter((guardian) => guardian.id !== editingGuardian?.id);
    return trainers.filter((trainer) => !hasDuplicateGuardian(nonCurrentGuardians, {
      id: trainer.id,
      userId: trainer.id,
      firstName: trainer.firstName,
      lastName: trainer.lastName,
      email: trainer.email,
      isDocumentedOnly: false,
    }));
  }, [guardians, trainers, editingGuardian?.id]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (editingGuardian) {
      const nextMode: Mode = editingGuardian.email ? 'existing' : 'documented';
      setMode(nextMode);
      setSelectedTrainerId(editingGuardian.userId || '');
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
    setSelectedTrainerId('');
    setExistingFirstName('');
    setExistingLastName('');
    setExistingEmail('');
    setFirstName('');
    setLastName('');
    setDocumentedEmail('');
    setError(null);
    setIsSubmitting(false);
  };

  const handleSelectedTrainerChange = (trainerId: string) => {
    setSelectedTrainerId(trainerId);
    const trainer = trainers.find((entry) => entry.id === trainerId);
    if (!trainer) {
      setExistingFirstName('');
      setExistingLastName('');
      setExistingEmail('');
      return;
    }

    setExistingFirstName(trainer.firstName || '');
    setExistingLastName(trainer.lastName || '');
    setExistingEmail(trainer.email || '');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (mode === 'existing') {
      if (!selectedTrainerId && !isEditMode) {
        setError(t('guardians.errors.selectExistingUser'));
        return;
      }

      const selectedTrainer = trainers.find((trainer) => trainer.id === selectedTrainerId);

      if (!isEditMode && !selectedTrainer) {
        setError(t('guardians.errors.selectExistingUser'));
        return;
      }

      const guardian: Guardian = {
        id: selectedTrainer?.id || selectedTrainerId || editingGuardian?.id || crypto.randomUUID(),
        userId: selectedTrainer?.id || selectedTrainerId || editingGuardian?.userId,
        firstName: selectedTrainer?.firstName || existingFirstName.trim(),
        lastName: selectedTrainer?.lastName || existingLastName.trim(),
        email: selectedTrainer?.email || existingEmail.trim() || undefined,
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
          <div className="space-y-4">
            <div className="flex gap-4">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="radio"
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
              <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="guardianMode"
                  value="documented"
                  checked={mode === 'documented'}
                  onChange={() => {
                    setMode('documented');
                    setError(null);
                  }}
                />
                {t('guardians.documentedOnly')}
              </label>
            </div>

            {mode === 'existing' ? (
              <div>
                <label htmlFor="guardian-existing" className="form-label">{t('guardians.existingUser')}</label>
                <select
                  id="guardian-existing"
                  value={selectedTrainerId}
                  onChange={(e) => handleSelectedTrainerChange(e.target.value)}
                  className="form-select"
                  disabled={isEditMode}
                >
                  <option value="">{t('guardians.selectUser')}</option>
                  {availableTrainers.map((trainer) => (
                    <option key={trainer.id} value={trainer.id}>
                      {trainer.firstName} {trainer.lastName}
                    </option>
                  ))}
                </select>
                {availableTrainers.length === 0 && (
                  <p className="text-xs text-gray-500 mt-2">{t('guardians.noAvailableUsers')}</p>
                )}
                {isEditMode && (
                  <p className="text-xs text-gray-500 mt-2">{t('guardians.selectionLocked')}</p>
                )}
                {isEditMode && (
                <div className="mt-3 grid grid-cols-1 gap-3">
                  <div>
                    <label htmlFor="guardian-existing-first-name" className="form-label">{t('auth.firstName')}</label>
                    <input
                      id="guardian-existing-first-name"
                      type="text"
                      value={existingFirstName}
                      onChange={(e) => setExistingFirstName(e.target.value)}
                      className="form-input"
                      placeholder={t('auth.firstName')}
                      required={mode === 'existing'}
                    />
                  </div>
                  <div>
                    <label htmlFor="guardian-existing-last-name" className="form-label">{t('auth.lastName')}</label>
                    <input
                      id="guardian-existing-last-name"
                      type="text"
                      value={existingLastName}
                      onChange={(e) => setExistingLastName(e.target.value)}
                      className="form-input"
                      placeholder={t('auth.lastName')}
                      required={mode === 'existing'}
                    />
                  </div>
                  <div>
                    <label htmlFor="guardian-existing-email" className="form-label">{t('auth.emailAddress')}</label>
                    <input
                      id="guardian-existing-email"
                      type="email"
                      value={existingEmail}
                      onChange={(e) => setExistingEmail(e.target.value)}
                      className="form-input"
                      placeholder={t('auth.emailAddress')}
                      required={mode === 'existing'}
                    />
                  </div>
                </div>
                )}
              </div>
            ) : (
              <>
                <div>
                  <label htmlFor="guardian-first-name" className="form-label">{t('auth.firstName')}</label>
                  <input
                    id="guardian-first-name"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="form-input"
                    placeholder={t('guardians.placeholderFirstName')}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="guardian-last-name" className="form-label">{t('auth.lastName')}</label>
                  <input
                    id="guardian-last-name"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="form-input"
                    placeholder={t('guardians.placeholderLastName')}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="guardian-documented-email" className="form-label">{t('guardians.emailOptional')}</label>
                  <input
                    id="guardian-documented-email"
                    type="email"
                    value={documentedEmail}
                    onChange={(e) => setDocumentedEmail(e.target.value)}
                    className="form-input"
                    placeholder={t('guardians.placeholderEmail')}
                  />
                </div>
                <p className="text-xs text-gray-500">{t('guardians.documentedHint')}</p>
              </>
            )}

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>
        </ModalBody>

        <ModalFooter>
          <Button type="button" variant="secondary" onClick={handleClose} className="flex-1">
            {t('common.actions.cancel')}
          </Button>
          <Button type="submit" variant="primary" className="flex-1" disabled={isSubmitting}>
            {isEditMode ? t('common.actions.save') : t('guardians.assignAction')}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
