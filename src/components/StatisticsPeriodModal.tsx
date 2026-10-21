import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Period } from '../types';
import { Alert, Button, Field, Input, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle, Panel, Stack } from './ui';
import { useSquad, useStore } from '../store';

interface StatisticsPeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  periodToEdit?: Period | null;
}

export default function StatisticsPeriodModal({ isOpen, onClose, periodToEdit = null }: StatisticsPeriodModalProps) {
  const { t } = useTranslation();
  const [periodNameInput, setPeriodNameInput] = useState('');
  const [startDateInput, setStartDateInput] = useState('');
  const [endDateInput, setEndDateInput] = useState('');
  const [periodError, setPeriodError] = useState<string | null>(null);
  const [isSavingPeriod, setIsSavingPeriod] = useState(false);
  const [editingPeriodId, setEditingPeriodId] = useState<string | null>(null);

  const squad = useSquad();
  const { addSquadPeriod, updateSquadPeriod } = useStore();

  const resetPeriodForm = () => {
    setEditingPeriodId(null);
    setPeriodNameInput('');
    setStartDateInput('');
    setEndDateInput('');
    setPeriodError(null);
  };

  useEffect(() => {
    if (!isOpen) return;

    if (periodToEdit) {
      setEditingPeriodId(periodToEdit.id);
      setPeriodNameInput(periodToEdit.name);
      setStartDateInput(periodToEdit.startDate);
      setEndDateInput(periodToEdit.endDate);
      setPeriodError(null);
      return;
    }

    resetPeriodForm();
  }, [isOpen, periodToEdit]);

  const handleClose = () => {
    resetPeriodForm();
    onClose();
  };

  const handleSavePeriod = async () => {
    const isEditing = editingPeriodId !== null;

    if (!periodNameInput.trim()) {
      setPeriodError(t('page.statistics.period.errors.nameRequired'));
      return;
    }

    if (!startDateInput || !endDateInput) {
      setPeriodError(t('page.statistics.period.errors.startEndRequired'));
      return;
    }

    if (startDateInput > endDateInput) {
      setPeriodError(t('page.statistics.period.errors.invalidDateRange'));
      return;
    }

    setIsSavingPeriod(true);

    const nextPeriod = {
      name: periodNameInput.trim(),
      startDate: startDateInput,
      endDate: endDateInput,
    };

    const wasSaved = isEditing
      ? await updateSquadPeriod(editingPeriodId, nextPeriod)
      : await addSquadPeriod(nextPeriod);

    setIsSavingPeriod(false);

    if (!wasSaved) {
      setPeriodError(t('page.statistics.period.errors.saveFailed'));
      return;
    }

    if (isEditing) {
      handleClose();
      return;
    }

    handleClose();
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose}>
        <ModalHeader>
          <ModalTitle>{editingPeriodId ? t('page.statistics.period.editPeriod') : t('page.statistics.period.addPeriod')}</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <Stack>
          <p className="body-muted">
            {editingPeriodId
              ? t('page.statistics.period.editDescription', { squad: squad?.name ?? t('page.statistics.period.thisSquad') })
              : t('page.statistics.period.addDescription', { squad: squad?.name ?? t('page.statistics.period.thisSquad') })}
          </p>
          <Panel padding="compact">
            <Stack>
            <Field label={t('common.labels.name')} htmlFor="stats-period-name">
              <Input
                id="stats-period-name"
                type="text"
                value={periodNameInput}
                onChange={(e) => setPeriodNameInput(e.target.value)}
                placeholder={t('page.statistics.period.placeholders.name')}
              />
            </Field>

            <Field label={t('common.labels.startDate')} htmlFor="stats-period-start">
              <Input
                id="stats-period-start"
                type="date"
                value={startDateInput}
                onChange={(e) => setStartDateInput(e.target.value)}
              />
            </Field>

            <Field label={t('common.labels.endDate')} htmlFor="stats-period-end">
              <Input
                id="stats-period-end"
                type="date"
                value={endDateInput}
                onChange={(e) => setEndDateInput(e.target.value)}
              />
            </Field>
            {periodError && (
              <Alert>{periodError}</Alert>
            )}
            </Stack>
          </Panel>
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={handleClose}>{t('common.actions.cancel')}</Button>
          <Button type="button" onClick={handleSavePeriod} disabled={isSavingPeriod}>
            {editingPeriodId ? t('page.statistics.period.updatePeriod') : t('page.statistics.period.addPeriod')}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
