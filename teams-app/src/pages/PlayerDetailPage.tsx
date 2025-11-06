import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getPlayerById, getEvents, updatePlayer, deletePlayer, updateEvent } from '../utils/localStorage';
import type { Player, Event, Invitation } from '../types';
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
  const [player, setPlayer] = useState<Player | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    if (id) {
      const loadedPlayer = getPlayerById(id);
      setPlayer(loadedPlayer);
      
      // Get all events
      const allEvents = getEvents();
      setEvents(allEvents);
    }
  }, [id]);

  if (!player) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <p>Player not found.</p>
        </div>
      </div>
    );
  }

  // Filter events where player was invited
  const playerEvents = events
    .filter(event => event.invitations.some(inv => inv.playerId === player.id))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Chronological order (oldest first)

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

  const getInvitationStatus = (event: Event) => {
    const invitation = event.invitations.find(inv => inv.playerId === player.id);
    return invitation?.status || 'unknown';
  };

  const isSelected = (event: Event) => {
    return event.teams.some(team => 
      (team.selectedPlayers || []).includes(player.id)
    );
  };

  const getTeamName = (event: Event) => {
    const team = event.teams.find(team => 
      (team.selectedPlayers || []).includes(player.id)
    );
    return team?.name;
  };

  const handleEditPlayer = () => {
    setIsEditModalOpen(true);
  };

  const handleUpdatePlayer = (playerId: string, playerData: Omit<Player, 'id'>) => {
    const success = updatePlayer(playerId, playerData);
    if (success) {
      setPlayer({ ...playerData, id: playerId });
      setIsEditModalOpen(false);
    }
  };

  const handleDeletePlayer = () => {
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeletePlayer = () => {
    if (id) {
      deletePlayer(id);
      navigate('/players');
    }
  };

  const cancelDeletePlayer = () => {
    setIsDeleteConfirmOpen(false);
  };

  const handleInviteToEvent = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const newInvitation: Invitation = {
      id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      playerId: player.id,
      status: 'open'
    };

    const updatedInvitations = [...event.invitations, newInvitation];
    const success = updateEvent(eventId, { invitations: updatedInvitations });
    
    if (success) {
      // Reload events to reflect the change
      const allEvents = getEvents();
      setEvents(allEvents);
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
          playerEvents={playerEvents}
          getInvitationStatus={getInvitationStatus}
          isSelected={isSelected}
          getTeamName={getTeamName}
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
                        📅 {formatDate(event.date)} at {event.startTime}
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
