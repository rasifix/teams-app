import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Formation, FormationSlot, PositionCode } from '../types';
import { Alert, Button, EntityActions, EntityContent, EntityList, EntityRow, Field, FieldLegend, IconButton, Input, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle, Select, Split, Stack } from './ui';
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
          <Stack>
            {error && <Alert>{error}</Alert>}

            <Field label={t('formationModal.fields.name')} htmlFor="formation-name">
              <Input
                id="formation-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('formationModal.placeholders.name')}
                autoFocus
              />
            </Field>

            <div>
              <Split gap="sm">
                <FieldLegend>{t('formationModal.fields.slots')}</FieldLegend>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAddSlot}
                >
                  + {t('formationModal.addSlot')}
                </Button>
              </Split>

              <EntityList variant="separated">
                {slots.map((slot, index) => {
                  const draftId = slot.id ?? `draft-${index}`;
                  const displayIndex = displayIndexes.get(draftId);
                  return (
                    <EntityRow key={draftId} density="compact">
                      <EntityContent>
                      <Select
                        value={slot.positionCode}
                        onChange={(e) => handleSlotChange(index, e.target.value as PositionCode)}
                      >
                        {POSITION_CODES.map((code) => (
                          <option key={code} value={code}>
                            {t(getPositionLabelKey(code))}
                          </option>
                        ))}
                      </Select>
                      </EntityContent>
                      {displayIndex !== null && displayIndex !== undefined && (
                        <span className="formation-slot-index">{displayIndex}</span>
                      )}
                      <EntityActions><IconButton
                        variant="danger"
                        label={t('formationModal.removeSlot')}
                        onClick={() => handleRemoveSlot(index)}
                      >
                        <svg className="icon-xs" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </IconButton></EntityActions>
                    </EntityRow>
                  );
                })}
              </EntityList>
            </div>
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
