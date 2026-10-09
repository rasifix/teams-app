import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from './ui';
import Button from './ui/Button';
import { usePlayers, useTrainers } from '../store';
import { selectTeamAssigneeOptions } from '../store/selectors/teamTrainerSelectors';

interface EditTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, strength: number, startTime: string | undefined, responsiblePersonIds: string[], location?: string) => void;
  currentName: string;
  currentStrength: number;
  currentStartTime?: string;
  currentResponsiblePersonIds?: string[];
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
  currentResponsiblePersonIds,
  currentLocation,
  showActivityOverrides = true,
}: EditTeamModalProps) {
  const { t } = useTranslation();
  const [teamName, setTeamName] = useState(currentName);
  const [strength, setStrength] = useState(currentStrength);
  const [startTime, setStartTime] = useState(currentStartTime);
  const [responsiblePersonIds, setResponsiblePersonIds] = useState<string[]>(currentResponsiblePersonIds || []);
  const [location, setLocation] = useState(currentLocation || '');

  const { players } = usePlayers();
  const { trainers } = useTrainers();
  const memberOptions = useMemo(
    () => selectTeamAssigneeOptions(trainers, players),
    [trainers, players]
  );

  useEffect(() => {
    setTeamName(currentName);
    setStrength(currentStrength);
    setStartTime(currentStartTime);
    setResponsiblePersonIds(currentResponsiblePersonIds || []);
    setLocation(currentLocation || '');
  }, [currentName, currentStrength, currentStartTime, currentResponsiblePersonIds, currentLocation, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (teamName.trim()) {
      const normalizedLocation = location.trim();
      onSave(teamName.trim(), strength, startTime || undefined, responsiblePersonIds, normalizedLocation || undefined);
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
          <div className="space-y-4">
            <div>
              <label htmlFor="teamName" className="form-label">
                {t('teamModal.fields.teamName')}
              </label>
              <input
                type="text"
                id="teamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                required
                className="form-input"
                placeholder={t('teamModal.placeholders.teamName')}
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="strength" className="form-label">
                {t('teamModal.fields.strength')}
              </label>
              <select
                id="strength"
                value={strength}
                onChange={(e) => setStrength(parseInt(e.target.value))}
                className="form-input"
              >
                <option value={1}>{t('teamModal.strength.highest')}</option>
                <option value={2}>{t('teamModal.strength.medium')}</option>
                <option value={3}>{t('teamModal.strength.lowest')}</option>
              </select>
            </div>

            {showActivityOverrides && <div>
              <label htmlFor="startTime" className="form-label">
                {t('teamModal.fields.startTime')}
              </label>
              <input
                type="time"
                id="startTime"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="form-input"
              />
            </div>}

            <div>
              <label htmlFor="responsiblePeople" className="form-label">
                {t('teamModal.fields.responsiblePeople')}
              </label>
              <div className="space-y-2">
                {memberOptions.map((option) => {
                  const isSelected = responsiblePersonIds.includes(option.id);
                  return (
                    <label key={option.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => setResponsiblePersonIds((current) => isSelected
                          ? current.filter((id) => id !== option.id)
                          : [...current, option.id])}
                      />
                      <span>
                        {option.firstName} {option.lastName}
                        {option.source === 'player' ? ' (' + t('domain.players') + ')' : ''}
                        {responsiblePersonIds[0] === option.id ? ' (' + t('teamModal.leadPerson') + ')' : ''}
                      </span>
                    </label>
                  );
                })}
              </div>
              <p className="mt-1 text-xs text-gray-500">{t('teamModal.responsiblePeopleHint')}</p>
            </div>

            {showActivityOverrides && <div>
              <label htmlFor="location" className="form-label">
                {t('teamModal.fields.locationOptional')}
              </label>
              <input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="form-input"
                placeholder={t('teamModal.placeholders.location')}
              />
            </div>}
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
            {t('common.actions.save')}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
