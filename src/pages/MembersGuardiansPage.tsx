import { useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ManageGuardiansModal from '../components/ManageGuardiansModal';
import { Card, CardBody, CardTitle } from '../components/ui';
import Button from '../components/ui/Button';
import { usePlayers, useTrainers } from '../store';
import { selectUniqueMemberGuardians, type MemberGuardianCard } from '../store/selectors/memberGuardiansSelectors';
import { selectExistingGuardianUsers } from '../store/selectors/guardianAssignmentSelectors';
import { selectDuplicateGuardianGroups } from '../store/selectors/guardianDuplicateSelectors';
import type { Guardian } from '../types';
import type { MembersOutletContext } from './MembersPage';

export default function MembersGuardiansPage() {
  const { t } = useTranslation();
  const { players } = useOutletContext<MembersOutletContext>();
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
    <Card className="lg:border border-0 lg:rounded-lg rounded-none lg:shadow shadow-none">
      <CardBody className="lg:p-6 p-4">
        <div className="flex justify-between items-center mb-4">
          <CardTitle className="mb-0">{t('members.allGuardiansTitle', { count: guardians.length })}</CardTitle>
        </div>

        {duplicateGuardianGroups.length > 0 && (
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-3 space-y-2">
            <p className="text-sm text-amber-900 font-medium">
              {t('members.guardianDuplicates.detected', { count: duplicateGuardianGroups.length })}
            </p>
            <div className="space-y-2">
              {duplicateGuardianGroups.map((group) => {
                const isResolving = resolvingDuplicateKey === group.key;
                return (
                  <div key={group.key} className="flex items-center justify-between gap-3 rounded border border-amber-200 bg-white px-3 py-2">
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
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {guardianActionError}
          </div>
        )}

        {guardians.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            <p>{t('members.list.emptyGuardians')}</p>
          </div>
        ) : (
          <>
            <div className="md:hidden space-y-3">
              {guardians.map((row) => (
                <div
                  key={row.guardian.userId || row.guardian.id}
                  className="rounded-lg border border-gray-200 bg-white p-3"
                >
                  <p className="text-sm font-medium text-gray-900">
                    {row.guardian.firstName} {row.guardian.lastName}
                  </p>
                  <p className="mt-1 text-xs text-gray-600">
                    {row.guardian.email || t('members.guardians.noEmail')}
                  </p>
                  <div className="mt-2 text-xs text-gray-600">
                    <span className="font-medium">{t('members.guardians.tablePlayers')}:</span>{' '}
                    {row.playerRefs.map((playerRef, index) => (
                      <span key={playerRef.playerId}>
                        <Link
                          to={`/players/${playerRef.playerId}`}
                          className="text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          {playerRef.playerFirstName} {playerRef.playerLastName}
                        </Link>
                        {index < row.playerRefs.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3">
                    <Button variant="secondary" size="sm" onClick={() => setEditingRow(row)}>
                      {t('common.actions.edit')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto rounded-md border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      {t('members.guardians.tableGuardian')}
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      {t('members.guardians.tableEmail')}
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      {t('members.guardians.tablePlayers')}
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      {t('members.guardians.tableActions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {guardians.map((row) => (
                    <tr key={row.guardian.userId || row.guardian.id}>
                      <td className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap">
                        {row.guardian.firstName} {row.guardian.lastName}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-600 whitespace-nowrap">
                        {row.guardian.email || t('members.guardians.noEmail')}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-600">
                        <div className="flex flex-wrap gap-x-2 gap-y-1">
                          {row.playerRefs.map((playerRef) => (
                            <Link
                              key={playerRef.playerId}
                              to={`/players/${playerRef.playerId}`}
                              className="text-blue-600 hover:text-blue-700 hover:underline"
                            >
                              {playerRef.playerFirstName} {playerRef.playerLastName}
                            </Link>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-sm">
                        <Button variant="secondary" size="sm" onClick={() => setEditingRow(row)}>
                          {t('common.actions.edit')}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardBody>

      <ManageGuardiansModal
        isOpen={Boolean(editingRow)}
        onClose={() => setEditingRow(null)}
        guardians={selectedPlayerGuardians}
        existingUsers={existingGuardianUsers}
        onAssign={async () => false}
        editingGuardian={editingRow?.guardian || null}
        onEdit={handleEditGuardian}
      />
    </Card>
  );
}
