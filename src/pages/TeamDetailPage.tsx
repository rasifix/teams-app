import { useParams, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useEvents, usePlayers, useTrainers, useShirtSets, useMatchPlanning } from '../store';
import { Card, CardBody, CardTitle, Button } from '../components/ui';
import Level from '../components/Level';
import Strength from '../components/Strength';
import ConfirmDialog from '../components/ConfirmDialog';
import EditTeamModal from '../components/EditTeamModal';
import AssignShirtsModal from '../components/AssignShirtsModal';
import AssignTeamPropertyModal from '../components/AssignTeamPropertyModal';
import { getUsedShirtNumbersBySetId } from '../utils/shirtAssignments';
import { selectTeamAssigneeById, selectTeamAssigneeOptions } from '../store/selectors/teamTrainerSelectors';
import { selectTeamPlayersByName } from '../store/selectors/teamPlayerSelectors';

export default function TeamDetailPage() {
  const { t } = useTranslation();
  const { eventId, teamId } = useParams<{ eventId: string; teamId: string }>();
  const navigate = useNavigate();
  
  const { getEventById, updateEvent } = useEvents();
  const { players } = usePlayers();
  const { trainers } = useTrainers();
  const { shirtSets } = useShirtSets();
  const { formations } = useMatchPlanning();
  
  const [playerToRemove, setPlayerToRemove] = useState<string | null>(null);
  const [swipedPlayerId, setSwipedPlayerId] = useState<string | null>(null);
  const [isEditTeamModalOpen, setIsEditTeamModalOpen] = useState(false);
  const [isAssignShirtsModalOpen, setIsAssignShirtsModalOpen] = useState(false);
  const [isAssignTrainerModalOpen, setIsAssignTrainerModalOpen] = useState(false);
  const [isAssignFormationModalOpen, setIsAssignFormationModalOpen] = useState(false);
  
  const event = eventId ? getEventById(eventId) : null;
  const team = event?.teams.find(t => t.id === teamId);
  
  const trainerAssignee = team
    ? selectTeamAssigneeById(team.trainerId, trainers, players)
    : null;
  const shirtSet = team?.shirtSetId ? shirtSets.find(s => s.id === team.shirtSetId) : null;
  const selectedPlayers = team ? selectTeamPlayersByName(team, players) : [];
  const trainerOptions = useMemo(
    () => selectTeamAssigneeOptions(trainers, players).map((option) => ({
      value: option.id,
      label: `${option.firstName} ${option.lastName}${option.source === 'guardian' ? ` (${t('domain.guardians')})` : ''}`,
    })),
    [players, t, trainers]
  );
  const formationOptions = useMemo(
    () => formations.map((formation) => ({ value: formation.id, label: formation.name })),
    [formations]
  );
  const usedShirtNumbersBySetId = useMemo(() => {
    if (!event || !team) {
      return {} as Record<string, number[]>;
    }

    return getUsedShirtNumbersBySetId(event.teams, team.id);
  }, [event, team]);
  
  const handleRemovePlayer = async () => {
    if (!event || !eventId || !team || !playerToRemove) return;
    
    const updatedTeams = event.teams.map(t => 
      t.id === teamId 
        ? { ...t, selectedPlayers: t.selectedPlayers?.filter(id => id !== playerToRemove) || [] }
        : t
    );
    
    await updateEvent(eventId, { teams: updatedTeams });
    setPlayerToRemove(null);
    setSwipedPlayerId(null);
  };

  const handleChangeFormation = async (formationId: string | undefined) => {
    if (!event || !eventId || !team) return;

    const updatedTeams = event.teams.map(t =>
      t.id === teamId ? { ...t, formationId: formationId || null } : t
    );

    await updateEvent(eventId, { teams: updatedTeams });
  };

  const handleAssignTrainer = async (trainerId: string | undefined) => {
    if (!event || !eventId || !team) return;

    const updatedTeams = event.teams.map((candidate) => (
      candidate.id === teamId ? { ...candidate, trainerId } : candidate
    ));

    await updateEvent(eventId, { teams: updatedTeams });
  };
  
  const handleTouchStart = (playerId: string, e: React.TouchEvent) => {
    const touch = e.touches[0];
    const startX = touch.clientX;
    
    const handleTouchMove = (moveEvent: TouchEvent) => {
      const moveTouch = moveEvent.touches[0];
      const diffX = startX - moveTouch.clientX;
      
      // If swiped left more than 50px, show delete button
      if (diffX > 50 && swipedPlayerId !== playerId) {
        setSwipedPlayerId(playerId);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      }
      // If swiped right more than 30px while delete button is showing, hide it
      else if (diffX < -30 && swipedPlayerId === playerId) {
        setSwipedPlayerId(null);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      }
    };
    
    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  };
  
  const handleAddPlayers = () => {
    navigate(`/events/${eventId}/teams/${teamId}/select-players`);
  };
  
  const handleEditTeam = async (name: string, strength: number, startTime: string, trainerId?: string) => {
    if (!event || !eventId || !team) return;
    
    const updatedTeams = event.teams.map(t =>
      t.id === teamId ? { ...t, name, strength, startTime, trainerId } : t
    );
    
    await updateEvent(eventId, { teams: updatedTeams });
    setIsEditTeamModalOpen(false);
  };
  
  const handleAssignShirts = async (shirtSetId: string, assignments: Array<{ playerId: string; shirtNumber: number }>) => {
    if (!event || !eventId || !team) return;
    
    const updatedTeams = event.teams.map(t =>
      t.id === teamId ? { ...t, shirtSetId, shirtAssignments: assignments } : t
    );
    
    await updateEvent(eventId, { teams: updatedTeams });
    setIsAssignShirtsModalOpen(false);
  };
  
  if (!event || !team) {
    return (
      <div className="page-container">
        <div className="empty-state">{t('teamDetail.teamNotFound')}</div>
      </div>
    );
  }
  
  const playerToRemoveData = playerToRemove ? players.find(p => p.id === playerToRemove) : null;
  
  return (
    <div className="page-container lg:px-4 px-0">
      {/* Sub Navigation */}
      <div className="bg-gray-50 border-b border-gray-200 -mt-8 mb-6 py-3 px-4 lg:px-0 lg:rounded-t-lg">
        <div className="relative flex items-center justify-between">
          <button 
            onClick={() => navigate(`/events/${eventId}`)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            ← {t('common.actions.back')}
          </button>
          <span className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold text-gray-900">{team.name}</span>
          <button
            onClick={() => setIsEditTeamModalOpen(true)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            {t('common.actions.edit')}
          </button>
        </div>
      </div>
      
      {/* Team Details */}
      <div className="space-y-4">
        {/* Trainer and Shirt Set */}
        <Card className="lg:border border-0 lg:rounded-lg rounded-none lg:shadow shadow-none">
          <CardBody className="lg:p-6 p-4 space-y-3">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>🕐</span>
                <span className="font-medium text-sm">{t('teamModal.fields.startTime')}</span>
              </div>
              <div className="text-sm">
                {team.startTime}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>💪</span>
                <span className="font-medium text-sm">{t('teamModal.fields.strength')}</span>
              </div>
              <div className="text-sm">
                <Strength level={team.strength} className="text-xs" />
              </div>
            </div>            

            <button
              type="button"
              className="-mx-4 flex w-[calc(100%+2rem)] items-center justify-between rounded px-4 py-2 text-left transition-colors hover:bg-gray-50 lg:-mx-6 lg:w-[calc(100%+3rem)] lg:px-6"
              onClick={() => setIsAssignTrainerModalOpen(true)}
            >
              <div className="flex items-center gap-2">
                <span>👤</span>
                <span className="font-medium text-sm">{t('teamDetail.trainerLabel')}</span>
              </div>
              {trainerAssignee ? (
                <div className="text-sm">
                  {trainerAssignee.firstName} {trainerAssignee.lastName}
                </div>
              ) : (
                <div className="text-sm text-gray-500">{t('teamModal.noTrainerAssigned')}</div>
              )}
            </button>
            
            <button
              type="button"
              className="-mx-4 flex w-[calc(100%+2rem)] items-center justify-between rounded px-4 py-2 text-left transition-colors hover:bg-gray-50 disabled:cursor-default disabled:hover:bg-transparent lg:-mx-6 lg:w-[calc(100%+3rem)] lg:px-6"
              disabled={selectedPlayers.length === 0}
              onClick={() => setIsAssignShirtsModalOpen(true)}
            >
              <div className="flex items-center gap-2">
                <span>👕</span>
                <span className="font-medium text-sm">{t('teamDetail.shirtSetLabel')}</span>
              </div>
              {shirtSet ? (
                <div className="text-sm">
                  {shirtSet.sponsor}
                </div>
              ) : (
                <div className="text-sm text-gray-500">{t('teamDetail.noShirtSetAssigned')}</div>
              )}
            </button>

            {event.playingModeId && (
              <button
                type="button"
                className="-mx-4 flex w-[calc(100%+2rem)] items-center justify-between rounded px-4 py-2 text-left transition-colors hover:bg-gray-50 lg:-mx-6 lg:w-[calc(100%+3rem)] lg:px-6"
                onClick={() => setIsAssignFormationModalOpen(true)}
              >
                <div className="flex items-center gap-2">
                  <span>🧩</span>
                  <span className="font-medium text-sm">{t('teamDetail.formationLabel')}</span>
                </div>
                <span className={`text-sm ${team.formationId ? '' : 'text-gray-500'}`}>
                  {formations.find((formation) => formation.id === team.formationId)?.name ?? t('teamDetail.noFormationAssigned')}
                </span>
              </button>
            )}

            <div className="flex items-center justify-between gap-3">
              <span className="font-medium text-sm">{t('teamDetail.lineupLabel')}</span>
              <div className="flex flex-wrap justify-end gap-2">
                {event.playingModeId && team.formationId && (
                  <Button className="btn-sm" onClick={() => navigate(`/events/${eventId}/teams/${teamId}/lineup/1`)}>
                    {t('teamDetail.planLineupAction')}
                  </Button>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
        
        {/* Selected Players */}
        <Card className="lg:border border-0 lg:rounded-lg rounded-none lg:shadow shadow-none">
          <CardBody className="lg:p-6 p-4">
            <div className="flex justify-between items-center mb-4">
              <CardTitle>
                Players ({selectedPlayers.length}/{event.maxPlayersPerTeam})
              </CardTitle>
              <Button 
                onClick={handleAddPlayers}
                disabled={selectedPlayers.length >= event.maxPlayersPerTeam}
                className='btn-sm'
              >
                {t('common.actions.add')}
              </Button>
            </div>
            
            {selectedPlayers.length === 0 ? (
              <div className="empty-state text-sm">{t('teamDetail.noPlayersSelected')}</div>
            ) : (
              <div className="space-y-2">
                {selectedPlayers.map(player => {
                  const shirtAssignment = team.shirtAssignments?.find(a => a.playerId === player.id);
                  
                  return (
                    <div 
                      key={player.id}
                      className="relative overflow-hidden bg-gray-50 rounded-lg"
                    >
                      {/* Main content */}
                      <div
                        className={`flex items-center justify-between p-3 transition-transform duration-200 ${
                          swipedPlayerId === player.id ? '-translate-x-20' : 'translate-x-0'
                        }`}
                        onTouchStart={(e) => handleTouchStart(player.id, e)}
                      >
                        <div className="flex items-center gap-2 text-sm flex-1">
                          {shirtAssignment && shirtSet && (
                            <span 
                              className="flex items-center justify-center w-6 h-6 text-white font-bold rounded-full flex-shrink-0"
                              style={{ 
                                backgroundColor: shirtSet.color,
                                fontSize: '10px'
                              }}
                            >
                              {shirtAssignment.shirtNumber}
                            </span>
                          )}
                          <span className="font-medium">
                            {player.firstName} {player.lastName}
                          </span>
                          <span className="text-gray-500">
                            {player.birthDate ? new Date(player.birthDate).getFullYear() : player.birthYear}
                          </span>
                        </div>
                        <Level level={player.level} />
                      </div>
                      
                      {/* Delete button that appears on swipe */}
                      <div 
                        className={`absolute inset-y-0 right-0 flex items-center justify-center w-20 bg-red-600 transition-opacity duration-200 ${
                          swipedPlayerId === player.id ? 'opacity-100' : 'opacity-0 pointer-events-none'
                        }`}
                      >
                        <button
                          className="flex items-center justify-center w-full h-full text-white font-medium text-sm"
                          onClick={() => setPlayerToRemove(player.id)}
                        >
                          {t('teamDetail.removeAction')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
      
      <ConfirmDialog
        isOpen={!!playerToRemove}
        title={t('teamDetail.removePlayerTitle')}
        message={t('teamDetail.removePlayerMessage', {
          firstName: playerToRemoveData?.firstName,
          lastName: playerToRemoveData?.lastName,
        })}
        confirmText={t('teamDetail.removeAction')}
        cancelText={t('common.actions.cancel')}
        onConfirm={handleRemovePlayer}
        onCancel={() => setPlayerToRemove(null)}
      />
      
      {team && (
        <>
          <EditTeamModal
            isOpen={isEditTeamModalOpen}
            onClose={() => setIsEditTeamModalOpen(false)}
            onSave={handleEditTeam}
            currentName={team.name}
            currentStrength={team.strength}
            currentStartTime={team.startTime}
            currentTrainerId={team.trainerId}
            currentLocation={team.location}
            showTrainerAssignee={false}
          />
          
          <AssignShirtsModal
            isOpen={isAssignShirtsModalOpen}
            onClose={() => setIsAssignShirtsModalOpen(false)}
            onSave={handleAssignShirts}
            team={team}
            usedShirtNumbersBySetId={usedShirtNumbersBySetId}
            players={selectedPlayers}
            shirtSets={shirtSets}
            currentShirtSetId={team.shirtSetId}
            currentShirtAssignments={team.shirtAssignments}
          />

          <AssignTeamPropertyModal
            isOpen={isAssignTrainerModalOpen}
            title={t('teamDetail.assignTrainerTitle')}
            label={t('teamDetail.trainerLabel')}
            emptyOptionLabel={t('teamModal.noTrainerAssigned')}
            currentValue={team.trainerId}
            options={trainerOptions}
            onClose={() => setIsAssignTrainerModalOpen(false)}
            onSave={handleAssignTrainer}
          />

          <AssignTeamPropertyModal
            isOpen={isAssignFormationModalOpen}
            title={t('teamDetail.assignFormationTitle')}
            label={t('teamDetail.formationLabel')}
            emptyOptionLabel={t('teamDetail.noFormationAssigned')}
            currentValue={team.formationId}
            options={formationOptions}
            onClose={() => setIsAssignFormationModalOpen(false)}
            onSave={handleChangeFormation}
          />
        </>
      )}
    </div>
  );
}
