import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { MatchFormat } from '../types';
import { Alert, Button, ContentGrid, Field, Input, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle, Stack } from './ui';

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
          <Stack>
            {error && <Alert>{error}</Alert>}

            {isOfficial && (
              <Alert tone="info">
                {t('matchFormatModal.officialNotice')}
              </Alert>
            )}

            <Field label={t('matchFormatModal.fields.name')} htmlFor="playing-mode-name">
              <Input
                id="playing-mode-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('matchFormatModal.placeholders.name')}
                autoFocus
              />
            </Field>

            <Field label={t('matchFormatModal.fields.numberOfPeriods')} htmlFor="playing-mode-periods">
              <Input
                id="playing-mode-periods"
                type="number"
                min={1}
                value={numberOfPeriods}
                onChange={(e) => setNumberOfPeriods(parseInt(e.target.value) || 0)}
              />
            </Field>

            <Field label={t('matchFormatModal.fields.periodLengthMinutes')} htmlFor="playing-mode-length">
              <Input
                id="playing-mode-length"
                type="number"
                min={1}
                value={periodLengthMinutes}
                onChange={(e) => setPeriodLengthMinutes(parseInt(e.target.value) || 0)}
              />
            </Field>

            <Field label={t('matchFormatModal.fields.minimumPeriodsPerPlayer')} htmlFor="playing-mode-minimum-periods" hint={t('matchFormatModal.hints.minimumPeriodsPerPlayer')}>
              <Input
                id="playing-mode-minimum-periods"
                type="number"
                min={0}
                max={numberOfPeriods}
                value={minimumPeriodsPerPlayer}
                onChange={(e) => setMinimumPeriodsPerPlayer(parseInt(e.target.value) || 0)}
              />
            </Field>

            <Field label={t('matchFormatModal.fields.playersOnField')} htmlFor="playing-mode-on-field">
              <Input
                id="playing-mode-on-field"
                type="number"
                min={1}
                value={playersOnField}
                onChange={(e) => setPlayersOnField(e.target.value)}
              />
            </Field>

            <ContentGrid variant="equal">
              <Field label={t('matchFormatModal.fields.minPlayersPerTeam')} htmlFor="playing-mode-min-players">
                <Input
                  id="playing-mode-min-players"
                  type="number"
                  min={1}
                  value={minPlayersPerTeam}
                  onChange={(e) => setMinPlayersPerTeam(e.target.value)}
                />
              </Field>
              <Field label={t('matchFormatModal.fields.maxPlayersPerTeam')} htmlFor="playing-mode-max-players">
                <Input
                  id="playing-mode-max-players"
                  type="number"
                  min={1}
                  value={maxPlayersPerTeam}
                  onChange={(e) => setMaxPlayersPerTeam(e.target.value)}
                />
              </Field>
            </ContentGrid>
            <p className="field-help">{t('matchFormatModal.hints.playerLimits')}</p>
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('common.actions.cancel')}
          </Button>
          <Button type="submit" variant="primary" disabled={isSaving}>
            {t('common.actions.save')}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
