import { useParams, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useEvents, usePlayers, useTrainers, useAppLoading, useAppHasErrors, useAppErrors, useGroupPeriods, useGroup } from '../store';
import type { Guardian, Player } from '../types';
import Level from '../components/Level';
import { Card, CardBody, CardTitle, DateColumn } from '../components/ui';
import AddPlayerModal from '../components/AddPlayerModal';
import ConfirmDialog from '../components/ConfirmDialog';
import PlayerEventHistory from '../components/PlayerEventHistory';
import ManageGuardiansModal from '../components/ManageGuardiansModal';
import { useAuth } from '../hooks/useAuth';
import { canManageGuardians, isPlayerUnderage } from '../utils/guardians';
import {
  selectFutureEventsWithoutInvitation,
  selectGroupedPlayerEventHistory,
  selectPlayerEventHistory,
} from '../store/selectors/playerDetailSelectors';

export default function PlayerDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Use store hooks
  const { events } = useEvents();
  const { updatePlayer, deletePlayer, getPlayerById, addGuardianToPlayer, deleteGuardianFromPlayer, editGuardianForPlayer } = usePlayers();
  const { trainers } = useTrainers();
  const group = useGroup();
  const { user } = useAuth();
  const groupPeriods = useGroupPeriods();
  const isLoading = useAppLoading();
  const hasErrors = useAppHasErrors();
  const errors = useAppErrors();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isGuardianModalOpen, setIsGuardianModalOpen] = useState(false);
  const [editingGuardian, setEditingGuardian] = useState<Guardian | null>(null);
  const [guardianToRemove, setGuardianToRemove] = useState<Guardian | null>(null);
  const [guardianActionError, setGuardianActionError] = useState<string | null>(null);

  // Get player from store
  const player = id ? getPlayerById(id) : null;
  
  // Determine loading and error states
  const loading = isLoading;
  const error = !id ? t('playerDetail.errors.noPlayerId') : 
               (!player && !loading) ? t('playerDetail.errors.notFound') :
               errors.players || (hasErrors ? t('playerDetail.errors.failedToLoadData') : null);

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

  const guardians = player.guardians || [];
  const canManagePlayerGuardians = canManageGuardians(user, group?.id);
  const underageForGuardianAssignment = isPlayerUnderage(player);
  const playerStatus = player.status || 'active';
  const playerStatusBadgeClassName = playerStatus === 'active'
    ? 'bg-green-50 text-green-700'
    : playerStatus === 'trial'
      ? 'bg-amber-50 text-amber-700'
      : 'bg-gray-100 text-gray-700';
  const playerStatusLabel = playerStatus.charAt(0).toUpperCase() + playerStatus.slice(1);

  const playerEventHistory = useMemo(
    () => selectPlayerEventHistory(events, player.id),
    [events, player.id]
  );

  const groupedPlayerEventHistory = useMemo(
    () => selectGroupedPlayerEventHistory(groupPeriods, playerEventHistory, t('statistics.period.outsidePeriods')),
    [groupPeriods, playerEventHistory, t]
  );

  const futureEventsWithoutInvitation = useMemo(
    () => selectFutureEventsWithoutInvitation(events, player.id),
    [events, player.id]
  );

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
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeletePlayer = async () => {
    if (id) {
      const success = await deletePlayer(id);
      if (success) {
        navigate('/players');
      }
    }
  };

  const cancelDeletePlayer = () => {
    setIsDeleteConfirmOpen(false);
  };

  const handleAssignGuardian = async (guardian: Guardian): Promise<boolean> => {
    setGuardianActionError(null);
    const success = await addGuardianToPlayer(player.id, {
      firstName: guardian.firstName,
      lastName: guardian.lastName,
      email: guardian.email,
    });
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
    <div className="page-container lg:px-4 px-0">
      {/* Sub Navigation */}
      <div className="bg-gray-50 border-b border-gray-200 -mt-8 mb-6 py-3 px-4 lg:px-0 lg:rounded-t-lg">
        <div className="relative flex items-center justify-between">
          <button 
            onClick={() => navigate('/members')}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            ← {t('common.actions.back')}
          </button>
          <span className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold text-gray-900">
            {player.firstName} {player.lastName}
          </span>
          <div className="flex gap-3">
            <button 
              onClick={handleEditPlayer}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              {t('common.actions.edit')}
            </button>
            <button 
              onClick={handleDeletePlayer}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              {t('common.actions.delete')}
            </button>
          </div>
        </div>
      </div>

      {/* Player Info */}
      <div className="px-4 lg:px-0 mb-4 flex items-center gap-3">
        <span className={`text-sm px-2 py-1 rounded ${playerStatusBadgeClassName}`}>
          {playerStatusLabel}
        </span>
        {player.birthDate && (
          <span className="text-gray-600 text-sm bg-gray-100 px-2 py-1 rounded">
            {new Date(player.birthDate).toLocaleDateString()}
          </span>
        )}
        {player.preferredShirtNumber && (
          <span className="text-blue-700 text-sm bg-blue-50 px-2 py-1 rounded">
            {t('playerDetail.preferredShirtNumber', { number: player.preferredShirtNumber })}
          </span>
        )}
        <Level level={player.level} />
      </div>

      <div className="lg:mb-6">
        <Card className="lg:border border-0 lg:rounded-lg rounded-none lg:shadow shadow-none">
          <CardBody className="lg:p-6 p-4">
            <div className="flex items-center justify-between gap-3 mb-4">
              <CardTitle className="mb-0">{t('playerDetail.guardians.title', { count: guardians.length })}</CardTitle>
              <button
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
              </button>
            </div>

            {!canManagePlayerGuardians && (
              <div className="mb-3 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
                {t('playerDetail.guardians.onlyManagersManage')}
              </div>
            )}

            {!underageForGuardianAssignment && (
              <div className="mb-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
                {t('playerDetail.guardians.onlyUnderage')}
              </div>
            )}

            {guardianActionError && (
              <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {guardianActionError}
              </div>
            )}

            {guardians.length === 0 ? (
              <p className="text-sm text-gray-500">{t('playerDetail.guardians.empty')}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {guardians.map((guardian) => (
                  <div key={guardian.id} className="border border-gray-200 rounded-lg p-3 bg-white">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {guardian.firstName} {guardian.lastName}
                      </p>
                      {guardian.email && (
                        <p className="text-xs text-gray-500 mt-1">{guardian.email}</p>
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
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          {t('common.actions.edit')}
                        </button>
                        <button
                          onClick={() => setGuardianToRemove(guardian)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          {t('playerDetail.guardians.removeAction')}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <div>
        <PlayerEventHistory
          eventHistory={playerEventHistory}
          groupedEventHistory={groupedPlayerEventHistory ?? undefined}
        />
      </div>

      {/* Available Future Events Section */}
      {futureEventsWithoutInvitation.length > 0 && (
        <div className="lg:mt-6">
          <Card className="lg:border border-0 lg:rounded-lg rounded-none lg:shadow shadow-none">
            <CardBody className="lg:p-6 p-4">
              <CardTitle>{t('playerDetail.eventsWithoutInvitation')}</CardTitle>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 overflow-hidden">
                {futureEventsWithoutInvitation.map((event) => (
                  <div 
                    key={event.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer min-w-0"
                    onClick={() => navigate(`/events/${event.id}`)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Date column */}
                      <DateColumn date={event.date} />
                      
                      {/* Content and status */}
                      <div className="flex justify-between items-center flex-1 min-w-0">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate" title={event.name}>{event.name}</h3>
                          <div className="mt-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              {t('invitationStatus.notInvited')}
                            </span>
                          </div>
                        </div>
                        
                        {/* Chevron icon */}
                        <div className="flex-shrink-0 ml-2">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      <AddPlayerModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={() => {}}
        onUpdate={handleUpdatePlayer}
        editingPlayer={player}
      />

      <ManageGuardiansModal
        isOpen={isGuardianModalOpen}
        onClose={() => {
          setIsGuardianModalOpen(false);
          setEditingGuardian(null);
        }}
        guardians={guardians}
        trainers={trainers}
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
