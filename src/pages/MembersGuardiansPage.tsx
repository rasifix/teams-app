import { useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ManageGuardiansModal from '../components/ManageGuardiansModal';
import { Alert, Button, Card, CardBody, CardFooter, Cluster, EmptyState, EntityContent, EntityMeta, EntityTitle, IconTile, Panel, PanelHeader, PanelTitle } from '../components/ui';
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
      setGuardianActionError(t('page.playerDetail.guardians.editFailed'));
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
          setGuardianActionError(t('page.members.guardianDuplicates.resolveFailed'));
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
          <PanelTitle>{t('page.members.allGuardiansTitle', { count: guardians.length })}</PanelTitle>
        </PanelHeader>

        {!spondLinked && duplicateGuardianGroups.length > 0 && (
          <Alert tone="warning">
            <p><strong>{t('page.members.guardianDuplicates.detected', { count: duplicateGuardianGroups.length })}</strong></p>
            <div className="ui-stack ui-stack--sm">
              {duplicateGuardianGroups.map((group) => {
                const isResolving = resolvingDuplicateKey === group.key;
                return (
                  <div key={group.key} className="guardian-duplicate-row">
                    <div className="ui-entity-content">
                      <p className="ui-entity-title">
                        {group.firstName} {group.lastName} ({group.email})
                      </p>
                      <p className="text-caption">
                        {t('page.members.guardianDuplicates.groupMeta', {
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
                        ? t('page.members.guardianDuplicates.resolving')
                        : t('page.members.guardianDuplicates.resolveAction')}
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
            <p>{t('page.members.list.emptyGuardians')}</p>
          </EmptyState>
        ) : (
          <div className="member-grid">
            {guardians.map((row) => (
              <Card key={row.guardian.id} variant="flat-interactive">
                <CardBody compact>
                  <Cluster gap="base" wrap={false}>
                    <IconTile size="sm">
                      <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2 19 5v6c0 4.5-2.7 8-7 10-4.3-2-7-5.5-7-10V5l7-3Z" />
                        <circle cx="12" cy="9" r="2" />
                        <path strokeLinecap="round" d="M8.5 16c0-2.2 1.4-3.5 3.5-3.5s3.5 1.3 3.5 3.5" />
                      </svg>
                    </IconTile>
                    <EntityContent>
                      <EntityTitle>{row.guardian.firstName} {row.guardian.lastName}</EntityTitle>
                      <EntityMeta>{row.guardian.email || t('page.members.guardians.noEmail')}</EntityMeta>
                      {row.playerRefs.map((playerRef) => (
                        <EntityMeta key={playerRef.playerId}>
                          <Link to={`/players/${playerRef.playerId}`} className="text-link">
                            {playerRef.playerFirstName} {playerRef.playerLastName}
                          </Link>
                        </EntityMeta>
                      ))}
                    </EntityContent>
                  </Cluster>
                </CardBody>
                {!spondLinked && (
                  <CardFooter>
                    <Button variant="secondary" size="sm" onClick={() => setEditingRow(row)}>
                      {t('common.actions.edit')}
                    </Button>
                  </CardFooter>
                )}
              </Card>
            ))}
          </div>
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
