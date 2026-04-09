import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Trainer } from '../types';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from './ui';
import Button from './ui/Button';

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
          {isEditMode ? t('trainerModal.editTitle') : t('trainerModal.addTitle')}
        </ModalTitle>
      </ModalHeader>

      <form onSubmit={handleSubmit}>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label htmlFor="firstName" className="form-label">
                {t('auth.firstName')}
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="form-input"
                placeholder={t('trainerModal.placeholders.firstName')}
              />
            </div>

            <div>
              <label htmlFor="lastName" className="form-label">
                {t('auth.lastName')}
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="form-input"
                placeholder={t('trainerModal.placeholders.lastName')}
              />
            </div>

            <div>
              <label htmlFor="email" className="form-label">
                {t('trainerModal.fields.emailOptional')}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                placeholder={t('trainerModal.placeholders.email')}
              />
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            {t('common.actions.cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
          >
            {isEditMode ? t('trainerModal.updateAction') : t('trainerModal.addAction')}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}