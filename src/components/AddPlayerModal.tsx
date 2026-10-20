import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Player, PlayerStatus } from '../types';
import { Button, Field, Input, Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter, RequiredFieldsNote, Select, Stack } from './ui';

interface AddPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (player: Omit<Player, 'id'>) => void;
  onUpdate?: (playerId: string, player: Omit<Player, 'id'>) => void;
  editingPlayer?: Player | null;
  syncedFieldsReadOnly?: boolean;
}

export default function AddPlayerModal({ isOpen, onClose, onSave, onUpdate, editingPlayer, syncedFieldsReadOnly = false }: AddPlayerModalProps) {
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
      const parsedPreferredShirtNumber = parseInt(formData.preferredShirtNumber, 10);
      const playerData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
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
                disabled={syncedFieldsReadOnly}
                placeholder={t('playerModal.placeholders.firstName')}
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
                disabled={syncedFieldsReadOnly}
                placeholder={t('playerModal.placeholders.lastName')}
              />
            </Field>

            <Field label={t('playerModal.fields.birthDate')} htmlFor="birthDate" required>
              <Input
                type="date"
                id="birthDate"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                required
                disabled={syncedFieldsReadOnly}
              />
            </Field>

            <Field label={t('playerModal.fields.level')} htmlFor="level">
              <Select
                id="level"
                name="level"
                value={formData.level}
                onChange={handleChange}
              >
                <option value={1}>{t('levels.1')}</option>
                <option value={2}>{t('levels.2')}</option>
                <option value={3}>{t('levels.3')}</option>
                <option value={4}>{t('levels.4')}</option>
                <option value={5}>{t('levels.5')}</option>
              </Select>
            </Field>

            <Field label={t('common.labels.status')} htmlFor="status">
              <Select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="active">{t('playerModal.status.active')}</option>
                <option value="trial">{t('playerModal.status.trial')}</option>
                <option value="inactive">{t('playerModal.status.inactive')}</option>
              </Select>
            </Field>

            <Field label={t('playerModal.fields.preferredShirtNumberOptional')} htmlFor="preferredShirtNumber">
              <Input
                type="number"
                id="preferredShirtNumber"
                name="preferredShirtNumber"
                value={formData.preferredShirtNumber}
                onChange={handleChange}
                min={1}
                placeholder={t('playerModal.placeholders.preferredShirtNumber')}
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
            {isEditMode ? t('playerModal.updateAction') : t('playerModal.addAction')}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
