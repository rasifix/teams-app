import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Trainer } from '../types';
import { Button, Field, Input, Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter, RequiredFieldsNote, Stack } from './ui';

interface AddTrainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trainer: Omit<Trainer, 'id'>) => void;
  onUpdate?: (trainerId: string, trainer: Omit<Trainer, 'id'>) => void;
  editingTrainer?: Trainer | null;
}

export default function AddTrainerModal({ isOpen, onClose, onSave, onUpdate, editingTrainer }: AddTrainerModalProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });

  const isEditMode = Boolean(editingTrainer);

  // Load trainer data when editing
  useEffect(() => {
    if (editingTrainer) {
      setFormData({
        firstName: editingTrainer.firstName,
        lastName: editingTrainer.lastName,
        email: editingTrainer.email ?? ''
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        email: ''
      });
    }
  }, [editingTrainer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.firstName.trim() && formData.lastName.trim()) {
      const trainerPayload: Omit<Trainer, 'id'> = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        ...(formData.email.trim() ? { email: formData.email.trim() } : {}),
      };

      if (isEditMode && editingTrainer && onUpdate) {
        onUpdate(editingTrainer.id, trainerPayload);
      } else {
        onSave(trainerPayload);
      }
      
      // Reset form only if not editing
      if (!isEditMode) {
        setFormData({
          firstName: '',
          lastName: '',
          email: ''
        });
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <ModalTitle>
          {isEditMode ? t('page.trainerModal.editTitle') : t('page.trainerModal.addTitle')}
        </ModalTitle>
      </ModalHeader>

      <form onSubmit={handleSubmit}>
        <ModalBody>
          <Stack>
            <RequiredFieldsNote />
            <Field label={t('auth.firstName')} htmlFor="firstName" required>
              <Input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                placeholder={t('domain.member.placeholders.firstName')}
              />
            </Field>

            <Field label={t('auth.lastName')} htmlFor="lastName" required>
              <Input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                placeholder={t('domain.member.placeholders.lastName')}
              />
            </Field>

            <Field label={t('domain.member.fields.email')} htmlFor="email">
              <Input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={t('domain.member.placeholders.email')}
              />
            </Field>
          </Stack>
        </ModalBody>

        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            {t('common.actions.cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
          >
            {isEditMode ? t('page.trainerModal.updateAction') : t('page.trainerModal.addAction')}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
