import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { MatchFormat } from '../types';
import { Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from './ui';
import Button from './ui/Button';

export interface MatchFormatFormData {
  name: string;
  numberOfPeriods: number;
  periodLengthMinutes: number;
  minimumPeriodsPerPlayer: number;
  playersOnField?: number;
  minPlayersPerTeam?: number;
  maxPlayersPerTeam?: number;
}

interface MatchFormatModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchFormatToEdit?: MatchFormat | null;
  onSave: (data: MatchFormatFormData) => Promise<boolean>;
}

const parseOptionalPositiveInt = (value: string): number | undefined => {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
};

export default function MatchFormatModal({ isOpen, onClose, matchFormatToEdit = null, onSave }: MatchFormatModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [numberOfPeriods, setNumberOfPeriods] = useState(4);
  const [periodLengthMinutes, setPeriodLengthMinutes] = useState(20);
  const [minimumPeriodsPerPlayer, setMinimumPeriodsPerPlayer] = useState(0);
  const [playersOnField, setPlayersOnField] = useState('');
  const [minPlayersPerTeam, setMinPlayersPerTeam] = useState('');
  const [maxPlayersPerTeam, setMaxPlayersPerTeam] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = Boolean(matchFormatToEdit);
  const isOfficial = Boolean(matchFormatToEdit?.origin);

  useEffect(() => {
    if (!isOpen) return;

    setName(matchFormatToEdit?.name ?? '');
    setNumberOfPeriods(matchFormatToEdit?.numberOfPeriods ?? 4);
    setPeriodLengthMinutes(matchFormatToEdit?.periodLengthMinutes ?? 20);
    setMinimumPeriodsPerPlayer(matchFormatToEdit?.minimumPeriodsPerPlayer ?? 0);
    setPlayersOnField(matchFormatToEdit?.playersOnField?.toString() ?? '');
    setMinPlayersPerTeam(matchFormatToEdit?.minPlayersPerTeam?.toString() ?? '');
    setMaxPlayersPerTeam(matchFormatToEdit?.maxPlayersPerTeam?.toString() ?? '');
    setError(null);
  }, [isOpen, matchFormatToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError(t('matchFormatModal.errors.nameRequired'));
      return;
    }

    if (numberOfPeriods < 1) {
      setError(t('matchFormatModal.errors.numberOfPeriodsMin'));
      return;
    }

    if (periodLengthMinutes < 1) {
      setError(t('matchFormatModal.errors.periodLengthMin'));
      return;
    }

    if (minimumPeriodsPerPlayer < 0 || minimumPeriodsPerPlayer > numberOfPeriods) {
      setError(t('matchFormatModal.errors.minimumPeriodsRange', { total: numberOfPeriods }));
      return;
    }

    const onField = parseOptionalPositiveInt(playersOnField);
    const minPlayers = parseOptionalPositiveInt(minPlayersPerTeam);
    const maxPlayers = parseOptionalPositiveInt(maxPlayersPerTeam);

    if ([onField, minPlayers, maxPlayers].some((value) => value !== undefined && value < 1)) {
      setError(t('matchFormatModal.errors.playersMin'));
      return;
    }

    if (minPlayers !== undefined && maxPlayers !== undefined && minPlayers > maxPlayers) {
      setError(t('matchFormatModal.errors.playerLimitsRange'));
      return;
    }

    setIsSaving(true);
    const wasSaved = await onSave({
      name: name.trim(),
      numberOfPeriods,
      periodLengthMinutes,
      minimumPeriodsPerPlayer,
      playersOnField: onField,
      minPlayersPerTeam: minPlayers,
      maxPlayersPerTeam: maxPlayers,
    });
    setIsSaving(false);

    if (!wasSaved) {
      setError(t('matchFormatModal.errors.saveFailed'));
      return;
    }

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <ModalTitle>{isEditing ? t('matchFormatModal.editTitle') : t('matchFormatModal.addTitle')}</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">{error}</div>
            )}

            {isOfficial && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded text-sm">
                {t('matchFormatModal.officialNotice')}
              </div>
            )}

            <div>
              <label htmlFor="playing-mode-name" className="form-label">{t('matchFormatModal.fields.name')}</label>
              <input
                id="playing-mode-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('matchFormatModal.placeholders.name')}
                className="form-input"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="playing-mode-periods" className="form-label">{t('matchFormatModal.fields.numberOfPeriods')}</label>
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
              <label htmlFor="playing-mode-length" className="form-label">{t('matchFormatModal.fields.periodLengthMinutes')}</label>
              <input
                id="playing-mode-length"
                type="number"
                min={1}
                value={periodLengthMinutes}
                onChange={(e) => setPeriodLengthMinutes(parseInt(e.target.value) || 0)}
                className="form-input"
              />
            </div>

            <div>
              <label htmlFor="playing-mode-minimum-periods" className="form-label">
                {t('matchFormatModal.fields.minimumPeriodsPerPlayer')}
              </label>
              <input
                id="playing-mode-minimum-periods"
                type="number"
                min={0}
                max={numberOfPeriods}
                value={minimumPeriodsPerPlayer}
                onChange={(e) => setMinimumPeriodsPerPlayer(parseInt(e.target.value) || 0)}
                className="form-input"
              />
              <p className="mt-1 text-xs text-gray-500">{t('matchFormatModal.hints.minimumPeriodsPerPlayer')}</p>
            </div>

            <div>
              <label htmlFor="playing-mode-on-field" className="form-label">{t('matchFormatModal.fields.playersOnField')}</label>
              <input
                id="playing-mode-on-field"
                type="number"
                min={1}
                value={playersOnField}
                onChange={(e) => setPlayersOnField(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="playing-mode-min-players" className="form-label">{t('matchFormatModal.fields.minPlayersPerTeam')}</label>
                <input
                  id="playing-mode-min-players"
                  type="number"
                  min={1}
                  value={minPlayersPerTeam}
                  onChange={(e) => setMinPlayersPerTeam(e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <label htmlFor="playing-mode-max-players" className="form-label">{t('matchFormatModal.fields.maxPlayersPerTeam')}</label>
                <input
                  id="playing-mode-max-players"
                  type="number"
                  min={1}
                  value={maxPlayersPerTeam}
                  onChange={(e) => setMaxPlayersPerTeam(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>
            <p className="-mt-2 text-xs text-gray-500">{t('matchFormatModal.hints.playerLimits')}</p>
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
