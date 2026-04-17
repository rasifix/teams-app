import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePlayers, useTrainers } from '../store';
import { useStore } from '../store/useStore';
import {
  selectPlayerImportDiff,
  selectVisiblePlayerImportRows,
  type PlayerImportDiffRow,
} from '../store/selectors/memberImportSelectors';
import { selectPlayersFromMembers } from '../store/selectors/memberSelectors';
import { parseSpondMembersCsv } from '../utils/spondCsvImport';
import { Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from './ui';
import Button from './ui/Button';
import type { Player } from '../types';

interface ImportMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ApplyResult {
  processedRows: number;
  addedPlayers: number;
  addedGuardians: number;
  filledBirthDates: number;
  failedRows: number;
}

interface ImportProgress {
  total: number;
  completed: number;
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function findPlayerIdByRow(row: PlayerImportDiffRow): string | null {
  if (row.existingPlayerId) {
    return row.existingPlayerId;
  }

  if (!row.birthDate) {
    return null;
  }

  const players = selectPlayersFromMembers(useStore.getState().members);
  const match = players.find((player: Player) => (
    normalizeName(player.firstName) === normalizeName(row.firstName)
    && normalizeName(player.lastName) === normalizeName(row.lastName)
    && player.birthDate === row.birthDate
  ));

  return match?.id ?? null;
}

export default function ImportMembersModal({ isOpen, onClose }: ImportMembersModalProps) {
  const { t } = useTranslation();
  const { players, addPlayer, updatePlayer, addGuardianToPlayer } = usePlayers();
  const { trainers } = useTrainers();

  const [fileName, setFileName] = useState('');
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [candidateRows, setCandidateRows] = useState<ReturnType<typeof parseSpondMembersCsv>['candidates']>([]);
  const [excludedRowIds, setExcludedRowIds] = useState<Set<string>>(new Set());
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress>({ total: 0, completed: 0 });
  const [applyResult, setApplyResult] = useState<ApplyResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const diff = useMemo(() => selectPlayerImportDiff(candidateRows, players, trainers), [candidateRows, players, trainers]);
  const visibleRows = useMemo(() => selectVisiblePlayerImportRows(diff.rows), [diff.rows]);

  const includedActionableRows = useMemo(() => {
    return diff.rows.filter((row) => row.isActionable && !excludedRowIds.has(row.id));
  }, [diff.rows, excludedRowIds]);

  const isSummaryOnly = Boolean(applyResult) && !isApplying;

  const resetState = () => {
    setFileName('');
    setParseErrors([]);
    setCandidateRows([]);
    setExcludedRowIds(new Set());
    setApplyResult(null);
    setIsDraggingFile(false);
    setIsApplying(false);
    setImportProgress({ total: 0, completed: 0 });
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFile = async (file: File) => {
    const content = await file.text();
    const parsed = parseSpondMembersCsv(content);

    setFileName(file.name);
    setParseErrors(parsed.parseErrors);
    setCandidateRows(parsed.candidates);
    setExcludedRowIds(new Set());
    setApplyResult(null);
  };

  const toggleExclude = (rowId: string) => {
    setExcludedRowIds((previous) => {
      const next = new Set(previous);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  };

  const excludeAll = () => {
    setExcludedRowIds(new Set(diff.rows.filter((row) => row.isActionable).map((row) => row.id)));
  };

  const includeAll = () => {
    setExcludedRowIds(new Set());
  };

  const applyDiff = async () => {
    if (includedActionableRows.length === 0) {
      return;
    }

    setIsApplying(true);
    setApplyResult(null);
    setImportProgress({ total: includedActionableRows.length, completed: 0 });

    const result: ApplyResult = {
      processedRows: 0,
      addedPlayers: 0,
      addedGuardians: 0,
      filledBirthDates: 0,
      failedRows: 0,
    };

    for (const row of includedActionableRows) {
      let rowFailed = false;
      result.processedRows += 1;

      if (row.createPlayer) {
        const playerCreated = await addPlayer(row.createPlayer);
        if (!playerCreated) {
          rowFailed = true;
        } else {
          result.addedPlayers += 1;
        }
      }

      const playerId = findPlayerIdByRow(row);
      if (!playerId) {
        rowFailed = true;
      }

      if (!rowFailed && playerId && row.fillBirthDate) {
        const currentPlayer = selectPlayersFromMembers(useStore.getState().members)
          .find((player: Player) => player.id === playerId);
        if (!currentPlayer) {
          rowFailed = true;
        }

        const status = currentPlayer?.status || 'active';
        const level = currentPlayer?.level || 1;
        const firstName = currentPlayer?.firstName || row.firstName;
        const lastName = currentPlayer?.lastName || row.lastName;
        const preferredShirtNumber = currentPlayer?.preferredShirtNumber;
        const birthYear = new Date(row.fillBirthDate).getFullYear();
        if (!rowFailed) {
          const birthDateUpdated = await updatePlayer(playerId, {
            firstName,
            lastName,
            status,
            level,
            birthDate: row.fillBirthDate,
            birthYear,
            preferredShirtNumber,
          });
          if (birthDateUpdated) {
            result.filledBirthDates += 1;
          } else {
            rowFailed = true;
          }
        }
      }

      if (!rowFailed && playerId) {
        for (const guardian of row.guardiansToAdd) {
          const guardianAdded = await addGuardianToPlayer(
            playerId,
            guardian.trainerId
              ? { guardianId: guardian.trainerId }
              : {
                  firstName: guardian.firstName,
                  lastName: guardian.lastName,
                  email: guardian.email,
                }
          );

          if (guardianAdded) {
            result.addedGuardians += 1;
          } else {
            rowFailed = true;
            break;
          }
        }
      }

      if (rowFailed) {
        result.failedRows += 1;
      }

      setImportProgress({ total: includedActionableRows.length, completed: result.processedRows });
    }

    setApplyResult(result);
    setIsApplying(false);
  };

  const startNewImport = () => {
    setFileName('');
    setParseErrors([]);
    setCandidateRows([]);
    setExcludedRowIds(new Set());
    setApplyResult(null);
    setImportProgress({ total: 0, completed: 0 });
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
              <p>{t('membersImport.result.processedRows', { count: applyResult?.processedRows || 0 })}</p>
              <p>{t('membersImport.result.addedPlayers', { count: applyResult?.addedPlayers || 0 })}</p>
              <p>{t('membersImport.result.addedGuardians', { count: applyResult?.addedGuardians || 0 })}</p>
              <p>{t('membersImport.result.filledBirthDates', { count: applyResult?.filledBirthDates || 0 })}</p>
              <p>{t('membersImport.result.failedRows', { count: applyResult?.failedRows || 0 })}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">{t('membersImport.description')}</p>

          <div
            className={`rounded border-2 border-dashed p-4 text-center transition-colors ${
              isDraggingFile ? 'border-orange-600 bg-orange-50' : 'border-gray-300 bg-gray-50'
            }`}
            onDragOver={(event) => {
              if (isApplying) {
                return;
              }
              event.preventDefault();
              setIsDraggingFile(true);
            }}
            onDragLeave={(event) => {
              if (isApplying) {
                return;
              }
              event.preventDefault();
              setIsDraggingFile(false);
            }}
            onDrop={(event) => {
              if (isApplying) {
                return;
              }
              event.preventDefault();
              setIsDraggingFile(false);
              const file = event.dataTransfer.files?.[0];
              if (file) {
                void handleFile(file);
              }
            }}
          >
            <p className="text-sm text-gray-700">{t('membersImport.dropZone')}</p>
            <p className="text-xs text-gray-500 mt-1">{t('membersImport.fileTypeHint')}</p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-3"
              disabled={isApplying}
              onClick={() => fileInputRef.current?.click()}
            >
              {t('membersImport.selectFile')}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              disabled={isApplying}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void handleFile(file);
                }
              }}
            />
          </div>

          {fileName && (
            <p className="text-xs text-gray-600">{t('membersImport.fileLoaded', { fileName })}</p>
          )}

          {parseErrors.length > 0 && (
            <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {parseErrors.map((errorCode) => (
                <p key={errorCode}>{t(`membersImport.errors.${errorCode}`)}</p>
              ))}
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

          {candidateRows.length > 0 && (
            <div className="space-y-3">
              <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700">
                <p>{t('membersImport.summary.totalRows', { count: diff.summary.totalRows })}</p>
                <p>{t('membersImport.summary.actionableRows', { count: diff.summary.actionableRows })}</p>
                <p>{t('membersImport.summary.newPlayers', { count: diff.summary.newPlayers })}</p>
                <p>{t('membersImport.summary.guardiansToAdd', { count: diff.summary.guardiansToAdd })}</p>
                <p>{t('membersImport.summary.birthDateFills', { count: diff.summary.birthDateFills })}</p>
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={includeAll} disabled={isApplying}>
                  {t('membersImport.includeAll')}
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={excludeAll} disabled={isApplying}>
                  {t('membersImport.excludeAll')}
                </Button>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {visibleRows.map((row) => {
                  const isExcluded = excludedRowIds.has(row.id);
                  const birthDateAdded = row.createPlayer?.birthDate || row.fillBirthDate;
                  return (
                    <label
                      key={row.id}
                      className={`block rounded border px-3 py-2 ${
                        row.isActionable
                          ? isExcluded
                            ? 'border-gray-200 bg-gray-100 opacity-70'
                            : 'border-orange-200 bg-orange-50'
                          : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={row.isActionable && !isExcluded}
                          disabled={!row.isActionable || isApplying}
                          onChange={() => toggleExclude(row.id)}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-800">
                            {row.firstName} {row.lastName}
                            <span className="text-xs font-normal text-gray-500 ml-2">#{row.sourceRow}</span>
                          </p>
                          <p className="text-xs text-gray-600">
                            {row.createPlayer
                              ? t('membersImport.row.newPlayer')
                              : row.existingPlayerId
                                ? t('membersImport.row.existingPlayer')
                                : t('membersImport.row.unresolved')}
                          </p>
                          {(birthDateAdded || row.guardiansToAdd.length > 0) && (
                            <p className="text-xs text-gray-700 mt-1">
                              {birthDateAdded && t('membersImport.row.birthDateAdded', { date: birthDateAdded })}
                              {birthDateAdded && row.guardiansToAdd.length > 0 ? ' • ' : ''}
                              {row.guardiansToAdd.length > 0 && t('membersImport.row.guardiansAdded', { count: row.guardiansToAdd.length })}
                            </p>
                          )}
                          {row.guardiansToAdd.length > 0 && (
                            <p className="text-xs text-gray-700 mt-1">
                              {t('membersImport.row.guardianNames', {
                                names: row.guardiansToAdd
                                  .map((guardian) => `${guardian.firstName} ${guardian.lastName}`)
                                  .join(', '),
                              })}
                            </p>
                          )}
                          {row.issues.length > 0 && (
                            <div className="mt-1 text-xs text-red-700 space-y-0.5">
                              {row.issues.map((issueCode) => (
                                <p key={issueCode}>{t(`membersImport.issues.${issueCode}`)}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </label>
                  );
                })}
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
              onClick={() => void applyDiff()}
              disabled={includedActionableRows.length === 0 || isApplying}
            >
              {isApplying ? t('membersImport.applying') : t('membersImport.apply')}
            </Button>
          </>
        )}
      </ModalFooter>
    </Modal>
  );
}
