import { useEffect, useMemo, useState } from 'react';
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
        setError('Please select an existing user to assign.');
        return;
      }

      if (!existingFirstName.trim() || !existingLastName.trim()) {
        setError('First name and last name are required for existing-user guardian assignment.');
        return;
      }

      if (!existingEmail.trim()) {
        setError('Email is required for existing-user guardian assignment.');
        return;
      }

      const guardian: Guardian = {
        id: selectedTrainerId || editingGuardian?.id || crypto.randomUUID(),
        userId: selectedTrainerId || editingGuardian?.userId,
        firstName: existingFirstName.trim(),
        lastName: existingLastName.trim(),
        email: existingEmail.trim(),
        isDocumentedOnly: false,
      };

      const nonCurrentGuardians = guardians.filter((existingGuardian) => existingGuardian.id !== editingGuardian?.id);
      if (hasDuplicateGuardian(nonCurrentGuardians, guardian)) {
        setError('This guardian is already assigned.');
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
      setError('First name and last name are required for documented guardians.');
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
      setError('A documented guardian with the same name is already assigned.');
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
        <ModalTitle>{isEditMode ? 'Edit Guardian' : 'Assign Guardian'}</ModalTitle>
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
                Existing user
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
                Documented only
              </label>
            </div>

            {mode === 'existing' ? (
              <div>
                <label htmlFor="guardian-existing" className="form-label">Existing user</label>
                <select
                  id="guardian-existing"
                  value={selectedTrainerId}
                  onChange={(e) => handleSelectedTrainerChange(e.target.value)}
                  className="form-select"
                  disabled={isEditMode}
                >
                  <option value="">Select user</option>
                  {availableTrainers.map((trainer) => (
                    <option key={trainer.id} value={trainer.id}>
                      {trainer.firstName} {trainer.lastName}
                    </option>
                  ))}
                </select>
                {availableTrainers.length === 0 && (
                  <p className="text-xs text-gray-500 mt-2">No available existing users to assign.</p>
                )}
                {isEditMode && (
                  <p className="text-xs text-gray-500 mt-2">User selection is locked while editing. Update name/email fields directly.</p>
                )}
                <div className="mt-3 grid grid-cols-1 gap-3">
                  <div>
                    <label htmlFor="guardian-existing-first-name" className="form-label">First Name</label>
                    <input
                      id="guardian-existing-first-name"
                      type="text"
                      value={existingFirstName}
                      onChange={(e) => setExistingFirstName(e.target.value)}
                      className="form-input"
                      placeholder="First name"
                      required={mode === 'existing'}
                    />
                  </div>
                  <div>
                    <label htmlFor="guardian-existing-last-name" className="form-label">Last Name</label>
                    <input
                      id="guardian-existing-last-name"
                      type="text"
                      value={existingLastName}
                      onChange={(e) => setExistingLastName(e.target.value)}
                      className="form-input"
                      placeholder="Last name"
                      required={mode === 'existing'}
                    />
                  </div>
                  <div>
                    <label htmlFor="guardian-existing-email" className="form-label">Email</label>
                    <input
                      id="guardian-existing-email"
                      type="email"
                      value={existingEmail}
                      onChange={(e) => setExistingEmail(e.target.value)}
                      className="form-input"
                      placeholder="Email"
                      required={mode === 'existing'}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label htmlFor="guardian-first-name" className="form-label">First Name</label>
                  <input
                    id="guardian-first-name"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="form-input"
                    placeholder="Enter first name"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="guardian-last-name" className="form-label">Last Name</label>
                  <input
                    id="guardian-last-name"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="form-input"
                    placeholder="Enter last name"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="guardian-documented-email" className="form-label">Email (optional)</label>
                  <input
                    id="guardian-documented-email"
                    type="email"
                    value={documentedEmail}
                    onChange={(e) => setDocumentedEmail(e.target.value)}
                    className="form-input"
                    placeholder="guardian@example.com"
                  />
                </div>
                <p className="text-xs text-gray-500">Documented-only guardians are contacts only and cannot log in.</p>
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
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1" disabled={isSubmitting}>
            {isEditMode ? 'Save' : 'Assign'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
