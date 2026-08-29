import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { PlayingMode } from '../types';
import { Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from './ui';
import Button from './ui/Button';

interface PlayingModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  playingModeToEdit?: PlayingMode | null;
  onSave: (data: { name: string; numberOfPeriods: number; periodLengthMinutes: number }) => Promise<boolean>;
}

export default function PlayingModeModal({ isOpen, onClose, playingModeToEdit = null, onSave }: PlayingModeModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [numberOfPeriods, setNumberOfPeriods] = useState(4);
  const [periodLengthMinutes, setPeriodLengthMinutes] = useState(20);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = Boolean(playingModeToEdit);

  useEffect(() => {
    if (!isOpen) return;

    setName(playingModeToEdit?.name ?? '');
    setNumberOfPeriods(playingModeToEdit?.numberOfPeriods ?? 4);
    setPeriodLengthMinutes(playingModeToEdit?.periodLengthMinutes ?? 20);
    setError(null);
  }, [isOpen, playingModeToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError(t('playingModeModal.errors.nameRequired'));
      return;
    }

    if (numberOfPeriods < 1) {
      setError(t('playingModeModal.errors.numberOfPeriodsMin'));
      return;
    }

    if (periodLengthMinutes < 1) {
      setError(t('playingModeModal.errors.periodLengthMin'));
      return;
    }

    setIsSaving(true);
    const wasSaved = await onSave({
      name: name.trim(),
      numberOfPeriods,
      periodLengthMinutes,
    });
    setIsSaving(false);

    if (!wasSaved) {
      setError(t('playingModeModal.errors.saveFailed'));
      return;
    }

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <ModalTitle>{isEditing ? t('playingModeModal.editTitle') : t('playingModeModal.addTitle')}</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">{error}</div>
            )}

            <div>
              <label htmlFor="playing-mode-name" className="form-label">{t('playingModeModal.fields.name')}</label>
              <input
                id="playing-mode-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('playingModeModal.placeholders.name')}
                className="form-input"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="playing-mode-periods" className="form-label">{t('playingModeModal.fields.numberOfPeriods')}</label>
              <input
                id="playing-mode-periods"
                type="number"
                min={1}
                value={numberOfPeriods}
                onChange={(e) => setNumberOfPeriods(parseInt(e.target.value) || 0)}
                className="form-input"
              />
            </div>

            <div>
              <label htmlFor="playing-mode-length" className="form-label">{t('playingModeModal.fields.periodLengthMinutes')}</label>
              <input
                id="playing-mode-length"
                type="number"
                min={1}
                value={periodLengthMinutes}
                onChange={(e) => setPeriodLengthMinutes(parseInt(e.target.value) || 0)}
                className="form-input"
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            {t('common.actions.cancel')}
          </Button>
          <Button type="submit" variant="primary" disabled={isSaving} className="flex-1">
            {t('common.actions.save')}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
