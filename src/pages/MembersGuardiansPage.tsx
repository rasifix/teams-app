import { useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ManageGuardiansModal from '../components/ManageGuardiansModal';
import { Alert, Button, EmptyState, Panel, PanelTitle } from '../components/ui';
import { usePlayers, useTrainers } from '../store';
import { selectUniqueMemberGuardians, type MemberGuardianCard } from '../store/selectors/memberGuardiansSelectors';
import { selectExistingGuardianUsers } from '../store/selectors/guardianAssignmentSelectors';
import { selectDuplicateGuardianGroups } from '../store/selectors/guardianDuplicateSelectors';
import type { Guardian } from '../types';
import type { MembersOutletContext } from './MembersPage';

export default function MembersGuardiansPage() {
  const { t } = useTranslation();
  const { players, spondLinked } = useOutletContext<MembersOutletContext>();
  const { trainers } = useTrainers();
  const { editGuardianForPlayer, mergeGuardianDuplicates } = usePlayers();

  const [editingRow, setEditingRow] = useState<MemberGuardianCard | null>(null);
  const [guardianActionError, setGuardianActionError] = useState<string | null>(null);
  const [resolvingDuplicateKey, setResolvingDuplicateKey] = useState<string | null>(null);

  const guardians = useMemo(() => selectUniqueMemberGuardians(players), [players]);
  const existingGuardianUsers = useMemo(() => selectExistingGuardianUsers(players, trainers), [players, trainers]);
  const duplicateGuardianGroups = useMemo(() => selectDuplicateGuardianGroups(players), [players]);

  const selectedPlayerGuardians = useMemo(() => {
    if (!editingRow) {
      return [];
    }

    return players.find((player) => player.id === editingRow.primaryPlayerId)?.guardians || [];
  }, [editingRow, players]);

  const handleEditGuardian = async (
    guardianId: string,
    guardianData: Pick<Guardian, 'firstName' | 'lastName' | 'email'>
  ): Promise<boolean> => {
    if (!editingRow) {
      return false;
    }

    setGuardianActionError(null);

    const success = await editGuardianForPlayer(
      editingRow.primaryPlayerId,
      guardianId,
      guardianData,
      {
        firstName: editingRow.guardian.firstName,
        lastName: editingRow.guardian.lastName,
        email: editingRow.guardian.email,
      }
    );

    if (!success) {
      setGuardianActionError(t('playerDetail.guardians.editFailed'));
      return false;
    }

    setEditingRow(null);
    return true;
  };

  const handleResolveDuplicateGroup = async (groupKey: string) => {
    const duplicateGroup = duplicateGuardianGroups.find((group) => group.key === groupKey);
    if (!duplicateGroup) {
      return;
    }

    const targetGuardianId = duplicateGroup.recommendedGuardianId;
    setGuardianActionError(null);
    setResolvingDuplicateKey(groupKey);

    try {
      for (const guardian of duplicateGroup.guardians) {
        if (guardian.id === targetGuardianId) {
          continue;
        }

        const success = await mergeGuardianDuplicates(guardian.id, targetGuardianId);
        if (!success) {
          setGuardianActionError(t('members.guardianDuplicates.resolveFailed'));
          break;
        }
      }
    } finally {
      setResolvingDuplicateKey(null);
    }
  };

  return (
    <Panel>
        <div className="mb-5 flex items-center justify-between">
          <PanelTitle>{t('members.allGuardiansTitle', { count: guardians.length })}</PanelTitle>
        </div>

        {!spondLinked && duplicateGuardianGroups.length > 0 && (
          <Alert tone="warning" className="mb-5 space-y-2">
            <p className="text-sm font-semibold text-warning-text">
              {t('members.guardianDuplicates.detected', { count: duplicateGuardianGroups.length })}
            </p>
            <div className="space-y-2">
              {duplicateGuardianGroups.map((group) => {
                const isResolving = resolvingDuplicateKey === group.key;
                return (
                  <div key={group.key} className="flex items-center justify-between gap-3 rounded-xl border border-warning-border bg-surface px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-sm text-content-strong truncate">
                        {group.firstName} {group.lastName} ({group.email})
                      </p>
                      <p className="text-xs text-content-muted">
                        {t('members.guardianDuplicates.groupMeta', {
                          guardianCount: group.guardians.length,
                          playerCount: group.linkedPlayerCount,
                        })}
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={Boolean(resolvingDuplicateKey)}
                      onClick={() => {
                        void handleResolveDuplicateGroup(group.key);
                      }}
                    >
                      {isResolving
                        ? t('members.guardianDuplicates.resolving')
                        : t('members.guardianDuplicates.resolveAction')}
                    </Button>
                  </div>
                );
              })}
            </div>
          </Alert>
        )}

        {guardianActionError && (
          <Alert>
            {guardianActionError}
          </Alert>
        )}

        {guardians.length === 0 ? (
          <EmptyState>
            <p>{t('members.list.emptyGuardians')}</p>
          </EmptyState>
        ) : (
          <>
            <div className="space-y-2 md:hidden">
              {guardians.map((row) => (
                <div
                  key={row.guardian.id}
                  className="rounded-2xl border border-edge bg-surface p-4"
                >
                  <p className="text-sm font-semibold text-content-strong">
                    {row.guardian.firstName} {row.guardian.lastName}
                  </p>
                  <p className="mt-0.5 text-xs text-content-subtle">
                    {row.guardian.email || t('members.guardians.noEmail')}
                  </p>
                  <div className="mt-2 text-xs text-content-muted">
                    <span className="font-medium">{t('members.guardians.tablePlayers')}:</span>{' '}
                    {row.playerRefs.map((playerRef, index) => (
                      <span key={playerRef.playerId}>
                        <Link
                          to={`/players/${playerRef.playerId}`}
                          className="font-medium text-brand-text hover:text-brand-text hover:underline"
                        >
                          {playerRef.playerFirstName} {playerRef.playerLastName}
                        </Link>
                        {index < row.playerRefs.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                  {!spondLinked && (
                    <div className="mt-3">
                      <Button variant="secondary" size="sm" onClick={() => setEditingRow(row)}>
                        {t('common.actions.edit')}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto rounded-2xl border border-edge md:block">
              <table className="min-w-full divide-y divide-edge">
                <thead className="bg-surface-subtle">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-content-subtle">
                      {t('members.guardians.tableGuardian')}
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-content-subtle">
                      {t('members.guardians.tableEmail')}
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-content-subtle">
                      {t('members.guardians.tablePlayers')}
                    </th>
                    {!spondLinked && (
                      <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-content-subtle">
                        {t('members.guardians.tableActions')}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-edge bg-surface">
                  {guardians.map((row) => (
                    <tr key={row.guardian.id} className="transition-colors hover:bg-surface-subtle">
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-content-strong">
                        {row.guardian.firstName} {row.guardian.lastName}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-content-subtle">
                        {row.guardian.email || t('members.guardians.noEmail')}
                      </td>
                      <td className="px-4 py-3 text-sm text-content-muted">
                        <div className="flex flex-wrap gap-x-2 gap-y-1">
                          {row.playerRefs.map((playerRef) => (
                            <Link
                              key={playerRef.playerId}
                              to={`/players/${playerRef.playerId}`}
                              className="font-medium text-brand-text hover:text-brand-text hover:underline"
                            >
                              {playerRef.playerFirstName} {playerRef.playerLastName}
                            </Link>
                          ))}
                        </div>
                      </td>
                      {!spondLinked && (
                        <td className="px-4 py-3 text-sm">
                          <Button variant="secondary" size="sm" onClick={() => setEditingRow(row)}>
                            {t('common.actions.edit')}
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      <ManageGuardiansModal
        isOpen={Boolean(editingRow)}
        onClose={() => setEditingRow(null)}
        guardians={selectedPlayerGuardians}
        existingUsers={existingGuardianUsers}
        onAssign={async () => false}
        editingGuardian={editingRow?.guardian || null}
        onEdit={handleEditGuardian}
      />
    </Panel>
  );
}
