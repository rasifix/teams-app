import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { DuplicateMemberGroup } from '../store/selectors/memberDuplicateSelectors';
import { Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from './ui';
import Button from './ui/Button';

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
      setError(t('members.duplicates.errors.noTargetTrainer'));
      return;
    }

    setIsSubmitting(true);
    const success = await onMerge(guardianId, trainerId);
    setIsSubmitting(false);

    if (!success) {
      setError(t('members.duplicates.errors.mergeFailed'));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalHeader>
        <ModalTitle>{t('members.duplicates.title')}</ModalTitle>
      </ModalHeader>

      <ModalBody>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">{t('members.duplicates.description')}</p>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {!hasDuplicates ? (
            <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-4 text-sm text-gray-600">
              {t('members.duplicates.empty')}
            </div>
          ) : (
            <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
              {duplicateGroups.map((group) => (
                <div key={group.key} className="rounded-lg border border-gray-200 p-3">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {group.firstName} {group.lastName}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {t('members.duplicates.groupCount', {
                        trainerCount: group.trainers.length,
                        guardianCount: group.guardians.length,
                      })}
                    </span>
                  </div>

                  <div className="mb-3">
                    <label htmlFor={`target-trainer-${group.key}`} className="form-label">
                      {t('members.duplicates.targetTrainerLabel')}
                    </label>
                    <select
                      id={`target-trainer-${group.key}`}
                      className="form-input"
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
                            ? ` (${t('members.duplicates.assignedTeams', { count: trainer.assignedTeamCount })})`
                            : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    {group.guardians.map((guardian) => (
                      <div key={guardian.id} className="flex items-center justify-between gap-2 rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
                        <div>
                          <p className="text-sm text-gray-800">
                            {guardian.firstName} {guardian.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {t('members.duplicates.linkedPlayers', { count: guardian.playerIds.length })}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="primary"
                          disabled={isSubmitting}
                          onClick={() => {
                            void handleMerge(group.key, guardian.id);
                          }}
                        >
                          {t('members.duplicates.mergeAction')}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ModalBody>

      <ModalFooter>
        <Button type="button" variant="secondary" onClick={handleClose} className="flex-1" disabled={isSubmitting}>
          {t('common.actions.close')}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
