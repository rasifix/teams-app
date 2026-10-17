import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { selectIsSpondLinked } from '../store/selectors/squadSettingsSelectors';
import { useActivities, usePlayers, useTrainers, useAppLoading, useAppHasErrors, useAppErrors, useSquadPeriods, useSquad, useAppInitialized } from '../store';
import type { Guardian, Player } from '../types';
import Level from '../components/Level';
import { ActionCard, ActionCardTitle, Alert, Badge, Button, DateColumn, EmptyState, Page, PageActions, PageHeader, PageHeaderContent, PageTitle, PageToolbar, Panel, PanelActions, PanelHeader, PanelTitle } from '../components/ui';
import AddPlayerModal from '../components/AddPlayerModal';
import ConfirmDialog from '../components/ConfirmDialog';
import PlayerEventHistory from '../components/PlayerEventHistory';
import ManageGuardiansModal from '../components/ManageGuardiansModal';
import { useAuth } from '../hooks/useAuth';
import { canManageGuardians, isPlayerUnderage } from '../utils/guardians';
import {
  PLAYER_DELETE_ROLE_CONSTRAINT_ERROR_MESSAGE,
  PLAYER_DELETE_TEAM_ASSIGNMENT_CONSTRAINT_ERROR_MESSAGE,
} from '../store/useStore';
import {
  selectFutureEventsWithoutInvitation,
  selectGroupedPlayerEventHistory,
  selectPlayerEventHistory,
} from '../store/selectors/playerDetailSelectors';
import { selectExistingGuardianUsers } from '../store/selectors/guardianAssignmentSelectors';
import { getActivityDate } from '../store/selectors/activitySelectors';

