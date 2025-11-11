import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useEvents, usePlayers, useAppLoading, useAppHasErrors, useAppErrors } from '../store';
import type { Player, Invitation, PlayerEventHistoryItem } from '../types';
import Level from '../components/Level';
import { Card, CardBody, CardTitle } from '../components/ui';
import AddPlayerModal from '../components/AddPlayerModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { Button } from '../components/ui';
import PlayerEventHistory from '../components/PlayerEventHistory';
import { formatDate } from '../utils/dateFormatter';

export default function PlayerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Use store hooks
  const { events, updateEvent } = useEvents();
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

  const handleInviteToEvent = async (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const newInvitation: Invitation = {
      id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      playerId: player.id,
      status: 'open'
    };

    const updatedInvitations = [...event.invitations, newInvitation];
    const success = await updateEvent(eventId, { invitations: updatedInvitations });
    
    if (success) {
      // The events will be automatically updated through the useEvents hook
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <button 
          onClick={() => navigate('/players')}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-2"
        >
          ← Back to Players
        </button>
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-center gap-4 flex-1">
            <h1 className="page-title">{player.firstName} {player.lastName}</h1>
            <span className="text-gray-600">{player.birthYear}</span>
            <div className="flex items-center gap-1">
              <Level level={player.level} />
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleEditPlayer}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Edit Player
            </button>
            <button 
              onClick={handleDeletePlayer}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Delete Player
            </button>
          </div>
        </div>
      </div>

      <div>
        <PlayerEventHistory
          eventHistory={playerEventHistory}
        />
      </div>

      {/* Available Future Events Section */}
      {futureEventsWithoutInvitation.length > 0 && (
        <div className="mt-6">
          <Card>
            <CardBody>
              <CardTitle>Available Future Events</CardTitle>
              <p className="text-sm text-gray-600 mt-1 mb-4">
                Invite {player.firstName} to these upcoming events
              </p>
              <div className="space-y-3">
                {futureEventsWithoutInvitation.map((event) => (
                  <div 
                    key={event.id}
                    className="border border-gray-200 rounded-lg p-4 flex justify-between items-center hover:shadow-md transition-shadow"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{event.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        📅 {formatDate(event.date)}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleInviteToEvent(event.id)}
                      variant="primary"
                    >
                      Invite
                    </Button>
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
