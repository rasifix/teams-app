import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { CreateGroupRequest } from '../types';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from './ui';
import Button from './ui/Button';

interface AddGroupModalProps {
  isOpen: boolean;
  isSubmitting?: boolean;
  error?: string | null;
  onClose: () => void;
  onSave: (group: CreateGroupRequest) => Promise<void>;
}

export default function AddGroupModal({
  isOpen,
  isSubmitting = false,
  error,
  onClose,
  onSave,
}: AddGroupModalProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<CreateGroupRequest>({
    name: '',
    description: '',
    club: '',
  });
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: '',
        description: '',
        club: '',
      });
      setNameError(null);
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === 'name' && value.trim()) {
      setNameError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      setNameError(t('groupModal.errors.nameRequired'));
      return;
    }

    const payload: CreateGroupRequest = {
      name: trimmedName,
      description: formData.description?.trim() || undefined,
      club: formData.club?.trim() || undefined,
    };

    await onSave(payload);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <ModalTitle>{t('groupModal.title')}</ModalTitle>
      </ModalHeader>

      <form onSubmit={handleSubmit}>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="form-label">
                {t('groupModal.fields.groupName')}
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="form-input"
                placeholder={t('groupModal.placeholders.groupName')}
              />
              {nameError && (
                <p className="mt-1 text-sm text-red-600">{nameError}</p>
              )}
            </div>

            <div>
              <label htmlFor="club" className="form-label">
                {t('groupModal.fields.clubOptional')}
              </label>
              <input
                type="text"
                id="club"
                name="club"
                value={formData.club ?? ''}
                onChange={handleChange}
                className="form-input"
                placeholder={t('groupModal.placeholders.club')}
              />
            </div>

            <div>
              <label htmlFor="description" className="form-label">
                {t('groupModal.fields.descriptionOptional')}
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description ?? ''}
                onChange={handleChange}
                className="form-input min-h-24"
                placeholder={t('groupModal.placeholders.description')}
              />
            </div>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
            disabled={isSubmitting}
          >
            {t('common.actions.cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            disabled={isSubmitting}
          >
            {isSubmitting ? t('groupModal.creating') : t('groupModal.createAction')}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
