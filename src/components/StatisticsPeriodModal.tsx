import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Period } from '../types';
import { Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from './ui';
import ConfirmDialog from './ConfirmDialog';
import { useGroup, useStore } from '../store';

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
  const [deletingPeriod, setDeletingPeriod] = useState<Period | null>(null);

  const group = useGroup();
  const { addGroupPeriod, updateGroupPeriod, deleteGroupPeriod } = useStore();

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
      setPeriodError(t('statistics.period.errors.nameRequired'));
      return;
    }

    if (!startDateInput || !endDateInput) {
      setPeriodError(t('statistics.period.errors.startEndRequired'));
      return;
    }

    if (startDateInput > endDateInput) {
      setPeriodError(t('statistics.period.errors.invalidDateRange'));
      return;
    }

    setIsSavingPeriod(true);

    const nextPeriod = {
      name: periodNameInput.trim(),
      startDate: startDateInput,
      endDate: endDateInput,
    };

    const wasSaved = isEditing
      ? await updateGroupPeriod(editingPeriodId, nextPeriod)
      : await addGroupPeriod(nextPeriod);

    setIsSavingPeriod(false);

    if (!wasSaved) {
      setPeriodError(t('statistics.period.errors.saveFailed'));
      return;
    }

    if (isEditing) {
      handleClose();
      return;
    }

    handleClose();
  };

  const handleDeletePeriod = async () => {
    if (!deletingPeriod) return;

    const wasDeleted = await deleteGroupPeriod(deletingPeriod.id);
    if (!wasDeleted) {
      setPeriodError(t('statistics.period.errors.deleteFailed'));
      return;
    }

    if (editingPeriodId === deletingPeriod.id) {
      resetPeriodForm();
    }

    setDeletingPeriod(null);
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose}>
        <ModalHeader>
          <ModalTitle>{editingPeriodId ? t('statistics.period.editPeriod') : t('statistics.period.addPeriod')}</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <p className="text-sm text-gray-600 mb-4">
            {editingPeriodId
              ? t('statistics.period.editDescription', { group: group?.name ?? t('statistics.period.thisGroup') })
              : t('statistics.period.addDescription', { group: group?.name ?? t('statistics.period.thisGroup') })}
          </p>
          <div className="rounded-lg border border-gray-200 p-4 space-y-4">
            <div>
              <label htmlFor="stats-period-name" className="block text-sm font-medium text-gray-700 mb-1">{t('common.labels.name')}</label>
              <input
                id="stats-period-name"
                type="text"
                value={periodNameInput}
                onChange={(e) => setPeriodNameInput(e.target.value)}
                placeholder={t('statistics.period.placeholders.name')}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label htmlFor="stats-period-start" className="block text-sm font-medium text-gray-700 mb-1">{t('common.labels.startDate')}</label>
              <input
                id="stats-period-start"
                type="date"
                value={startDateInput}
                onChange={(e) => setStartDateInput(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label htmlFor="stats-period-end" className="block text-sm font-medium text-gray-700 mb-1">{t('common.labels.endDate')}</label>
              <input
                id="stats-period-end"
                type="date"
                value={endDateInput}
                onChange={(e) => setEndDateInput(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            {periodError && (
              <p className="text-sm text-red-600">{periodError}</p>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <button onClick={handleClose} className="btn-secondary">{t('common.actions.cancel')}</button>
          {editingPeriodId && (
            <button onClick={() => setDeletingPeriod(periodToEdit)} className="btn-secondary text-red-600">
              {t('common.actions.delete')}
            </button>
          )}
          <button onClick={handleSavePeriod} className="btn-primary" disabled={isSavingPeriod}>
            {editingPeriodId ? t('statistics.period.updatePeriod') : t('statistics.period.addPeriod')}
          </button>
        </ModalFooter>
      </Modal>

      <ConfirmDialog
        isOpen={deletingPeriod !== null}
        title={t('statistics.period.deleteTitle')}
        message={deletingPeriod ? t('statistics.period.deleteMessage', { period: deletingPeriod.name }) : ''}
        confirmText={t('common.actions.delete')}
        onConfirm={handleDeletePeriod}
        onCancel={() => setDeletingPeriod(null)}
        confirmButtonColor="red"
      />
    </>
  );
}