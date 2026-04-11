import { useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ManageGuardiansModal from '../components/ManageGuardiansModal';
import { Card, CardBody, CardTitle } from '../components/ui';
import Button from '../components/ui/Button';
import { usePlayers, useTrainers } from '../store';
import { selectMemberGuardians, type MemberGuardianRow } from '../store/selectors/memberGuardiansSelectors';
import type { Guardian } from '../types';
import type { MembersOutletContext } from './MembersPage';

export default function MembersGuardiansPage() {
  const { t } = useTranslation();
  const { players } = useOutletContext<MembersOutletContext>();
  const { trainers, assignTrainerRole } = useTrainers();
  const { editGuardianForPlayer } = usePlayers();

  const [editingRow, setEditingRow] = useState<MemberGuardianRow | null>(null);
  const [guardianActionError, setGuardianActionError] = useState<string | null>(null);
  const [promotingGuardianId, setPromotingGuardianId] = useState<string | null>(null);

  const guardians = useMemo(() => selectMemberGuardians(players), [players]);

  const selectedPlayerGuardians = useMemo(() => {
    if (!editingRow) {
      return [];
    }

    return players.find((player) => player.id === editingRow.playerId)?.guardians || [];
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
      editingRow.playerId,
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

  const handleAssignTrainerRole = async (row: MemberGuardianRow) => {
    const guardianMemberId = row.guardian.userId || row.guardian.id;
    setGuardianActionError(null);

    if (!guardianMemberId) {
      setGuardianActionError(t('members.guardians.assignTrainerRoleFailed'));
      return;
    }

    const alreadyTrainer = trainers.some((trainer) => trainer.id === guardianMemberId);
    if (alreadyTrainer) {
      return;
    }

    try {
      setPromotingGuardianId(guardianMemberId);
      const success = await assignTrainerRole(guardianMemberId);
      if (!success) {
        setGuardianActionError(t('members.guardians.assignTrainerRoleFailed'));
      }
    } finally {
      setPromotingGuardianId(null);
    }
  };

  return (
    <Card className="lg:border border-0 lg:rounded-lg rounded-none lg:shadow shadow-none">
      <CardBody className="lg:p-6 p-4">
        <div className="flex justify-between items-center mb-4">
          <CardTitle className="mb-0">{t('members.allGuardiansTitle', { count: guardians.length })}</CardTitle>
        </div>

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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-3 px-0">
            {guardians.map((row) => {
              const guardianMemberId = row.guardian.userId || row.guardian.id;
              const alreadyTrainer = trainers.some((trainer) => trainer.id === guardianMemberId);
              const isPromoting = promotingGuardianId === guardianMemberId;

              return (
              <div
                key={`${row.playerId}:${row.guardian.id}`}
                className="member-card relative overflow-hidden bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow p-3"
              >
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {row.guardian.firstName} {row.guardian.lastName}
                  </p>
                  {row.guardian.email ? (
                    <p className="text-xs text-gray-500 truncate">{row.guardian.email}</p>
                  ) : (
                    <p className="text-xs text-gray-400 truncate">{t('members.guardians.noEmail')}</p>
                  )}
                  <p className="text-xs text-gray-600 truncate">
                    {t('members.guardians.playerPrefix')}{' '}
                    <Link
                      to={`/players/${row.playerId}`}
                      className="text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      {row.playerFirstName} {row.playerLastName}
                    </Link>
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setEditingRow(row)}>
                    {t('common.actions.edit')}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      void handleAssignTrainerRole(row);
                    }}
                    disabled={alreadyTrainer || isPromoting}
                  >
                    {alreadyTrainer
                      ? t('members.guardians.alreadyTrainerRole')
                      : (isPromoting
                        ? t('members.guardians.assigningTrainerRole')
                        : t('members.guardians.assignTrainerRole'))}
                  </Button>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </CardBody>

      <ManageGuardiansModal
        isOpen={Boolean(editingRow)}
        onClose={() => setEditingRow(null)}
        guardians={selectedPlayerGuardians}
        trainers={trainers}
        onAssign={async () => false}
        editingGuardian={editingRow?.guardian || null}
        onEdit={handleEditGuardian}
      />
    </Card>
  );
}
