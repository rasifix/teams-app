import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getEventById, updateEvent, getPlayerById, deleteEvent } from '../utils/localStorage';
import type { Event, Invitation } from '../types';
import InvitePlayersModal from '../components/InvitePlayersModal';
import PlayerInvitationsCard from '../components/PlayerInvitationsCard';
import EditTeamModal from '../components/EditTeamModal';
import EditEventModal from '../components/EditEventModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { autoSelectTeams } from '../utils/selectionAlgorithm';
import Level from '../components/Level';
import Strength from '../components/Strength';
import { formatDate } from '../utils/dateFormatter';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditTeamModalOpen, setIsEditTeamModalOpen] = useState(false);
  const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<{ id: string; name: string; strength: number } | null>(null);
  const [dragOverTeamId, setDragOverTeamId] = useState<string | null>(null);
  const [dragOverPlayerId, setDragOverPlayerId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const loadedEvent = getEventById(id);
      setEvent(loadedEvent);
    }
  }, [id]);

  const handleAddTeam = () => {
    if (!event || !id) return;

    const newTeam = {
      id: crypto.randomUUID(),
      name: `Team ${event.teams.length + 1}`,
      strength: 2,
      selectedPlayers: [],
    };

    const updatedTeams = [...event.teams, newTeam];
    const success = updateEvent(id, { teams: updatedTeams });

    if (success) {
      setEvent({
        ...event,
        teams: updatedTeams,
      });
    }
  };

  const handleEditTeamName = (teamId: string, currentName: string, currentStrength: number) => {
    setEditingTeam({ id: teamId, name: currentName, strength: currentStrength });
    setIsEditTeamModalOpen(true);
  };

  const handleSaveTeamName = (newName: string, newStrength: number) => {
    if (!event || !id || !editingTeam) return;

    const updatedTeams = event.teams.map(team =>
      team.id === editingTeam.id ? { ...team, name: newName, strength: newStrength } : team
    );

    const success = updateEvent(id, { teams: updatedTeams });

    if (success) {
      setEvent({
        ...event,
        teams: updatedTeams,
      });
    }

    setEditingTeam(null);
    setIsEditTeamModalOpen(false);
  };

  const handleSaveEvent = (data: { name: string; date: string; startTime: string; maxPlayersPerTeam: number }) => {
    if (!event || !id) return;

    const success = updateEvent(id, data);

    if (success) {
      setEvent({
        ...event,
        ...data,
      });
    }

    setIsEditEventModalOpen(false);
  };

  const handleDeleteEvent = () => {
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteEvent = () => {
    if (id) {
      deleteEvent(id);
      navigate('/events');
    }
  };

  const cancelDeleteEvent = () => {
    setIsDeleteConfirmOpen(false);
  };

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

  const handleAddPlayerToTeam = (teamId: string, playerId: string, allowMove: boolean = false) => {
    if (!event || !id) return;

    // Check if player is already assigned to any team
    const isAlreadyAssigned = event.teams.some(team => 
      (team.selectedPlayers || []).includes(playerId)
    );
    if (isAlreadyAssigned && !allowMove) return;

    const updatedTeams = event.teams.map(team => {
      if (team.id === teamId) {
        const currentPlayers = team.selectedPlayers || [];
        // Check capacity
        if (currentPlayers.length >= event.maxPlayersPerTeam) {
          return team;
        }
        return {
          ...team,
          selectedPlayers: [...currentPlayers, playerId],
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

  const handleSwitchPlayers = (sourceTeamId: string, sourcePlayerId: string, targetTeamId: string, targetPlayerId: string) => {
    if (!event || !id || sourceTeamId === targetTeamId) return;

    const updatedTeams = event.teams.map(team => {
      if (team.id === sourceTeamId) {
        // Replace source player with target player
        return {
          ...team,
          selectedPlayers: (team.selectedPlayers || []).map(pId => 
            pId === sourcePlayerId ? targetPlayerId : pId
          ),
        };
      }
      if (team.id === targetTeamId) {
        // Replace target player with source player
        return {
          ...team,
          selectedPlayers: (team.selectedPlayers || []).map(pId => 
            pId === targetPlayerId ? sourcePlayerId : pId
          ),
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
      <div className="page-container">
        <div className="empty-state">
          <p>Event not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <h1 className="page-title">{event.name}</h1>
            <p className="page-subtitle">
              {formatDate(event.date)} at {event.startTime}
            </p>
            <p className="mt-3 text-gray-600">
              Max players: {event.maxPlayersPerTeam}
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setIsEditEventModalOpen(true)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Edit Event
            </button>
            <button 
              onClick={handleDeleteEvent}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Delete Event
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Teams Section */}
        <div className="card card-body">
          <div className="flex justify-between items-center mb-4">
            <h2 className="card-title">Teams</h2>
            <button 
              onClick={handleAddTeam}
              className="btn-primary btn-sm"
            >
              Add Team
            </button>
          </div>
          {event.teams.length === 0 ? (
            <div className="empty-state">
              <p>No teams configured yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {event.teams.map((team) => {
                const selectedPlayers = team.selectedPlayers || [];
                const hasCapacity = selectedPlayers.length < event.maxPlayersPerTeam;
                const isDragOver = dragOverTeamId === team.id;
                
                return (
                  <div 
                    key={team.id} 
                    className={`border rounded-lg p-4 transition-colors ${
                      isDragOver && hasCapacity 
                        ? 'border-green-500 bg-green-50' 
                        : isDragOver 
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200'
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = hasCapacity ? 'move' : 'none';
                      setDragOverTeamId(team.id);
                    }}
                    onDragLeave={() => {
                      setDragOverTeamId(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOverTeamId(null);
                      
                      if (!hasCapacity) return;
                      
                      // Check if it's a player from invitations list
                      const playerId = e.dataTransfer.getData('playerId');
                      if (playerId) {
                        handleAddPlayerToTeam(team.id, playerId);
                        return;
                      }
                      
                      // Check if it's a selected player from another team
                      const selectedPlayerId = e.dataTransfer.getData('selectedPlayerId');
                      const sourceTeamId = e.dataTransfer.getData('sourceTeamId');
                      
                      if (selectedPlayerId && sourceTeamId && sourceTeamId !== team.id) {
                        // Move player from source team to target team
                        handleRemovePlayerFromTeam(sourceTeamId, selectedPlayerId);
                        handleAddPlayerToTeam(team.id, selectedPlayerId, true);
                      }
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                          {team.name} <Strength level={team.strength || 2} />
                        </h3>
                        <p className="text-sm text-gray-600">
                          Selected: {selectedPlayers.length}/{event.maxPlayersPerTeam}
                        </p>
                      </div>
                      <button 
                        onClick={() => handleEditTeamName(team.id, team.name, team.strength || 2)}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        Edit
                      </button>
                    </div>
                    {selectedPlayers.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <h4 className="text-xs font-medium text-gray-500 mb-2">Players:</h4>
                        <div className="space-y-1">
                          {selectedPlayers
                            .map(playerId => ({ playerId, player: getPlayerById(playerId) }))
                            .sort((a, b) => {
                              if (!a.player || !b.player) return 0;
                              const lastNameCompare = a.player.lastName.toLowerCase().localeCompare(b.player.lastName.toLowerCase());
                              if (lastNameCompare !== 0) return lastNameCompare;
                              return a.player.firstName.toLowerCase().localeCompare(b.player.firstName.toLowerCase());
                            })
                            .map(({ playerId, player }) => {
                            const isDragOver = dragOverPlayerId === playerId;
                            return player ? (
                              <div 
                                key={playerId} 
                                className={`text-sm text-gray-700 flex justify-between items-center gap-2 p-1 rounded cursor-move transition-colors ${
                                  isDragOver ? 'bg-blue-100 border border-blue-400' : 'hover:bg-gray-50'
                                }`}
                                draggable={true}
                                onDragStart={(e) => {
                                  e.dataTransfer.effectAllowed = 'move';
                                  e.dataTransfer.setData('selectedPlayerId', playerId);
                                  e.dataTransfer.setData('sourceTeamId', team.id);
                                }}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  e.dataTransfer.dropEffect = 'move';
                                  setDragOverPlayerId(playerId);
                                }}
                                onDragLeave={(e) => {
                                  e.stopPropagation();
                                  setDragOverPlayerId(null);
                                }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setDragOverPlayerId(null);
                                  
                                  const draggedPlayerId = e.dataTransfer.getData('selectedPlayerId');
                                  const sourceTeamId = e.dataTransfer.getData('sourceTeamId');
                                  
                                  if (draggedPlayerId && sourceTeamId && draggedPlayerId !== playerId) {
                                    handleSwitchPlayers(sourceTeamId, draggedPlayerId, team.id, playerId);
                                  }
                                }}
                              >
                                <span className="flex-1">{player.firstName} {player.lastName}</span>
                                <Level level={player.level} className="text-sm" />
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
          assignedPlayerIds={event.teams.flatMap(team => team.selectedPlayers || [])}
        />
      </div>

      <InvitePlayersModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInvite={handleInvitePlayers}
        alreadyInvitedPlayerIds={event.invitations.map(inv => inv.playerId)}
      />

      <EditTeamModal
        isOpen={isEditTeamModalOpen}
        onClose={() => setIsEditTeamModalOpen(false)}
        onSave={handleSaveTeamName}
        currentName={editingTeam?.name || ''}
        currentStrength={editingTeam?.strength || 2}
      />

      <EditEventModal
        isOpen={isEditEventModalOpen}
        onClose={() => setIsEditEventModalOpen(false)}
        onSave={handleSaveEvent}
        currentData={{
          name: event.name,
          date: event.date,
          startTime: event.startTime,
          maxPlayersPerTeam: event.maxPlayersPerTeam,
        }}
        minMaxPlayers={Math.max(...event.teams.map(team => (team.selectedPlayers || []).length), 1)}
      />

      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title="Delete Event"
        message={`Are you sure you want to delete "${event.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteEvent}
        onCancel={cancelDeleteEvent}
        confirmButtonColor="red"
      />
    </div>
  );
}