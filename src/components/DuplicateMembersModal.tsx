import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { DuplicateMemberGroup } from '../store/selectors/memberDuplicateSelectors';
import { Alert, Button, EmptyState, EntityActions, EntityContent, EntityList, EntityMeta, EntityRow, EntityTitle, Field, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle, Select, Split, Stack } from './ui';

interface DuplicateMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  duplicateGroups: DuplicateMemberGroup[];
  onMerge: (guardianId: string, trainerId: string) => Promise<boolean>;
}

export default function DuplicateMembersModal({
  isOpen,
  onClose,
  duplicateGroups,
  onMerge,
}: DuplicateMembersModalProps) {
  const { t } = useTranslation();
  const [selectedTrainerByGroupKey, setSelectedTrainerByGroupKey] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasDuplicates = duplicateGroups.length > 0;

  const selectedTrainerForGroup = useMemo(() => {
    const entries: Record<string, string> = {};
    duplicateGroups.forEach((group) => {
      entries[group.key] = selectedTrainerByGroupKey[group.key] || group.recommendedTrainerId;
    });
    return entries;
  }, [duplicateGroups, selectedTrainerByGroupKey]);

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }

    setError(null);
    onClose();
  };

  const handleMerge = async (groupKey: string, guardianId: string) => {
    setError(null);
    const trainerId = selectedTrainerForGroup[groupKey];
    if (!trainerId) {
      setError(t('page.members.duplicates.errors.noTargetTrainer'));
      return;
    }

    setIsSubmitting(true);
    const success = await onMerge(guardianId, trainerId);
    setIsSubmitting(false);

    if (!success) {
      setError(t('page.members.duplicates.errors.mergeFailed'));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalHeader>
        <ModalTitle>{t('page.members.duplicates.title')}</ModalTitle>
      </ModalHeader>

      <ModalBody>
        <Stack>
          <p className="body-muted">{t('page.members.duplicates.description')}</p>

          {error && <Alert>{error}</Alert>}

          {!hasDuplicates ? (
            <EmptyState>
              {t('page.members.duplicates.empty')}
            </EmptyState>
          ) : (
            <div className="duplicate-member-list">
              {duplicateGroups.map((group) => (
                <section key={group.key} className="duplicate-member-group">
                  <Split gap="sm">
                    <h3 className="duplicate-member-title">
                      {group.firstName} {group.lastName}
                    </h3>
                    <span className="member-meta-text">
                      {t('page.members.duplicates.groupCount', {
                        trainerCount: group.trainers.length,
                        guardianCount: group.guardians.length,
                      })}
                    </span>
                  </Split>

                  <Field className="duplicate-member-target" label={t('page.members.duplicates.targetTrainerLabel')} htmlFor={`target-trainer-${group.key}`}>
                    <Select
                      id={`target-trainer-${group.key}`}
                      value={selectedTrainerForGroup[group.key]}
                      onChange={(e) => {
                        setSelectedTrainerByGroupKey((previous) => ({
                          ...previous,
                          [group.key]: e.target.value,
                        }));
                      }}
                      disabled={isSubmitting}
                    >
                      {group.trainers.map((trainer) => (
                        <option key={trainer.id} value={trainer.id}>
                          {trainer.firstName} {trainer.lastName}
                          {trainer.assignedTeamCount > 0
                            ? ` (${t('page.members.duplicates.assignedTeams', { count: trainer.assignedTeamCount })})`
                            : ''}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <EntityList variant="separated">
                    {group.guardians.map((guardian) => (
                      <EntityRow key={guardian.id} density="compact">
                        <EntityContent>
                          <EntityTitle>
                            {guardian.firstName} {guardian.lastName}
                          </EntityTitle>
                          <EntityMeta>
                            {t('page.members.duplicates.linkedPlayers', { count: guardian.playerIds.length })}
                          </EntityMeta>
                        </EntityContent>
                        <EntityActions><Button
                          size="sm"
                          variant="primary"
                          disabled={isSubmitting}
                          onClick={() => {
                            void handleMerge(group.key, guardian.id);
                          }}
                        >
                          {t('page.members.duplicates.mergeAction')}
                        </Button></EntityActions>
                      </EntityRow>
                    ))}
                  </EntityList>
                </section>
              ))}
            </div>
          )}
        </Stack>
      </ModalBody>

      <ModalFooter>
        <Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting}>
          {t('common.actions.close')}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
