import { useEffect, useState } from 'react';
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
      setPeriodError('Please provide a name for the period.');
      return;
    }

    if (!startDateInput || !endDateInput) {
      setPeriodError('Please set both start and end date, or clear both.');
      return;
    }

    if (startDateInput > endDateInput) {
      setPeriodError('Start date must be before or equal to end date.');
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
      setPeriodError('Failed to save period. Please try again.');
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
      setPeriodError('Failed to delete period. Please try again.');
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
          <ModalTitle>{editingPeriodId ? 'Edit Period' : 'Add Period'}</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <p className="text-sm text-gray-600 mb-4">
            {editingPeriodId
              ? `Update the selected period for ${group?.name ?? 'this group'}.`
              : `Create a new period for ${group?.name ?? 'this group'}.`}
          </p>
          <div className="rounded-lg border border-gray-200 p-4 space-y-4">
            <div>
              <label htmlFor="stats-period-name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                id="stats-period-name"
                type="text"
                value={periodNameInput}
                onChange={(e) => setPeriodNameInput(e.target.value)}
                placeholder="Spring 2026"
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label htmlFor="stats-period-start" className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
              <input
                id="stats-period-start"
                type="date"
                value={startDateInput}
                onChange={(e) => setStartDateInput(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label htmlFor="stats-period-end" className="block text-sm font-medium text-gray-700 mb-1">End date</label>
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
          <button onClick={handleClose} className="btn-secondary">Cancel</button>
          {editingPeriodId && (
            <button onClick={() => setDeletingPeriod(periodToEdit)} className="btn-secondary text-red-600">
              Delete
            </button>
          )}
          <button onClick={handleSavePeriod} className="btn-primary" disabled={isSavingPeriod}>
            {editingPeriodId ? 'Update period' : 'Add period'}
          </button>
        </ModalFooter>
      </Modal>

      <ConfirmDialog
        isOpen={deletingPeriod !== null}
        title="Delete Period"
        message={deletingPeriod ? `Delete period \"${deletingPeriod.name}\"?` : ''}
        confirmText="Delete"
        onConfirm={handleDeletePeriod}
        onCancel={() => setDeletingPeriod(null)}
        confirmButtonColor="red"
      />
    </>
  );
}