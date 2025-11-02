import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getEventById, updateEvent, getPlayerById } from '../utils/localStorage';
import type { Event, Invitation } from '../types';
import InvitePlayersModal from '../components/InvitePlayersModal';
import PlayerInvitationsCard from '../components/PlayerInvitationsCard';
import { autoSelectTeams } from '../utils/selectionAlgorithm';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      const loadedEvent = getEventById(id);
      setEvent(loadedEvent);
    }
  }, [id]);

  const handleInvitePlayers = (playerIds: string[]) => {
    if (!event || !id) return;

    const newInvitations: Invitation[] = playerIds.map(playerId => ({
      id: crypto.randomUUID(),
      playerId,
      status: 'open',
    }));

    const updatedInvitations = [...event.invitations, ...newInvitations];
    
    const success = updateEvent(id, { invitations: updatedInvitations });
    
    if (success) {
      setEvent({
        ...event,
        invitations: updatedInvitations,
      });
    }
  };

  const handleInvitationStatusChange = (invitationId: string, newStatus: 'open' | 'accepted' | 'declined') => {
    if (!event || !id) return;

    const updatedInvitations = event.invitations.map(inv =>
      inv.id === invitationId ? { ...inv, status: newStatus } : inv
    );

    const success = updateEvent(id, { invitations: updatedInvitations });

    if (success) {
      setEvent({
        ...event,
        invitations: updatedInvitations,
      });
    }
  };

  const handleAutoSelect = () => {
    if (!event || !id) return;

    const acceptedCount = event.invitations.filter(inv => inv.status === 'accepted').length;
    
    if (acceptedCount === 0) {
      alert('No players have accepted the invitation yet.');
      return;
    }

    if (event.teams.length === 0) {
      alert('No teams configured for this event.');
      return;
    }

    // Run auto-selection algorithm
    const updatedTeams = autoSelectTeams(event);
    
    const success = updateEvent(id, { teams: updatedTeams });

    if (success) {
      setEvent({
        ...event,
        teams: updatedTeams,
      });
    }
  };

  const handleRemovePlayerFromTeam = (teamId: string, playerId: string) => {
    if (!event || !id) return;

    const updatedTeams = event.teams.map(team => {
      if (team.id === teamId) {
        return {
          ...team,
          selectedPlayers: (team.selectedPlayers || []).filter(pId => pId !== playerId),
        };
      }
      return team;
    });

    const success = updateEvent(id, { teams: updatedTeams });

    if (success) {
      setEvent({
        ...event,
        teams: updatedTeams,
      });
    }
  };

  if (!event) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-gray-500">Event not found.</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
        <p className="mt-2 text-gray-600">
          {formatDate(event.date)} at {event.startTime}
        </p>
        <p className="mt-3 text-gray-600">
          Max players: {event.maxPlayersPerTeam}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Teams Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Teams</h2>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">
              Add Team
            </button>
          </div>
          {event.teams.length === 0 ? (
            <div className="text-gray-500 text-center py-4">
              <p>No teams configured yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {event.teams.map((team) => {
                const selectedPlayers = team.selectedPlayers || [];
                return (
                  <div key={team.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{team.name}</h3>
                        <p className="text-sm text-gray-600">
                          Selected: {selectedPlayers.length}/{event.maxPlayersPerTeam}
                        </p>
                      </div>
                      <button className="text-blue-600 hover:text-blue-700 text-sm">
                        Edit
                      </button>
                    </div>
                    {selectedPlayers.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <h4 className="text-xs font-medium text-gray-500 mb-2">Players:</h4>
                        <div className="space-y-1">
                          {selectedPlayers.map(playerId => {
                            const player = getPlayerById(playerId);
                            return player ? (
                              <div key={playerId} className="text-sm text-gray-700 flex justify-between items-center gap-2">
                                <span className="flex-1">{player.firstName} {player.lastName}</span>
                                <span className="text-xs text-gray-500">Skill: {player.score}</span>
                                <button
                                  onClick={() => handleRemovePlayerFromTeam(team.id, playerId)}
                                  className="text-red-600 hover:text-red-800 text-xs"
                                  title="Remove player"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <div key={playerId} className="text-sm text-gray-400 italic flex justify-between items-center gap-2">
                                <span className="flex-1">Unknown player</span>
                                <button
                                  onClick={() => handleRemovePlayerFromTeam(team.id, playerId)}
                                  className="text-red-600 hover:text-red-800 text-xs"
                                  title="Remove player"
                                >
                                  ✕
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Invitations Section */}
        <PlayerInvitationsCard
          invitations={event.invitations}
          onInviteClick={() => setIsInviteModalOpen(true)}
          onStatusChange={handleInvitationStatusChange}
          onAutoSelect={handleAutoSelect}
        />
      </div>

      <InvitePlayersModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInvite={handleInvitePlayers}
        alreadyInvitedPlayerIds={event.invitations.map(inv => inv.playerId)}
      />
    </div>
  );
}