import { useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ManageGuardiansModal from '../components/ManageGuardiansModal';
import Button from '../components/ui/Button';
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
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_16px_40px_-32px_rgba(15,29,38,.45)] sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">{t('members.allGuardiansTitle', { count: guardians.length })}</h2>
        </div>

        {!spondLinked && duplicateGuardianGroups.length > 0 && (
          <div className="mb-5 space-y-2 rounded-2xl border border-amber-200 bg-amber-50/70 p-3">
            <p className="text-sm font-semibold text-amber-900">
              {t('members.guardianDuplicates.detected', { count: duplicateGuardianGroups.length })}
            </p>
            <div className="space-y-2">
              {duplicateGuardianGroups.map((group) => {
                const isResolving = resolvingDuplicateKey === group.key;
                return (
                  <div key={group.key} className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-white px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-sm text-gray-900 truncate">
                        {group.firstName} {group.lastName} ({group.email})
                      </p>
                      <p className="text-xs text-gray-600">
                        {t('members.guardianDuplicates.groupMeta', {
                          guardianCount: group.guardians.length,
                          playerCount: group.linkedPlayerCount,
                        })}
                      </p>
                    </div>
                    <Button
                      className="!rounded-full !bg-slate-100 !text-slate-700 hover:!bg-slate-200"
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
          </div>
        )}

        {guardianActionError && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {guardianActionError}
          </div>
        )}

        {guardians.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
            <p>{t('members.list.emptyGuardians')}</p>
          </div>
        ) : (
          <>
            <div className="space-y-2 md:hidden">
              {guardians.map((row) => (
                <div
                  key={row.guardian.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {row.guardian.firstName} {row.guardian.lastName}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {row.guardian.email || t('members.guardians.noEmail')}
                  </p>
                  <div className="mt-2 text-xs text-slate-600">
                    <span className="font-medium">{t('members.guardians.tablePlayers')}:</span>{' '}
                    {row.playerRefs.map((playerRef, index) => (
                      <span key={playerRef.playerId}>
                        <Link
                          to={`/players/${playerRef.playerId}`}
                          className="font-medium text-orange-700 hover:text-orange-800 hover:underline"
                        >
                          {playerRef.playerFirstName} {playerRef.playerLastName}
                        </Link>
                        {index < row.playerRefs.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                  {!spondLinked && (
                    <div className="mt-3">
                      <Button className="!rounded-full !bg-slate-100 !text-slate-700 hover:!bg-slate-200" variant="secondary" size="sm" onClick={() => setEditingRow(row)}>
                        {t('common.actions.edit')}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 md:block">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {t('members.guardians.tableGuardian')}
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {t('members.guardians.tableEmail')}
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {t('members.guardians.tablePlayers')}
                    </th>
                    {!spondLinked && (
                      <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {t('members.guardians.tableActions')}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {guardians.map((row) => (
                    <tr key={row.guardian.id} className="transition-colors hover:bg-slate-50/70">
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-900">
                        {row.guardian.firstName} {row.guardian.lastName}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">
                        {row.guardian.email || t('members.guardians.noEmail')}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        <div className="flex flex-wrap gap-x-2 gap-y-1">
                          {row.playerRefs.map((playerRef) => (
                            <Link
                              key={playerRef.playerId}
                              to={`/players/${playerRef.playerId}`}
                              className="font-medium text-orange-700 hover:text-orange-800 hover:underline"
                            >
                              {playerRef.playerFirstName} {playerRef.playerLastName}
                            </Link>
                          ))}
                        </div>
                      </td>
                      {!spondLinked && (
                        <td className="px-4 py-3 text-sm">
                          <Button className="!rounded-full !bg-slate-100 !text-slate-700 hover:!bg-slate-200" variant="secondary" size="sm" onClick={() => setEditingRow(row)}>
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
    </section>
  );
}
