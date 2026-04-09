import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from './ui';
import Button from './ui/Button';

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; date: string; maxPlayersPerTeam: number; minPlayersPerTeam: number; location?: string }) => void;
  currentData: {
    name: string;
    date: string;
    maxPlayersPerTeam: number;
    minPlayersPerTeam: number;
    location?: string;
  };
  minMaxPlayers: number;
}

export default function EditEventModal({ 
  isOpen, 
  onClose, 
  onSave, 
  currentData,
  minMaxPlayers
}: EditEventModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(currentData.name);
  const [date, setDate] = useState(currentData.date);
  const [location, setLocation] = useState(currentData.location || '');
  const [maxPlayersPerTeam, setMaxPlayersPerTeam] = useState(currentData.maxPlayersPerTeam);
  const [minPlayersPerTeam, setMinPlayersPerTeam] = useState(currentData.minPlayersPerTeam);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(currentData.name);
      setDate(currentData.date);
      setLocation(currentData.location || '');
      setMaxPlayersPerTeam(currentData.maxPlayersPerTeam || 9);
      setMinPlayersPerTeam(currentData.minPlayersPerTeam || 6);
      setError(null);
    }
  }, [currentData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError(t('editEventModal.errors.eventNameRequired'));
      return;
    }

    if (!date) {
      setError(t('editEventModal.errors.dateRequired'));
      return;
    }

    if (maxPlayersPerTeam < minMaxPlayers) {
      setError(t('editEventModal.errors.maxPlayersTooLow', { minMaxPlayers }));
      return;
    }

    if (maxPlayersPerTeam < 1) {
      setError(t('editEventModal.errors.maxPlayersMinOne'));
      return;
    }

    if (minPlayersPerTeam < 1) {
      setError(t('editEventModal.errors.minPlayersMinOne'));
      return;
    }

    if (minPlayersPerTeam > maxPlayersPerTeam) {
      setError(t('editEventModal.errors.minGreaterThanMax'));
      return;
    }

    onSave({
      name: name.trim(),
      date,
      maxPlayersPerTeam,
      minPlayersPerTeam,
      location: location.trim() || undefined,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <ModalTitle>{t('editEventModal.title')}</ModalTitle>
      </ModalHeader>

      <form onSubmit={handleSubmit}>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label htmlFor="eventName" className="form-label">
                {t('eventModal.fields.eventName')}
              </label>
              <input
                type="text"
                id="eventName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="form-input"
                placeholder={t('eventModal.placeholders.eventNameSimple')}
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="eventDate" className="form-label">
                {t('eventModal.fields.date')}
              </label>
              <input
                type="date"
                id="eventDate"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="form-input"
              />
            </div>

            <div>
              <label htmlFor="eventLocation" className="form-label">
                {t('eventModal.fields.location')}
              </label>
              <input
                type="text"
                id="eventLocation"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="form-input"
                placeholder={t('eventModal.placeholders.location')}
              />
            </div>

            <div>
              <label htmlFor="maxPlayers" className="form-label">
                {t('eventModal.fields.maxPlayersPerTeam')}
              </label>
              <input
                type="number"
                id="maxPlayers"
                value={maxPlayersPerTeam}
                onChange={(e) => setMaxPlayersPerTeam(parseInt(e.target.value) || 0)}
                required
                min={minMaxPlayers}
                className="form-input"
              />
              {minMaxPlayers > 1 && (
                <p className="text-xs text-gray-500 mt-1">
                  {t('editEventModal.minHint', { minMaxPlayers })}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="minPlayers" className="form-label">
                {t('eventModal.fields.minPlayersPerTeam')}
              </label>
              <input
                type="number"
                id="minPlayers"
                value={minPlayersPerTeam}
                onChange={(e) => setMinPlayersPerTeam(parseInt(e.target.value) || 0)}
                required
                min={1}
                max={maxPlayersPerTeam}
                className="form-input"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
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
