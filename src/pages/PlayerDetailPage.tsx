import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useEvents, usePlayers, useAppLoading, useAppHasErrors, useAppErrors } from '../store';
import type { Player, PlayerEventHistoryItem } from '../types';
import Level from '../components/Level';
import { Card, CardBody, CardTitle, DateColumn } from '../components/ui';
import AddPlayerModal from '../components/AddPlayerModal';
import ConfirmDialog from '../components/ConfirmDialog';
import PlayerEventHistory from '../components/PlayerEventHistory';

export default function PlayerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Use store hooks
  const { events } = useEvents();
  const { updatePlayer, deletePlayer, getPlayerById } = usePlayers();
  const isLoading = useAppLoading();
  const hasErrors = useAppHasErrors();
  const errors = useAppErrors();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Get player from store
  const player = id ? getPlayerById(id) : null;
  
  // Determine loading and error states
  const loading = isLoading;
  const error = !id ? 'No player ID provided' : 
               (!player && !loading) ? 'Player not found' :
               errors.players || (hasErrors ? 'Failed to load data' : null);

  if (loading) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <p>Loading player...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <p>Player not found.</p>
        </div>
      </div>
    );
  }

  // Prepare player event history data
  const playerEventHistory: PlayerEventHistoryItem[] = events
    .filter(event => event.invitations.some(inv => inv.playerId === player.id))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // Chronological order (oldest first)
    .map(event => {
      const invitation = event.invitations.find(inv => inv.playerId === player.id);
      const invitationStatus = invitation?.status || 'open';
      const isSelected = event.teams.some(team => 
        (team.selectedPlayers || []).includes(player.id)
      );
      const team = event.teams.find(team => 
        (team.selectedPlayers || []).includes(player.id)
      );

      return {
        eventId: event.id,
        eventName: event.name,
        eventDate: event.date,
        invitationStatus,
        isSelected,
        teamName: team?.name
      };
    });

  // Filter future events where player was NOT invited
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const futureEventsWithoutInvitation = events
    .filter(event => {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      const isFuture = eventDate >= today;
      const isNotInvited = !event.invitations.some(inv => inv.playerId === player.id);
      return isFuture && isNotInvited;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Soonest first

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

  return (
    <div className="page-container lg:px-4 px-0">
      {/* Sub Navigation */}
      <div className="bg-gray-50 border-b border-gray-200 -mt-8 mb-6 py-3 px-4 lg:px-0 lg:rounded-t-lg">
        <div className="relative flex items-center justify-between">
          <button 
            onClick={() => navigate('/players')}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            ← Back
          </button>
          <span className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold text-gray-900">
            {player.firstName} {player.lastName}
          </span>
          <div className="flex gap-3">
            <button 
              onClick={handleEditPlayer}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Edit
            </button>
            <button 
              onClick={handleDeletePlayer}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Player Info */}
      <div className="px-4 lg:px-0 mb-4 flex items-center gap-3">
        {player.birthDate && (
          <span className="text-gray-600 text-sm bg-gray-100 px-2 py-1 rounded">
            {new Date(player.birthDate).toLocaleDateString()}
          </span>
        )}
        <Level level={player.level} />
      </div>

      <div>
        <PlayerEventHistory
          eventHistory={playerEventHistory}
        />
      </div>

      {/* Available Future Events Section */}
      {futureEventsWithoutInvitation.length > 0 && (
        <div className="lg:mt-6">
          <Card className="lg:border border-0 lg:rounded-lg rounded-none lg:shadow shadow-none">
            <CardBody className="lg:p-6 p-4">
              <CardTitle>Events without Invitation</CardTitle>
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
                              Not Invited
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

      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title="Delete Player"
        message={`Are you sure you want to delete ${player.firstName} ${player.lastName}? This action cannot be undone.`}
        onConfirm={confirmDeletePlayer}
        onCancel={cancelDeletePlayer}
      />
    </div>
  );
}
