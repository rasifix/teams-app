import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from './ui';
import Button from './ui/Button';

interface AssignmentOption {
  value: string;
  label: string;
}

interface AssignTeamPropertyModalProps {
  isOpen: boolean;
  title: string;
  label: string;
  emptyOptionLabel: string;
  currentValue?: string | null;
  options: AssignmentOption[];
  onClose: () => void;
  onSave: (value: string | undefined) => Promise<void>;
}

export default function AssignTeamPropertyModal({
  isOpen,
  title,
  label,
  emptyOptionLabel,
  currentValue,
  options,
  onClose,
  onSave,
}: AssignTeamPropertyModalProps) {
  const { t } = useTranslation();
  const [selectedValue, setSelectedValue] = useState(currentValue ?? '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) setSelectedValue(currentValue ?? '');
  }, [currentValue, isOpen]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    await onSave(selectedValue || undefined);
    setIsSaving(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <label htmlFor="team-property-assignment" className="form-label">{label}</label>
          <select
            id="team-property-assignment"
            value={selectedValue}
            onChange={(event) => setSelectedValue(event.target.value)}
            className="form-input"
            autoFocus
          >
            <option value="">{emptyOptionLabel}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
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