export default function PlayerDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Use store hooks
  const { activities: events } = useActivities();
  const { players, updatePlayer, deletePlayer, getPlayerById, addGuardianToPlayer, deleteGuardianFromPlayer, editGuardianForPlayer } = usePlayers();
  const { trainers } = useTrainers();
  const squad = useSquad();
  const isInitialized = useAppInitialized();
  const { user } = useAuth();
  const squadPeriods = useSquadPeriods();
  const isLoading = useAppLoading();
  const hasErrors = useAppHasErrors();
  const errors = useAppErrors();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isGuardianModalOpen, setIsGuardianModalOpen] = useState(false);
  const [editingGuardian, setEditingGuardian] = useState<Guardian | null>(null);
  const [guardianToRemove, setGuardianToRemove] = useState<Guardian | null>(null);
  const [guardianActionError, setGuardianActionError] = useState<string | null>(null);
  const [deleteActionError, setDeleteActionError] = useState<string | null>(null);

  // Get player from store
  const player = id ? getPlayerById(id) : null;
  
  // Determine loading and error states
  const loading = isLoading;
  const error = !id ? t('playerDetail.errors.noPlayerId') : 
               (!player && !loading) ? t('playerDetail.errors.notFound') :
               errors.players || (hasErrors ? t('playerDetail.errors.failedToLoadData') : null);

  useEffect(() => {
    if (isInitialized && !loading && id && !player) {
      navigate('/members/players', { replace: true });
    }
  }, [isInitialized, loading, id, player, navigate]);

  const guardians = player?.guardians || [];
  const spondLinked = selectIsSpondLinked(squad);
  const canManagePlayerGuardians = !spondLinked && canManageGuardians(user, squad, trainers);
  const underageForGuardianAssignment = player ? isPlayerUnderage(player) : false;
  const playerStatus = player?.status || 'active';
  const playerStatusTone = playerStatus === 'active' ? 'success' : playerStatus === 'trial' ? 'warning' : 'neutral';
  const playerStatusLabel = t(`playerModal.status.${playerStatus}`);

  const playerEventHistory = useMemo(
    () => (player ? selectPlayerEventHistory(events, player.id) : []),
    [events, player]
  );

  const groupedPlayerEventHistory = useMemo(
    () => selectGroupedPlayerEventHistory(squadPeriods, playerEventHistory, t('statistics.period.outsidePeriods')),
    [squadPeriods, playerEventHistory, t]
  );

  const futureEventsWithoutInvitation = useMemo(
    () => (player ? selectFutureEventsWithoutInvitation(events, player.id) : []),
    [events, player]
  );

  const existingGuardianUsers = useMemo(
    () => selectExistingGuardianUsers(players, trainers),
    [players, trainers]
  );

  if (loading) {
    return (
      <Page>
        <EmptyState>
          <p>{t('playerDetail.loading')}</p>
        </EmptyState>
      </Page>
    );
  }

  if (error) {
    if (isInitialized && id && !player && !loading) {
      return null;
    }

    return (
      <Page>
        <EmptyState>
          <p>{t('common.errors.errorWithMessage', { message: error })}</p>
        </EmptyState>
      </Page>
    );
  }

  if (!player) {
    return (
      <Page>
        <EmptyState>
          <p>{t('playerDetail.notFound')}</p>
        </EmptyState>
      </Page>
    );
  }

  const handleEditPlayer = () => {
    setIsEditModalOpen(true);
  };

  const handleUpdatePlayer = async (playerId: string, playerData: Omit<Player, 'id'>) => {
    const success = await updatePlayer(playerId, playerData);
    if (success) {
      setIsEditModalOpen(false);
      // Player data will be automatically updated in the store
    }
  };

  const handleDeletePlayer = () => {
    setDeleteActionError(null);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeletePlayer = async () => {
    if (id) {
      try {
        const success = await deletePlayer(id);
        if (success) {
          setIsDeleteConfirmOpen(false);
          navigate('/members/players', { replace: true });
          return;
        }

        setDeleteActionError(t('playerDetail.errors.deleteFailed'));
      } catch (error) {
        if (error instanceof Error && error.message === PLAYER_DELETE_ROLE_CONSTRAINT_ERROR_MESSAGE) {
          setDeleteActionError(t('playerDetail.errors.deleteUnexpectedRoles'));
        } else if (error instanceof Error && error.message === PLAYER_DELETE_TEAM_ASSIGNMENT_CONSTRAINT_ERROR_MESSAGE) {
          setDeleteActionError(t('playerDetail.errors.deleteBlockedPastTeamAssignments'));
        } else {
          setDeleteActionError(t('playerDetail.errors.deleteFailed'));
        }
      }
    }
  };

  const cancelDeletePlayer = () => {
    setIsDeleteConfirmOpen(false);
  };

  const handleAssignGuardian = async (guardian: Guardian): Promise<boolean> => {
    setGuardianActionError(null);
    const guardianPayload = guardian.isDocumentedOnly
      ? {
          firstName: guardian.firstName,
          lastName: guardian.lastName,
          email: guardian.email,
        }
      : {
          guardianId: guardian.id,
        };

    const success = await addGuardianToPlayer(player.id, guardianPayload);
    if (!success) {
      setGuardianActionError(t('playerDetail.guardians.assignFailed'));
      return false;
    }
    return true;
  };

  const handleEditGuardian = async (
    guardianId: string,
    guardianData: Pick<Guardian, 'firstName' | 'lastName' | 'email'>
  ): Promise<boolean> => {
    if (!editingGuardian) {
      return false;
    }

    setGuardianActionError(null);
    const success = await editGuardianForPlayer(
      player.id,
      guardianId,
      guardianData,
      {
        firstName: editingGuardian.firstName,
        lastName: editingGuardian.lastName,
        email: editingGuardian.email,
      }
    );

    if (!success) {
      setGuardianActionError(t('playerDetail.guardians.editFailed'));
      return false;
    }

    setEditingGuardian(null);
    return true;
  };

  const confirmRemoveGuardian = async () => {
    if (!guardianToRemove) {
      return;
    }

    setGuardianActionError(null);
    const success = await deleteGuardianFromPlayer(player.id, guardianToRemove.id);
    if (!success) {
      setGuardianActionError(t('playerDetail.guardians.removeFailed'));
      return;
    }

    setGuardianToRemove(null);
  };

  return (
    <Page>
      <PageToolbar>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/members')}
          >
            ← {t('common.actions.back')}
          </Button>
          <div className="layout-cluster">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleEditPlayer}
            >
              {t('common.actions.edit')}
            </Button>
            {!spondLinked && (
              <Button
                variant="dangerGhost"
                size="sm"
                onClick={handleDeletePlayer}
              >
                {t('common.actions.delete')}
              </Button>
            )}
          </div>
      </PageToolbar>
      <PageHeader>
          <PageHeaderContent>
            <p className="eyebrow">{t('domain.player')}</p>
            <PageTitle>{player.firstName} {player.lastName}</PageTitle>
          </PageHeaderContent>
          <PageActions>
            <Badge tone={playerStatusTone}>
              {playerStatusLabel}
            </Badge>
            {player.birthDate && (
              <Badge>
                {new Date(player.birthDate).toLocaleDateString()}
              </Badge>
            )}
            {player.preferredShirtNumber && (
              <Badge tone="info">
                {t('playerDetail.preferredShirtNumber', { number: player.preferredShirtNumber })}
              </Badge>
            )}
            <Level level={player.level} />
          </PageActions>
      </PageHeader>

      {deleteActionError && (
        <Alert className="mb-5">
          {deleteActionError}
        </Alert>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start">
        <Panel className="lg:col-start-2">
            <PanelHeader>
              <PanelTitle>{t('playerDetail.guardians.title', { count: guardians.length })}</PanelTitle>
              <PanelActions>
              {!spondLinked && <Button
                size="sm"
                onClick={() => {
                  setGuardianActionError(null);
                  setIsGuardianModalOpen(true);
                }}
                disabled={!canManagePlayerGuardians || !underageForGuardianAssignment}
                title={!canManagePlayerGuardians
                  ? t('playerDetail.guardians.onlyManagers')
                  : (!underageForGuardianAssignment ? t('playerDetail.guardians.onlyUnderage') : t('playerDetail.guardians.assignAction'))}
              >
                {t('playerDetail.guardians.addAction')}
              </Button>}
              </PanelActions>
            </PanelHeader>

            {!spondLinked && !canManagePlayerGuardians && (
              <Alert tone="warning" className="mb-3">
                {t('playerDetail.guardians.onlyManagersManage')}
              </Alert>
            )}

            {!spondLinked && !underageForGuardianAssignment && (
              <Alert tone="info" className="mb-3">
                {t('playerDetail.guardians.onlyUnderage')}
              </Alert>
            )}

            {guardianActionError && (
              <Alert className="mb-3">
                {guardianActionError}
              </Alert>
            )}

            {guardians.length === 0 ? (
              <EmptyState>{t('playerDetail.guardians.empty')}</EmptyState>
            ) : (
              <div className="space-y-2">
                {guardians.map((guardian) => (
                  <div key={guardian.id} className="rounded-2xl border border-edge bg-surface-subtle p-4">
                    <div>
                      <p className="text-sm font-semibold text-content-strong">
                        {guardian.firstName} {guardian.lastName}
                      </p>
                      {guardian.email && (
                        <p className="mt-1 text-xs text-content-subtle">{guardian.email}</p>
                      )}
                    </div>
                    {canManagePlayerGuardians && (
                      <div className="mt-3 flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setGuardianActionError(null);
                            setEditingGuardian(guardian);
                            setIsGuardianModalOpen(true);
                          }}
                        >
                          {t('common.actions.edit')}
                        </Button>
                        <Button
                          variant="dangerGhost"
                          size="sm"
                          onClick={() => setGuardianToRemove(guardian)}
                        >
                          {t('playerDetail.guardians.removeAction')}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
        </Panel>

        <PlayerEventHistory
          eventHistory={playerEventHistory}
          groupedEventHistory={groupedPlayerEventHistory ?? undefined}
          className="lg:col-start-1 lg:row-start-1"
        />
      </div>

      {/* Available Future Events Section */}
      {futureEventsWithoutInvitation.length > 0 && (
        <Panel className="mt-5">
              <PanelHeader><PanelTitle>{t('playerDetail.eventsWithoutInvitation')}</PanelTitle></PanelHeader>
              <div className="grid max-w-3xl grid-cols-1 gap-3">
                {futureEventsWithoutInvitation.map((event) => (
                  <ActionCard
                    key={event.id}
                    leading={<DateColumn date={getActivityDate(event)} />}
                    onClick={() => navigate(`/events/${event.id}`)}
                  >
                          <ActionCardTitle title={event.name}>{event.name}</ActionCardTitle>
                          <div className="mt-2">
                            <Badge>
                              {t('invitationStatus.notInvited')}
                            </Badge>
                          </div>
                  </ActionCard>
                ))}
              </div>
        </Panel>
      )}

      <AddPlayerModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={() => {}}
        onUpdate={handleUpdatePlayer}
        editingPlayer={player}
        syncedFieldsReadOnly={spondLinked}
      />

      <ManageGuardiansModal
        isOpen={isGuardianModalOpen}
        onClose={() => {
          setIsGuardianModalOpen(false);
          setEditingGuardian(null);
        }}
        guardians={guardians}
        existingUsers={existingGuardianUsers}
        onAssign={handleAssignGuardian}
        editingGuardian={editingGuardian}
        onEdit={handleEditGuardian}
      />

      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title={t('members.deletePlayerTitle')}
        message={t('members.deletePlayerMessage', { firstName: player.firstName, lastName: player.lastName })}
        onConfirm={confirmDeletePlayer}
        onCancel={cancelDeletePlayer}
      />

      <ConfirmDialog
        isOpen={Boolean(guardianToRemove)}
        title={t('playerDetail.guardians.removeTitle')}
        message={t('playerDetail.guardians.removeMessage', {
          firstName: guardianToRemove?.firstName,
          lastName: guardianToRemove?.lastName,
        })}
        confirmText={t('playerDetail.guardians.removeAction')}
        cancelText={t('common.actions.cancel')}
        onConfirm={confirmRemoveGuardian}
        onCancel={() => setGuardianToRemove(null)}
        confirmButtonColor="red"
      />
    </Page>
  );
}
