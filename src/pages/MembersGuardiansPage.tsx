import { useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ManageGuardiansModal from '../components/ManageGuardiansModal';
import { Alert, Button, EmptyState, Panel, PanelHeader, PanelTitle } from '../components/ui';
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
        <PanelHeader>
          <PanelTitle>{t('members.allGuardiansTitle', { count: guardians.length })}</PanelTitle>
        </PanelHeader>

        {!spondLinked && duplicateGuardianGroups.length > 0 && (
          <Alert tone="warning" className="guardian-duplicates">
            <p className="font-semibold">
              {t('members.guardianDuplicates.detected', { count: duplicateGuardianGroups.length })}
            </p>
            <div className="guardian-duplicate-list">
              {duplicateGuardianGroups.map((group) => {
                const isResolving = resolvingDuplicateKey === group.key;
                return (
                  <div key={group.key} className="guardian-duplicate-row">
                    <div className="guardian-duplicate-content">
                      <p className="guardian-duplicate-name">
                        {group.firstName} {group.lastName} ({group.email})
                      </p>
                      <p className="guardian-duplicate-meta">
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
            <div className="guardian-mobile-list">
              {guardians.map((row) => (
                <div
                  key={row.guardian.id}
                  className="guardian-mobile-card"
                >
                  <p className="guardian-name">
                    {row.guardian.firstName} {row.guardian.lastName}
                  </p>
                  <p className="guardian-email">
                    {row.guardian.email || t('members.guardians.noEmail')}
                  </p>
                  <div className="guardian-players">
                    <span className="font-medium">{t('members.guardians.tablePlayers')}:</span>{' '}
                    {row.playerRefs.map((playerRef, index) => (
                      <span key={playerRef.playerId}>
                        <Link
                          to={`/players/${playerRef.playerId}`}
                          className="guardian-player-link"
                        >
                          {playerRef.playerFirstName} {playerRef.playerLastName}
                        </Link>
                        {index < row.playerRefs.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                  {!spondLinked && (
                    <div className="guardian-mobile-actions">
                      <Button variant="secondary" size="sm" onClick={() => setEditingRow(row)}>
                        {t('common.actions.edit')}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="guardian-table-container">
              <table className="guardian-table">
                <thead className="guardian-table-head">
                  <tr>
                    <th scope="col" className="guardian-table-heading">
                      {t('members.guardians.tableGuardian')}
                    </th>
                    <th scope="col" className="guardian-table-heading">
                      {t('members.guardians.tableEmail')}
                    </th>
                    <th scope="col" className="guardian-table-heading">
                      {t('members.guardians.tablePlayers')}
                    </th>
                    {!spondLinked && (
                      <th scope="col" className="guardian-table-heading">
                        {t('members.guardians.tableActions')}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="guardian-table-body">
                  {guardians.map((row) => (
                    <tr key={row.guardian.id} className="guardian-table-row">
                      <td className="guardian-table-cell guardian-table-cell--name">
                        {row.guardian.firstName} {row.guardian.lastName}
                      </td>
                      <td className="guardian-table-cell guardian-table-cell--email">
                        {row.guardian.email || t('members.guardians.noEmail')}
                      </td>
                      <td className="guardian-table-cell">
                        <div className="guardian-player-links">
                          {row.playerRefs.map((playerRef) => (
                            <Link
                              key={playerRef.playerId}
                              to={`/players/${playerRef.playerId}`}
                              className="guardian-player-link"
                            >
                              {playerRef.playerFirstName} {playerRef.playerLastName}
                            </Link>
                          ))}
                        </div>
                      </td>
                      {!spondLinked && (
                        <td className="guardian-table-cell">
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
