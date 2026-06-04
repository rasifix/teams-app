import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGroup, useGroups } from '../store';
import { useStore } from '../store/useStore';
import {
  selectImportableGroupMembers,
  selectSourceGroupCandidates,
  selectSourceMemberBirthYears,
  type GroupImportCandidate,
} from '../store/selectors/memberGroupImportSelectors';
import { selectPlayersFromMembers, selectTrainersFromMembers } from '../store/selectors/memberSelectors';
import type { GroupMemberImportProgress, GroupMemberImportResult } from '../store/useStore';
import { Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from './ui';
import Button from './ui/Button';

interface ImportMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ImportMembersModal({ isOpen, onClose }: ImportMembersModalProps) {
  const { t } = useTranslation();
  const group = useGroup();
  const groups = useGroups();
  const members = useStore((state) => state.members);
  const loadGroups = useStore((state) => state.loadGroups);
  const getMembersForGroup = useStore((state) => state.getMembersForGroup);
  const importMembersFromGroup = useStore((state) => state.importMembersFromGroup);

  const [selectedSourceGroupId, setSelectedSourceGroupId] = useState('');
  const [sourceMembers, setSourceMembers] = useState<{ players: import('../types').Player[]; trainers: import('../types').Trainer[] } | null>(null);
  const [isLoadingSourceMembers, setIsLoadingSourceMembers] = useState(false);
  const [sourceMembersError, setSourceMembersError] = useState<string | null>(null);
  const [selectedBirthYears, setSelectedBirthYears] = useState<number[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [isApplying, setIsApplying] = useState(false);
  const [importProgress, setImportProgress] = useState<GroupMemberImportProgress>({ total: 0, completed: 0 });
  const [applyResult, setApplyResult] = useState<GroupMemberImportResult | null>(null);

  const sourceGroups = useMemo(
    () => groups.filter((entry) => entry.id !== group?.id),
    [groups, group?.id]
  );

  const targetPlayers = useMemo(() => selectPlayersFromMembers(members), [members]);
  const targetTrainers = useMemo(() => selectTrainersFromMembers(members), [members]);
  const sourceAllCandidates = useMemo(() => {
    if (!sourceMembers) {
      return [];
    }

    return selectSourceGroupCandidates(sourceMembers.players, sourceMembers.trainers);
  }, [sourceMembers]);

  const sourceBirthYears = useMemo(
    () => selectSourceMemberBirthYears((sourceMembers?.players || []).filter((player) => player.status !== 'inactive')),
    [sourceMembers]
  );

  const visibleSourceCandidates = useMemo(() => {
    if (!sourceMembers) {
      return [];
    }

    if (selectedBirthYears.length === 0) {
      return sourceAllCandidates;
    }

    return sourceAllCandidates.filter((candidate) => (
      candidate.role === 'trainer' || selectedBirthYears.includes(candidate.birthYear || -1)
    ));
  }, [selectedBirthYears, sourceAllCandidates, sourceMembers]);

  const importableCandidates = useMemo(() => {
    if (!sourceMembers) {
      return [];
    }

    return selectImportableGroupMembers(
      sourceMembers.players,
      sourceMembers.trainers,
      targetPlayers,
      targetTrainers,
      selectedBirthYears
    );
  }, [selectedBirthYears, sourceMembers, targetPlayers, targetTrainers]);

  const hiddenExistingCount = Math.max(0, visibleSourceCandidates.length - importableCandidates.length);

  const isSummaryOnly = Boolean(applyResult) && !isApplying;

  const resetState = () => {
    setSelectedSourceGroupId('');
    setSourceMembers(null);
    setSourceMembersError(null);
    setSelectedBirthYears([]);
    setSelectedMemberIds(new Set());
    setApplyResult(null);
    setIsApplying(false);
    setImportProgress({ total: 0, completed: 0 });
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (groups.length === 0) {
      void loadGroups();
    }
  }, [groups.length, isOpen, loadGroups]);

  useEffect(() => {
    if (!isOpen || !selectedSourceGroupId) {
      return;
    }

    let isCancelled = false;
    const loadSourceMembers = async () => {
      setIsLoadingSourceMembers(true);
      setSourceMembersError(null);
      setApplyResult(null);
      setImportProgress({ total: 0, completed: 0 });
      setSelectedBirthYears([]);
      setSelectedMemberIds(new Set());

      const loadedMembers = await getMembersForGroup(selectedSourceGroupId);
      if (isCancelled) {
        return;
      }

      if (!loadedMembers) {
        setSourceMembers(null);
        setSourceMembersError(t('membersImport.errors.sourceMembersLoadFailed'));
      } else {
        setSourceMembers(loadedMembers);
      }

      setIsLoadingSourceMembers(false);
    };

    void loadSourceMembers();

    return () => {
      isCancelled = true;
    };
  }, [getMembersForGroup, isOpen, selectedSourceGroupId, t]);

  const toggleSelectedMember = (memberId: string) => {
    setSelectedMemberIds((previous) => {
      const next = new Set(previous);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedMemberIds(new Set(importableCandidates.map((candidate) => candidate.id)));
  };

  const clearSelected = () => {
    setSelectedMemberIds(new Set());
  };

  const applyImport = async () => {
    if (!selectedSourceGroupId || selectedMemberIds.size === 0) {
      return;
    }

    setIsApplying(true);
    setApplyResult(null);
    setImportProgress({ total: selectedMemberIds.size, completed: 0 });

    const result = await importMembersFromGroup(
      selectedSourceGroupId,
      Array.from(selectedMemberIds),
      (progress) => setImportProgress(progress)
    );

    setApplyResult(result);
    setIsApplying(false);
  };

  const startNewImport = () => {
    setSelectedSourceGroupId('');
    setSourceMembers(null);
    setSourceMembersError(null);
    setSelectedBirthYears([]);
    setSelectedMemberIds(new Set());
    setApplyResult(null);
    setImportProgress({ total: 0, completed: 0 });
  };

  const selectedSourceGroup = sourceGroups.find((entry) => entry.id === selectedSourceGroupId);

  const selectedCount = selectedMemberIds.size;

  const renderCandidateMeta = (candidate: GroupImportCandidate): string => {
    if (candidate.role === 'player') {
      return t('membersImport.memberMeta.player', {
        level: candidate.level || 1,
        guardiansCount: candidate.guardians?.length || 0,
      });
    }

    return t('membersImport.memberMeta.trainer', {
      email: candidate.email || t('membersImport.noEmail'),
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalHeader>
        <ModalTitle>{t('membersImport.title')}</ModalTitle>
      </ModalHeader>

      <ModalBody>
        {isSummaryOnly ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-800">{t('membersImport.completedTitle')}</p>
            <div className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 space-y-1">
              <p>{t('membersImport.result.processedMembers', { count: applyResult?.processedMembers || 0 })}</p>
              <p>{t('membersImport.result.importedPlayers', { count: applyResult?.importedPlayers || 0 })}</p>
              <p>{t('membersImport.result.importedTrainers', { count: applyResult?.importedTrainers || 0 })}</p>
              <p>{t('membersImport.result.importedGuardians', { count: applyResult?.importedGuardians || 0 })}</p>
              <p>{t('membersImport.result.skippedMembers', { count: applyResult?.skippedMembers || 0 })}</p>
              <p>{t('membersImport.result.failedMembers', { count: applyResult?.failedMembers || 0 })}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">{t('membersImport.description')}</p>

            <div>
              <label htmlFor="source-group" className="block text-sm font-medium text-gray-700 mb-1">
                {t('membersImport.sourceGroupLabel')}
              </label>
              <select
                id="source-group"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                value={selectedSourceGroupId}
                disabled={isApplying}
                onChange={(event) => setSelectedSourceGroupId(event.target.value)}
              >
                <option value="">{t('membersImport.sourceGroupPlaceholder')}</option>
                {sourceGroups.map((entry) => (
                  <option key={entry.id} value={entry.id}>{entry.name}</option>
                ))}
              </select>
            </div>

            {sourceGroups.length === 0 && (
              <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {t('membersImport.noSourceGroups')}
              </div>
            )}

            {selectedSourceGroup && (
              <p className="text-xs text-gray-600">
                {t('membersImport.selectedSourceGroup', { name: selectedSourceGroup.name })}
              </p>
            )}

            {sourceMembersError && (
              <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {sourceMembersError}
              </div>
            )}

            {isLoadingSourceMembers && (
              <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                {t('membersImport.loadingSourceMembers')}
              </div>
            )}

            {!isLoadingSourceMembers && selectedSourceGroupId && sourceMembers && (
              <div className="space-y-3">
                <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700">
                  <p>{t('membersImport.summary.totalSourceMembers', { count: visibleSourceCandidates.length })}</p>
                  <p>{t('membersImport.summary.importableMembers', { count: importableCandidates.length })}</p>
                  <p>{t('membersImport.summary.hiddenExistingMembers', { count: hiddenExistingCount })}</p>
                  <p>{t('membersImport.summary.selectedMembers', { count: selectedCount })}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">{t('membersImport.birthYearFilter.label')}</p>
                  {sourceBirthYears.length === 0 ? (
                    <p className="text-xs text-gray-500">{t('membersImport.birthYearFilter.empty')}</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {sourceBirthYears.map((year) => {
                        const isSelected = selectedBirthYears.includes(year);

                        return (
                          <button
                            key={year}
                            type="button"
                            className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                              isSelected
                                ? 'border-orange-600 bg-orange-600 text-white'
                                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                            }`}
                            disabled={isApplying}
                            aria-pressed={isSelected}
                            onClick={() => {
                              setSelectedBirthYears((previous) => {
                                const next = previous.includes(year)
                                  ? previous.filter((entry) => entry !== year)
                                  : [...previous, year].sort((left, right) => left - right);
                                setSelectedMemberIds(new Set());
                                return next;
                              });
                            }}
                          >
                            {year}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                          selectedBirthYears.length === 0
                            ? 'border-orange-600 bg-orange-50 text-orange-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                        }`}
                        disabled={isApplying}
                        onClick={() => {
                          setSelectedBirthYears([]);
                          setSelectedMemberIds(new Set());
                        }}
                      >
                        {t('membersImport.birthYearFilter.all')}
                      </button>
                      {selectedBirthYears.length > 0 && (
                        <button
                          type="button"
                          className="rounded-full border border-transparent px-3 py-1 text-sm text-gray-600 underline"
                          disabled={isApplying}
                          onClick={() => {
                            setSelectedBirthYears([]);
                            setSelectedMemberIds(new Set());
                          }}
                        >
                          {t('membersImport.birthYearFilter.clear')}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="secondary" size="sm" onClick={selectAll} disabled={isApplying || importableCandidates.length === 0}>
                    {t('membersImport.selectAll')}
                  </Button>
                  <Button type="button" variant="secondary" size="sm" onClick={clearSelected} disabled={isApplying || selectedCount === 0}>
                    {t('membersImport.clearSelection')}
                  </Button>
                </div>

                {importableCandidates.length === 0 ? (
                  <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                    {t('membersImport.noImportableMembers')}
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                    {importableCandidates.map((candidate) => {
                      const isSelected = selectedMemberIds.has(candidate.id);

                      return (
                        <label
                          key={`${candidate.role}:${candidate.id}`}
                          className={`block rounded border px-3 py-2 ${
                            isSelected
                              ? 'border-orange-200 bg-orange-50'
                              : 'border-gray-200 bg-white'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              className="mt-1"
                              checked={isSelected}
                              disabled={isApplying}
                              onChange={() => toggleSelectedMember(candidate.id)}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-800">
                                {candidate.firstName} {candidate.lastName}
                              </p>
                              <p className="text-xs text-gray-600">
                                {candidate.role === 'player'
                                  ? t('membersImport.role.player')
                                  : t('membersImport.role.trainer')}
                              </p>
                              <p className="text-xs text-gray-700 mt-1">{renderCandidateMeta(candidate)}</p>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          {isApplying && importProgress.total > 0 && (
            <div className="rounded border border-blue-200 bg-blue-50 px-3 py-2">
              <div className="flex justify-between text-xs text-blue-800 mb-1">
                <span>{t('membersImport.progress.label')}</span>
                <span>{t('membersImport.progress.count', { completed: importProgress.completed, total: importProgress.total })}</span>
              </div>
              <div className="h-2 rounded bg-blue-100 overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all"
                  style={{ width: `${Math.min(100, Math.round((importProgress.completed / importProgress.total) * 100))}%` }}
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.min(100, Math.round((importProgress.completed / importProgress.total) * 100))}
                />
              </div>
            </div>
          )}
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        {isSummaryOnly ? (
          <>
            <Button type="button" variant="secondary" onClick={handleClose}>
              {t('common.actions.close')}
            </Button>
            <Button type="button" variant="primary" onClick={startNewImport}>
              {t('membersImport.newImport')}
            </Button>
          </>
        ) : (
          <>
            <Button type="button" variant="secondary" onClick={handleClose} disabled={isApplying}>
              {t('common.actions.cancel')}
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => void applyImport()}
              disabled={!selectedSourceGroupId || selectedCount === 0 || isApplying || isLoadingSourceMembers}
            >
              {isApplying ? t('membersImport.applying') : t('membersImport.apply')}
            </Button>
          </>
        )}
      </ModalFooter>
    </Modal>
  );
}
