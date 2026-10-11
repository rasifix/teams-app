import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from './ui';
import Button from './ui/Button';
import type { Player, Trainer } from '../types';
import { filterTeamAssignees, selectTeamAssigneeOptions } from '../store/selectors/teamTrainerSelectors';

interface AssignResponsiblePeopleModalProps {
  isOpen: boolean;
  trainers: Trainer[];
  players: Player[];
  currentResponsiblePersonIds?: string[];
  onClose: () => void;
  onSave: (responsiblePersonIds: string[]) => Promise<void>;
}

export default function AssignResponsiblePeopleModal({
  isOpen,
  trainers,
  players,
  currentResponsiblePersonIds,
  onClose,
  onSave,
}: AssignResponsiblePeopleModalProps) {
  const { t } = useTranslation();
  const [selectedIds, setSelectedIds] = useState<string[]>(currentResponsiblePersonIds ?? []);
  const [filter, setFilter] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const options = useMemo(() => selectTeamAssigneeOptions(trainers, players), [trainers, players]);
  const visibleOptions = useMemo(() => filterTeamAssignees(options, filter), [options, filter]);

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(currentResponsiblePersonIds ?? []);
      setFilter('');
    }
  }, [currentResponsiblePersonIds, isOpen]);

  const toggle = (id: string) => setSelectedIds((current) => (
    current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
  ));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      await onSave(selectedIds);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <ModalHeader>
          <ModalTitle>{t('teamModal.fields.responsiblePeople')}</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <input
            type="search"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder={t('teamModal.filterPlaceholder')}
            aria-label={t('teamModal.filterPlaceholder')}
            className="form-input mb-3"
            data-testid="responsible-people-filter"
            autoFocus
          />
          {visibleOptions.length === 0 ? (
            <p className="text-sm text-gray-500">{t('teamModal.noPersonsFound')}</p>
          ) : (
            <ul className="space-y-1">
              {visibleOptions.map((option) => (
                <li key={option.id}>
                  <label className="flex items-center gap-2 rounded px-1 py-1.5 text-sm hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(option.id)}
                      onChange={() => toggle(option.id)}
                    />
                    <span className="min-w-0 flex-1 truncate">
                      {option.firstName} {option.lastName}
                    </span>
                    <span className="text-xs text-gray-500">{t(`teamModal.assigneeSource.${option.source}`)}</span>
                    {selectedIds[0] === option.id && (
                      <span className="text-xs font-medium text-blue-600">{t('teamModal.leadPerson')}</span>
                    )}
                  </label>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-gray-500">{t('teamModal.responsiblePeopleHint')}</p>
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
