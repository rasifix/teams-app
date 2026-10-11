import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from './ui';
import Button from './ui/Button';
import type { ActivityTaskInput } from '../services/activityService';
import type { ActivityTask } from '../types';

interface AddActivityTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: ActivityTaskInput) => Promise<boolean>;
  /** When set, the modal edits this task instead of creating one. */
  task?: ActivityTask;
}

export default function AddActivityTaskModal({ isOpen, onClose, onSave, task }: AddActivityTaskModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [requiredPeople, setRequiredPeople] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setName(task?.name ?? '');
    setDescription(task?.description ?? '');
    setRequiredPeople(task?.requiredPeople ?? 1);
  }, [isOpen, task]);

  const isValid = name.trim().length > 0 && Number.isInteger(requiredPeople) && requiredPeople >= 1;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isValid) return;
    setIsSaving(true);
    const saved = await onSave({ name: name.trim(), description: description.trim() || undefined, requiredPeople });
    setIsSaving(false);
    if (saved) onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <ModalTitle>{task ? t('tasks.editTitle') : t('tasks.addTitle')}</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-3">
            <div>
              <label htmlFor="task-name" className="form-label">{t('tasks.fields.name')}</label>
              <input id="task-name" value={name} onChange={(event) => setName(event.target.value)} className="form-input" placeholder={t('tasks.fields.namePlaceholder')} required />
            </div>
            <div>
              <label htmlFor="task-description" className="form-label">{t('tasks.fields.description')}</label>
              <textarea id="task-description" value={description} onChange={(event) => setDescription(event.target.value)} className="form-input" rows={2} />
            </div>
            <div>
              <label htmlFor="task-required" className="form-label">{t('tasks.fields.requiredPeople')}</label>
              <input id="task-required" type="number" min={1} value={requiredPeople} onChange={(event) => setRequiredPeople(Number(event.target.value))} className="form-input" />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose}>{t('common.actions.cancel')}</Button>
          <Button type="submit" disabled={!isValid || isSaving}>{t('common.actions.save')}</Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
