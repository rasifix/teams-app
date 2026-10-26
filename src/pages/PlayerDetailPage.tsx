import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { selectIsSpondLinked } from '../store/selectors/squadSettingsSelectors';
import { useActivities, usePlayers, useTrainers, useAppLoading, useAppHasErrors, useAppErrors, useSquadPeriods, useSquad, useAppInitialized } from '../store';
import type { Guardian, Player } from '../types';
import Level from '../components/Level';
import { Alert, Badge, Button, Cluster, ContentGrid, EmptyState, Page, PageActions, PageHeader, PageHeaderContent, PageTitle, PageToolbar } from '../components/ui';
import AddPlayerModal from '../components/AddPlayerModal';
import ConfirmDialog from '../components/ConfirmDialog';
import PlayerGuardiansSection from '../components/playerDetail/PlayerGuardiansSection';
import PlayerDetailHistorySections from '../components/playerDetail/PlayerDetailHistorySections';
import ManageGuardiansModal from '../components/ManageGuardiansModal';
import { useAuth } from '../hooks/useAuth';
import { canManageGuardians, isPlayerUnderage } from '../utils/guardians';
import {
  PLAYER_DELETE_ROLE_CONSTRAINT_ERROR_MESSAGE,
  PLAYER_DELETE_TEAM_ASSIGNMENT_CONSTRAINT_ERROR_MESSAGE,
} from '../store/useStore';
import {
  selectFutureEventsWithoutInvitation,
  selectGroupedPlayerActivityHistory,
  selectPlayerActivityHistory,
} from '../store/selectors/playerDetailSelectors';
import { selectExistingGuardianUsers } from '../store/selectors/guardianAssignmentSelectors';

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
  const error = !id ? t('page.playerDetail.errors.noPlayerId') : 
               (!player && !loading) ? t('page.playerDetail.errors.notFound') :
               errors.players || (hasErrors ? t('common.errors.failedToLoadData') : null);

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
  const playerStatusLabel = t(`domain.player.status.${playerStatus}`);

  const playerEventHistory = useMemo(
    () => (player ? selectPlayerActivityHistory(events, player.id) : []),
    [events, player]
  );

  const groupedPlayerActivityHistory = useMemo(
    () => selectGroupedPlayerActivityHistory(squadPeriods, playerEventHistory, t('page.statistics.period.outsidePeriods')),
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
          <p>{t('page.playerDetail.loading')}</p>
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
          <p>{t('page.playerDetail.notFound')}</p>
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

        setDeleteActionError(t('page.playerDetail.errors.deleteFailed'));
      } catch (error) {
        if (error instanceof Error && error.message === PLAYER_DELETE_ROLE_CONSTRAINT_ERROR_MESSAGE) {
          setDeleteActionError(t('page.playerDetail.errors.deleteUnexpectedRoles'));
        } else if (error instanceof Error && error.message === PLAYER_DELETE_TEAM_ASSIGNMENT_CONSTRAINT_ERROR_MESSAGE) {
          setDeleteActionError(t('page.playerDetail.errors.deleteBlockedPastTeamAssignments'));
        } else {
          setDeleteActionError(t('page.playerDetail.errors.deleteFailed'));
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
      setGuardianActionError(t('page.playerDetail.guardians.assignFailed'));
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
      setGuardianActionError(t('page.playerDetail.guardians.editFailed'));
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
      setGuardianActionError(t('page.playerDetail.guardians.removeFailed'));
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
          <Cluster gap="sm">
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
          </Cluster>
      </PageToolbar>
      <PageHeader>
          <PageHeaderContent>
            <p className="eyebrow">{t('domain.player.label')}</p>
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
                {t('page.playerDetail.preferredShirtNumber', { number: player.preferredShirtNumber })}
              </Badge>
            )}
            <Level level={player.level} />
          </PageActions>
      </PageHeader>

      {deleteActionError && (
        <Alert>
          {deleteActionError}
        </Alert>
      )}

      <ContentGrid variant="sidebarEnd">
        <PlayerDetailHistorySections
          eventHistory={playerEventHistory}
          groupedEventHistory={groupedPlayerActivityHistory ?? undefined}
          futureEventsWithoutInvitation={futureEventsWithoutInvitation}
          onOpenEvent={(eventId) => navigate(`/activities/${eventId}`)}
        />

        <PlayerGuardiansSection
          guardians={guardians}
          isSpondLinked={spondLinked}
          canManage={canManagePlayerGuardians}
          playerIsUnderage={underageForGuardianAssignment}
          error={guardianActionError}
          onAdd={() => { setGuardianActionError(null); setIsGuardianModalOpen(true); }}
          onEdit={(guardian) => { setGuardianActionError(null); setEditingGuardian(guardian); setIsGuardianModalOpen(true); }}
          onRemove={setGuardianToRemove}
        />
      </ContentGrid>

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
        title={t('page.members.deletePlayerTitle')}
        message={t('page.members.deletePlayerMessage', { firstName: player.firstName, lastName: player.lastName })}
        onConfirm={confirmDeletePlayer}
        onCancel={cancelDeletePlayer}
      />

      <ConfirmDialog
        isOpen={Boolean(guardianToRemove)}
        title={t('page.playerDetail.guardians.removeTitle')}
        message={t('page.playerDetail.guardians.removeMessage', {
          firstName: guardianToRemove?.firstName,
          lastName: guardianToRemove?.lastName,
        })}
        confirmText={t('page.playerDetail.guardians.removeAction')}
        cancelText={t('common.actions.cancel')}
        onConfirm={confirmRemoveGuardian}
        onCancel={() => setGuardianToRemove(null)}
        confirmButtonColor="red"
      />
    </Page>
  );
}
