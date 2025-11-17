import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useEvents, usePlayers, useTrainers, useShirtSets } from '../store';
import { Card, CardBody, CardTitle, Button } from '../components/ui';
import Level from '../components/Level';
import Strength from '../components/Strength';
import ConfirmDialog from '../components/ConfirmDialog';
import EditTeamModal from '../components/EditTeamModal';
import AssignShirtsModal from '../components/AssignShirtsModal';

export default function TeamDetailPage() {
  const { eventId, teamId } = useParams<{ eventId: string; teamId: string }>();
  const navigate = useNavigate();
  
  const { getEventById, updateEvent } = useEvents();
  const { players } = usePlayers();
  const { trainers } = useTrainers();
  const { shirtSets } = useShirtSets();
  
  const [playerToRemove, setPlayerToRemove] = useState<string | null>(null);
  const [swipedPlayerId, setSwipedPlayerId] = useState<string | null>(null);
  const [isEditTeamModalOpen, setIsEditTeamModalOpen] = useState(false);
  const [isAssignShirtsModalOpen, setIsAssignShirtsModalOpen] = useState(false);
  
  const event = eventId ? getEventById(eventId) : null;
  const team = event?.teams.find(t => t.id === teamId);
  
  const trainer = team?.trainerId ? trainers.find(t => t.id === team.trainerId) : null;
  const shirtSet = team?.shirtSetId ? shirtSets.find(s => s.id === team.shirtSetId) : null;
  const selectedPlayers = players.filter(p => team?.selectedPlayers?.includes(p.id));
  
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
        <div className="empty-state">Team not found</div>
      </div>
    );
  }
  
  const playerToRemoveData = playerToRemove ? players.find(p => p.id === playerToRemove) : null;
  
  return (
    <div className="page-container lg:px-4 px-0">
      {/* Sub Navigation */}
      <div className="bg-gray-50 border-b border-gray-200 -mt-8 mb-6 py-3 px-4 lg:px-0 lg:rounded-t-lg">
        <div className="relative flex items-center">
          <button 
            onClick={() => navigate(`/events/${eventId}`)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            ← Back
          </button>
          <span className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold text-gray-900">{team.name}</span>
        </div>
      </div>
      
      <div className="px-4 lg:px-0">
        <div className="flex justify-end items-start mb-6">
          <button
            onClick={() => setIsEditTeamModalOpen(true)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Edit
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
                <span className="font-medium text-sm">Start Time</span>
              </div>
              <div className="text-sm">
                {team.startTime}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>💪</span>
                <span className="font-medium text-sm">Strength</span>
              </div>
              <div className="text-sm">
                <Strength level={team.strength} />
              </div>
            </div>            

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>👤</span>
                <span className="font-medium text-sm">Trainer</span>
              </div>
              {trainer ? (
                <div className="text-sm">
                  {trainer.firstName} {trainer.lastName}
                </div>
              ) : (
                <div className="text-sm text-gray-500">No trainer assigned</div>
              )}
            </div>
            
            <div 
              className="flex items-center justify-between cursor-pointer hover:bg-gray-50 -mx-6 px-6 py-2 rounded transition-colors"
              onClick={() => selectedPlayers.length > 0 && setIsAssignShirtsModalOpen(true)}
            >
              <div className="flex items-center gap-2">
                <span>👕</span>
                <span className="font-medium text-sm">Shirt Set</span>
              </div>
              {shirtSet ? (
                <div className="text-sm">
                  {shirtSet.sponsor}
                </div>
              ) : (
                <div className="text-sm text-gray-500">No shirt set assigned</div>
              )}
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
                Add
              </Button>
            </div>
            
            {selectedPlayers.length === 0 ? (
              <div className="empty-state text-sm">No players selected yet</div>
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
                          Remove
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
        title="Remove Player"
        message={`Are you sure you want to remove ${playerToRemoveData?.firstName} ${playerToRemoveData?.lastName} from this team?`}
        confirmText="Remove"
        cancelText="Cancel"
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
          />
          
          <AssignShirtsModal
            isOpen={isAssignShirtsModalOpen}
            onClose={() => setIsAssignShirtsModalOpen(false)}
            onSave={handleAssignShirts}
            team={team}
            players={selectedPlayers}
            shirtSets={shirtSets}
            currentShirtSetId={team.shirtSetId}
            currentShirtAssignments={team.shirtAssignments}
          />
        </>
      )}
    </div>
  );
}
