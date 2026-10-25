import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Field, Input, Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter, RequiredFieldsNote, Select, Stack } from './ui';

interface EditTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, strength: number, startTime: string | undefined, location?: string, meetingTime?: string, meetingLocation?: string) => void;
  currentName: string;
  currentStrength: number;
  currentStartTime?: string;
  currentLocation?: string;
  currentMeetingTime?: string;
  currentMeetingLocation?: string;
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
  currentMeetingTime,
  currentMeetingLocation,
  showActivityOverrides = true,
}: EditTeamModalProps) {
  const { t } = useTranslation();
  const [teamName, setTeamName] = useState(currentName);
  const [strength, setStrength] = useState(currentStrength);
  const [startTime, setStartTime] = useState(currentStartTime);
  const [location, setLocation] = useState(currentLocation || '');
  const [meetingTime, setMeetingTime] = useState(currentMeetingTime || '');
  const [meetingLocation, setMeetingLocation] = useState(currentMeetingLocation || '');

  useEffect(() => {
    setTeamName(currentName);
    setStrength(currentStrength);
    setStartTime(currentStartTime);
    setLocation(currentLocation || '');
    setMeetingTime(currentMeetingTime || '');
    setMeetingLocation(currentMeetingLocation || '');
  }, [currentName, currentStrength, currentStartTime, currentLocation, currentMeetingTime, currentMeetingLocation, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (teamName.trim()) {
      const normalizedLocation = location.trim();
      onSave(teamName.trim(), strength, startTime || undefined, normalizedLocation || undefined, meetingTime || undefined, meetingLocation.trim() || undefined);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <ModalTitle>{t('page.teamModal.editTitle')}</ModalTitle>
      </ModalHeader>

      <form onSubmit={handleSubmit}>
        <ModalBody>
          <Stack>
            <RequiredFieldsNote />
            <Field label={t('domain.team.fields.name')} htmlFor="teamName" required>
              <Input
                type="text"
                id="teamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                required
                placeholder={t('domain.team.placeholders.name')}
                autoFocus
              />
            </Field>

            <Field label={t('domain.team.fields.strength')} htmlFor="strength">
              <Select
                id="strength"
                value={strength}
                onChange={(e) => setStrength(parseInt(e.target.value))}
              >
                <option value={1}>{t('domain.team.strength.highest')}</option>
                <option value={2}>{t('domain.team.strength.medium')}</option>
                <option value={3}>{t('domain.team.strength.lowest')}</option>
              </Select>
            </Field>

            {showActivityOverrides && <Field label={t('domain.team.fields.startTime')} htmlFor="startTime">
              <Input
                type="time"
                id="startTime"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </Field>}

            {showActivityOverrides && <Field label={t('domain.team.fields.location')} htmlFor="location">
              <Input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t('domain.team.placeholders.location')}
              />
            </Field>}

            <Field label={t('domain.team.fields.meetingTime')} htmlFor="meetingTime">
              <Input type="time" id="meetingTime" value={meetingTime} onChange={(e) => setMeetingTime(e.target.value)} />
            </Field>
            <Field label={t('domain.team.fields.meetingLocation')} htmlFor="meetingLocation">
              <Input type="text" id="meetingLocation" value={meetingLocation} onChange={(e) => setMeetingLocation(e.target.value)} placeholder={t('domain.team.placeholders.meetingLocation')} />
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
            {t('common.actions.save')}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
