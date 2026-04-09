import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Player, PlayerStatus } from '../types';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from './ui';
import Button from './ui/Button';

interface AddPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (player: Omit<Player, 'id'>) => void;
  onUpdate?: (playerId: string, player: Omit<Player, 'id'>) => void;
  editingPlayer?: Player | null;
}

export default function AddPlayerModal({ isOpen, onClose, onSave, onUpdate, editingPlayer }: AddPlayerModalProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    level: 3,
    status: 'active' as PlayerStatus,
    preferredShirtNumber: ''
  });

  const isEditMode = Boolean(editingPlayer);

  // Load player data when editing
  useEffect(() => {
    if (editingPlayer) {
      setFormData({
        firstName: editingPlayer.firstName,
        lastName: editingPlayer.lastName,
        birthDate: editingPlayer.birthDate || '',
        level: editingPlayer.level,
        status: editingPlayer.status || 'active',
        preferredShirtNumber: editingPlayer.preferredShirtNumber?.toString() || ''
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        birthDate: '',
        level: 3,
        status: 'active',
        preferredShirtNumber: ''
      });
    }
  }, [editingPlayer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.firstName.trim() && formData.lastName.trim() && formData.birthDate) {
      const birthYear = new Date(formData.birthDate).getFullYear();
      const parsedPreferredShirtNumber = parseInt(formData.preferredShirtNumber, 10);
      const playerData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        birthYear: birthYear,
        birthDate: formData.birthDate,
        level: formData.level,
        status: formData.status,
        preferredShirtNumber: Number.isNaN(parsedPreferredShirtNumber) ? undefined : parsedPreferredShirtNumber
      };

      if (isEditMode && editingPlayer && onUpdate) {
        onUpdate(editingPlayer.id, playerData);
      } else {
        onSave(playerData);
      }
      
        // Reset form only if not editing
        if (!isEditMode) {
          setFormData({
            firstName: '',
            lastName: '',
            birthDate: '',
            level: 3,
            status: 'active',
            preferredShirtNumber: ''
          });
        }
      }
    };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: name === 'level' ? parseInt(value, 10) : value
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <ModalTitle>
          {isEditMode ? t('playerModal.editTitle') : t('playerModal.addTitle')}
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
                placeholder={t('playerModal.placeholders.firstName')}
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
                placeholder={t('playerModal.placeholders.lastName')}
              />
            </div>

            <div>
              <label htmlFor="birthDate" className="form-label">
                {t('playerModal.fields.birthDate')}
              </label>
              <input
                type="date"
                id="birthDate"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>

            <div>
              <label htmlFor="level" className="form-label">
                {t('playerModal.fields.level')}
              </label>
              <select
                id="level"
                name="level"
                value={formData.level}
                onChange={handleChange}
                className="form-select"
              >
                <option value={1}>{t('levels.1')}</option>
                <option value={2}>{t('levels.2')}</option>
                <option value={3}>{t('levels.3')}</option>
                <option value={4}>{t('levels.4')}</option>
                <option value={5}>{t('levels.5')}</option>
              </select>
            </div>

            <div>
              <label htmlFor="status" className="form-label">
                {t('common.labels.status')}
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="form-select"
              >
                <option value="active">{t('playerModal.status.active')}</option>
                <option value="trial">{t('playerModal.status.trial')}</option>
                <option value="inactive">{t('playerModal.status.inactive')}</option>
              </select>
            </div>

            <div>
              <label htmlFor="preferredShirtNumber" className="form-label">
                {t('playerModal.fields.preferredShirtNumberOptional')}
              </label>
              <input
                type="number"
                id="preferredShirtNumber"
                name="preferredShirtNumber"
                value={formData.preferredShirtNumber}
                onChange={handleChange}
                min={1}
                className="form-input"
                placeholder={t('playerModal.placeholders.preferredShirtNumber')}
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
            {isEditMode ? t('playerModal.updateAction') : t('playerModal.addAction')}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}