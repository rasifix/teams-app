import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Checkbox, EmptyState, EntityContent, EntityList, EntityMeta, EntityRow, EntityTitle, Input, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle, Stack } from './ui';
import type { Player, Trainer } from '../types';
import { filterTeamAssignees, selectTeamAssigneeOptions, selectTeamResponsiblePeople } from '../store/selectors/teamTrainerSelectors';

interface AssignResponsiblePeopleModalProps {
  isOpen: boolean;
  trainers: Trainer[];
  players: Player[];
  currentResponsiblePersonIds?: string[];
  currentTrainerId?: string;
  onClose: () => void;
  onSave: (responsiblePersonIds: string[]) => Promise<void>;
}

export default function AssignResponsiblePeopleModal({
  isOpen,
  trainers,
  players,
  currentResponsiblePersonIds,
  currentTrainerId,
  onClose,
  onSave,
}: AssignResponsiblePeopleModalProps) {
  const { t } = useTranslation();
  const currentResponsiblePersonId = useMemo(
    () => selectTeamResponsiblePeople(currentResponsiblePersonIds, trainers, players)[0]?.id,
    [currentResponsiblePersonIds, trainers, players],
  );
  const [selectedId, setSelectedId] = useState<string | undefined>(currentResponsiblePersonId);
  const [filter, setFilter] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const options = useMemo(() => selectTeamAssigneeOptions(trainers, players), [trainers, players]);
  const visibleOptions = useMemo(() => filterTeamAssignees(options, filter), [options, filter]);

  useEffect(() => {
    if (isOpen) {
      setSelectedId(currentResponsiblePersonId);
      setFilter('');
    }
  }, [currentResponsiblePersonId, isOpen]);

  const toggle = (id: string) => setSelectedId((current) => current === id ? undefined : id);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      await onSave(selectedId ? [selectedId] : []);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssignToMe = async () => {
    if (!currentTrainerId) return;
    setIsSaving(true);
    try {
      await onSave([currentTrainerId]);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <ModalTitle>{t('teamModal.fields.responsiblePeople')}</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <Stack>
          <Input
            type="search"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder={t('teamModal.filterPlaceholder')}
            aria-label={t('teamModal.filterPlaceholder')}
            data-testid="responsible-people-filter"
            autoFocus
          />
          {visibleOptions.length === 0 ? (
            <EmptyState>{t('teamModal.noPersonsFound')}</EmptyState>
          ) : (
            <EntityList variant="separated">
              {visibleOptions.map((option) => (
                  <label key={option.id} className="responsible-person-option">
                    <Checkbox
                      checked={selectedId === option.id}
                      onChange={() => toggle(option.id)}
                    />
                    <EntityRow>
                    <EntityContent>
                      <EntityTitle>{option.firstName} {option.lastName}</EntityTitle>
                      <EntityMeta><span>{t(`teamModal.assigneeSource.${option.source}`)}</span></EntityMeta>
                    </EntityContent>
                    </EntityRow>
                  </label>
              ))}
            </EntityList>
          )}
          </Stack>
        </ModalBody>
        <ModalFooter>
          {currentTrainerId && <Button type="button" variant="secondary" disabled={isSaving} onClick={() => void handleAssignToMe()}>
            {t('teamDetail.assignToMe')}
          </Button>}
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
