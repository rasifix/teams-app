import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Formation, FormationSlot, PositionCode } from '../types';
import { Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from './ui';
import Button from './ui/Button';
import { POSITION_CODES, getPositionLabelKey, selectSlotDisplayIndexes } from '../store/selectors/matchPlanningSelectors';

interface FormationSlotDraft {
  id?: string;
  positionCode: PositionCode;
}

interface FormationModalProps {
  isOpen: boolean;
  onClose: () => void;
  formationToEdit?: Formation | null;
  onSave: (data: { name: string; slots: FormationSlotDraft[] }) => Promise<boolean>;
}

function toDrafts(slots: FormationSlot[] | undefined): FormationSlotDraft[] {
  if (!slots || slots.length === 0) {
    return [{ positionCode: 'GK' }, { positionCode: 'CB' }];
  }
  return slots.map((slot) => ({ id: slot.id, positionCode: slot.positionCode }));
}

export default function FormationModal({ isOpen, onClose, formationToEdit = null, onSave }: FormationModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [slots, setSlots] = useState<FormationSlotDraft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = Boolean(formationToEdit);

  useEffect(() => {
    if (!isOpen) return;

    setName(formationToEdit?.name ?? '');
    setSlots(toDrafts(formationToEdit?.slots));
    setError(null);
  }, [isOpen, formationToEdit]);

  const displayIndexes = selectSlotDisplayIndexes(
    slots.map((slot, index) => ({ id: slot.id ?? `draft-${index}`, positionCode: slot.positionCode }))
  );

  const handleAddSlot = () => {
    setSlots((current) => [...current, { positionCode: 'CB' }]);
  };

  const handleRemoveSlot = (index: number) => {
    setSlots((current) => current.filter((_, i) => i !== index));
  };

  const handleSlotChange = (index: number, positionCode: PositionCode) => {
    setSlots((current) => current.map((slot, i) => (i === index ? { ...slot, positionCode } : slot)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError(t('formationModal.errors.nameRequired'));
      return;
    }

    if (slots.length < 2) {
      setError(t('formationModal.errors.minSlots'));
      return;
    }

    const goalkeeperSlots = slots.filter((slot) => slot.positionCode === 'GK');
    if (goalkeeperSlots.length !== 1) {
      setError(t('formationModal.errors.exactlyOneGoalkeeper'));
      return;
    }

    setIsSaving(true);
    const wasSaved = await onSave({ name: name.trim(), slots });
    setIsSaving(false);

    if (!wasSaved) {
      setError(t('formationModal.errors.saveFailed'));
      return;
    }

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <ModalTitle>{isEditing ? t('formationModal.editTitle') : t('formationModal.addTitle')}</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">{error}</div>
            )}

            <div>
              <label htmlFor="formation-name" className="form-label">{t('formationModal.fields.name')}</label>
              <input
                id="formation-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('formationModal.placeholders.name')}
                className="form-input"
                autoFocus
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="form-label mb-0">{t('formationModal.fields.slots')}</span>
                <button
                  type="button"
                  onClick={handleAddSlot}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  + {t('formationModal.addSlot')}
                </button>
              </div>

              <div className="space-y-2">
                {slots.map((slot, index) => {
                  const draftId = slot.id ?? `draft-${index}`;
                  const displayIndex = displayIndexes.get(draftId);
                  return (
                    <div key={draftId} className="flex items-center gap-2">
                      <select
                        value={slot.positionCode}
                        onChange={(e) => handleSlotChange(index, e.target.value as PositionCode)}
                        className="form-input flex-1"
                      >
                        {POSITION_CODES.map((code) => (
                          <option key={code} value={code}>
                            {t(getPositionLabelKey(code))}
                          </option>
                        ))}
                      </select>
                      {displayIndex !== null && displayIndex !== undefined && (
                        <span className="text-xs text-gray-500 w-6 text-center">{displayIndex}</span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveSlot(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title={t('formationModal.removeSlot')}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
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
