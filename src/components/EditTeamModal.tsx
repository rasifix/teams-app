import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Field, Input, Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter, RequiredFieldsNote, Select, Stack } from './ui';

interface EditTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, strength: number, startTime: string | undefined, location?: string) => void;
  currentName: string;
  currentStrength: number;
  currentStartTime?: string;
  currentLocation?: string;
  showActivityOverrides?: boolean;
}

export default function EditTeamModal({ 
  isOpen, 
  onClose, 
  onSave, 
  currentName,
  currentStrength,
  currentStartTime,
  currentLocation,
  showActivityOverrides = true,
}: EditTeamModalProps) {
  const { t } = useTranslation();
  const [teamName, setTeamName] = useState(currentName);
  const [strength, setStrength] = useState(currentStrength);
  const [startTime, setStartTime] = useState(currentStartTime);
  const [location, setLocation] = useState(currentLocation || '');

  useEffect(() => {
    setTeamName(currentName);
    setStrength(currentStrength);
    setStartTime(currentStartTime);
    setLocation(currentLocation || '');
  }, [currentName, currentStrength, currentStartTime, currentLocation, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (teamName.trim()) {
      const normalizedLocation = location.trim();
      onSave(teamName.trim(), strength, startTime || undefined, normalizedLocation || undefined);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <ModalTitle>{t('teamModal.editTitle')}</ModalTitle>
      </ModalHeader>

      <form onSubmit={handleSubmit}>
        <ModalBody>
          <Stack>
            <RequiredFieldsNote />
            <Field label={t('teamModal.fields.teamName')} htmlFor="teamName" required>
              <Input
                type="text"
                id="teamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                required
                placeholder={t('teamModal.placeholders.teamName')}
                autoFocus
              />
            </Field>

            <Field label={t('teamModal.fields.strength')} htmlFor="strength">
              <Select
                id="strength"
                value={strength}
                onChange={(e) => setStrength(parseInt(e.target.value))}
              >
                <option value={1}>{t('teamModal.strength.highest')}</option>
                <option value={2}>{t('teamModal.strength.medium')}</option>
                <option value={3}>{t('teamModal.strength.lowest')}</option>
              </Select>
            </Field>

            {showActivityOverrides && <Field label={t('teamModal.fields.startTime')} htmlFor="startTime">
              <Input
                type="time"
                id="startTime"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </Field>}

            {showActivityOverrides && <Field label={t('teamModal.fields.locationOptional')} htmlFor="location">
              <Input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t('teamModal.placeholders.location')}
              />
            </Field>}
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
            {t('common.actions.save')}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
