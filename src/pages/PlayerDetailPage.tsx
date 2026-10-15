import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { selectIsSpondLinked } from '../store/selectors/groupSettingsSelectors';
import { useActivities, usePlayers, useTrainers, useAppLoading, useAppHasErrors, useAppErrors, useSquadPeriods, useSquad, useAppInitialized } from '../store';
import type { Guardian, Player } from '../types';
import Level from '../components/Level';
import { DateColumn } from '../components/ui';
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
  const playerStatusBadgeClassName = playerStatus === 'active'
    ? 'bg-green-50 text-green-700'
    : playerStatus === 'trial'
      ? 'bg-amber-50 text-amber-700'
      : 'bg-gray-100 text-gray-700';
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
      <div className="page-container">
        <div className="empty-state">
          <p>{t('playerDetail.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    if (isInitialized && id && !player && !loading) {
      return null;
    }

    return (
      <div className="page-container">
        <div className="empty-state">
          <p>{t('common.errors.errorWithMessage', { message: error })}</p>
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <p>{t('playerDetail.notFound')}</p>
        </div>
      </div>
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <header className="mb-6">
        <div className="mb-5 flex items-center justify-between border-b border-slate-200 pb-4">
          <button 
            onClick={() => navigate('/members')}
            className="text-sm font-semibold text-slate-500 transition hover:text-slate-950"
          >
            ← {t('common.actions.back')}
          </button>
          <div className="flex gap-2">
            <button 
              onClick={handleEditPlayer}
              className="btn-secondary btn-sm"
            >
              {t('common.actions.edit')}
            </button>
            {!spondLinked && (
              <button
                onClick={handleDeletePlayer}
                className="rounded-full px-3.5 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                {t('common.actions.delete')}
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.075em] text-orange-600">{t('domain.player')}</p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{player.firstName} {player.lastName}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${playerStatusBadgeClassName}`}>
              {playerStatusLabel}
            </span>
            {player.birthDate && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {new Date(player.birthDate).toLocaleDateString()}
              </span>
            )}
            {player.preferredShirtNumber && (
              <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                {t('playerDetail.preferredShirtNumber', { number: player.preferredShirtNumber })}
              </span>
            )}
            <Level level={player.level} />
          </div>
        </div>
      </header>

      {deleteActionError && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {deleteActionError}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start">
        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_16px_40px_-32px_rgba(15,29,38,.45)] sm:p-6 lg:col-start-2">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold tracking-tight text-slate-950">{t('playerDetail.guardians.title', { count: guardians.length })}</h2>
              {!spondLinked && <button
                onClick={() => {
                  setGuardianActionError(null);
                  setIsGuardianModalOpen(true);
                }}
                className="btn-primary btn-sm"
                disabled={!canManagePlayerGuardians || !underageForGuardianAssignment}
                title={!canManagePlayerGuardians
                  ? t('playerDetail.guardians.onlyManagers')
                  : (!underageForGuardianAssignment ? t('playerDetail.guardians.onlyUnderage') : t('playerDetail.guardians.assignAction'))}
              >
                {t('playerDetail.guardians.addAction')}
              </button>}
            </div>

            {!spondLinked && !canManagePlayerGuardians && (
              <div className="mb-3 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                {t('playerDetail.guardians.onlyManagersManage')}
              </div>
            )}

            {!spondLinked && !underageForGuardianAssignment && (
              <div className="mb-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                {t('playerDetail.guardians.onlyUnderage')}
              </div>
            )}

            {guardianActionError && (
              <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {guardianActionError}
              </div>
            )}

            {guardians.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">{t('playerDetail.guardians.empty')}</p>
            ) : (
              <div className="space-y-2">
                {guardians.map((guardian) => (
                  <div key={guardian.id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {guardian.firstName} {guardian.lastName}
                      </p>
                      {guardian.email && (
                        <p className="mt-1 text-xs text-slate-500">{guardian.email}</p>
                      )}
                    </div>
                    {canManagePlayerGuardians && (
                      <div className="mt-3 flex items-center gap-3">
                        <button
                          onClick={() => {
                            setGuardianActionError(null);
                            setEditingGuardian(guardian);
                            setIsGuardianModalOpen(true);
                          }}
                          className="text-sm font-semibold text-slate-600 transition hover:text-slate-950"
                        >
                          {t('common.actions.edit')}
                        </button>
                        <button
                          onClick={() => setGuardianToRemove(guardian)}
                          className="text-sm font-semibold text-red-600 transition hover:text-red-700"
                        >
                          {t('playerDetail.guardians.removeAction')}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
        </section>

        <PlayerEventHistory
          eventHistory={playerEventHistory}
          groupedEventHistory={groupedPlayerEventHistory ?? undefined}
          className="lg:col-start-1 lg:row-start-1"
        />
      </div>

      {/* Available Future Events Section */}
      {futureEventsWithoutInvitation.length > 0 && (
        <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_16px_40px_-32px_rgba(15,29,38,.45)] sm:p-6">
              <h2 className="mb-5 text-lg font-semibold tracking-tight text-slate-950">{t('playerDetail.eventsWithoutInvitation')}</h2>
              <div className="grid max-w-3xl grid-cols-1 gap-3">
                {futureEventsWithoutInvitation.map((event) => (
                  <div 
                    key={event.id}
                    className="min-w-0 cursor-pointer rounded-2xl border border-slate-200 bg-slate-50/40 p-4 transition hover:border-slate-300 hover:bg-white hover:shadow-sm"
                    onClick={() => navigate(`/events/${event.id}`)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Date column */}
                      <DateColumn date={getActivityDate(event)} />
                      
                      {/* Content and status */}
                      <div className="flex justify-between items-center flex-1 min-w-0">
                        <div className="flex-1 min-w-0">
                          <h3 className="truncate font-semibold text-slate-900" title={event.name}>{event.name}</h3>
                          <div className="mt-2">
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                              {t('invitationStatus.notInvited')}
                            </span>
                          </div>
                        </div>
                        
                        {/* Chevron icon */}
                        <div className="flex-shrink-0 ml-2">
                          <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
        </section>
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
    </div>
  );
}
