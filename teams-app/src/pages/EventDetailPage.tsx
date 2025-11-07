import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useEvents } from '../hooks/useEvents';
import { usePlayers } from '../hooks/usePlayers';
import { getEventById } from '../services/eventService';
import type { Event, Invitation } from '../types';
import InvitePlayersModal from '../components/InvitePlayersModal';
import PlayerInvitationsCard from '../components/PlayerInvitationsCard';
import EditTeamModal from '../components/EditTeamModal';
import EditEventModal from '../components/EditEventModal';
import ConfirmDialog from '../components/ConfirmDialog';
import TeamCard from '../components/TeamCard';
import { autoSelectTeams } from '../utils/selectionAlgorithm';
import { formatDate } from '../utils/dateFormatter';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { updateEvent, deleteEvent } = useEvents();
  const { players } = usePlayers();
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

  const handleAddTeam = async () => {
    if (!event || !id) return;

    const newTeam = {
      id: crypto.randomUUID(),
      name: `Team ${event.teams.length + 1}`,
      strength: 2,
      selectedPlayers: [],
    };

    const updatedTeams = [...event.teams, newTeam];
    const success = await updateEvent(id, { teams: updatedTeams });

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

  const handleSaveTeamName = async (newName: string, newStrength: number) => {
    if (!event || !id || !editingTeam) return;

    const updatedTeams = event.teams.map(team =>
      team.id === editingTeam.id ? { ...team, name: newName, strength: newStrength } : team
    );

    const success = await updateEvent(id, { teams: updatedTeams });

    if (success) {
      setEvent({
        ...event,
        teams: updatedTeams,
      });
    }

    setEditingTeam(null);
    setIsEditTeamModalOpen(false);
  };

  const handleSaveEvent = async (data: { name: string; date: string; startTime: string; maxPlayersPerTeam: number }) => {
    if (!event || !id) return;

    const success = await updateEvent(id, data);

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

  const confirmDeleteEvent = async () => {
    if (id) {
      const success = await deleteEvent(id);
      if (success) {
        navigate('/events');
      }
    }
  };

  const cancelDeleteEvent = () => {
    setIsDeleteConfirmOpen(false);
  };

  const handleInvitePlayers = async (playerIds: string[]) => {
    if (!event || !id) return;

    const newInvitations: Invitation[] = playerIds.map(playerId => ({
      id: crypto.randomUUID(),
      playerId,
      status: 'open',
    }));

    const updatedInvitations = [...event.invitations, ...newInvitations];
    
    const success = await updateEvent(id, { invitations: updatedInvitations });
    
    if (success) {
      setEvent({
        ...event,
        invitations: updatedInvitations,
      });
    }
  };

  const handleInvitationStatusChange = async (invitationId: string, newStatus: 'open' | 'accepted' | 'declined') => {
    if (!event || !id) return;

    const updatedInvitations = event.invitations.map(inv =>
      inv.id === invitationId ? { ...inv, status: newStatus } : inv
    );

    const success = await updateEvent(id, { invitations: updatedInvitations });

    if (success) {
      setEvent({
        ...event,
        invitations: updatedInvitations,
      });
    }
  };

  const handleAutoSelect = async () => {
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
    
    const success = await updateEvent(id, { teams: updatedTeams });

    if (success) {
      setEvent({
        ...event,
        teams: updatedTeams,
      });
    }
  };

  const handleRemovePlayerFromTeam = async (teamId: string, playerId: string) => {
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

    const success = await updateEvent(id, { teams: updatedTeams });

    if (success) {
      setEvent({
        ...event,
        teams: updatedTeams,
      });
    }
  };

  // Validate and clean up teams to ensure no player is in multiple teams
  const validateAndCleanTeams = (teams: Event['teams']) => {
    const seenPlayers = new Set<string>();
    return teams.map(team => {
      const cleanedPlayers = (team.selectedPlayers || []).filter(playerId => {
        if (seenPlayers.has(playerId)) {
          // Player already in another team, skip
          return false;
        }
        seenPlayers.add(playerId);
        return true;
      });
      return {
        ...team,
        selectedPlayers: cleanedPlayers,
      };
    });
  };

  const handleAddPlayerToTeam = async (teamId: string, playerId: string, allowMove: boolean = false) => {
    if (!event || !id) return;

    // Check if player is already assigned to any team
    const currentTeam = event.teams.find(team => 
      (team.selectedPlayers || []).includes(playerId)
    );
    
    // If player is already in a team and we're not allowing moves, return
    if (currentTeam && !allowMove) return;

    const updatedTeams = event.teams.map(team => {
      // Remove player from their current team if moving
      if (currentTeam && team.id === currentTeam.id && allowMove) {
        return {
          ...team,
          selectedPlayers: (team.selectedPlayers || []).filter(pId => pId !== playerId),
        };
      }
      
      // Add player to target team
      if (team.id === teamId) {
        const currentPlayers = team.selectedPlayers || [];
        
        // Check capacity
        if (currentPlayers.length >= event.maxPlayersPerTeam) {
          return team;
        }
        
        // Don't add if player is already in this team
        if (currentPlayers.includes(playerId)) {
          return team;
        }
        
        return {
          ...team,
          selectedPlayers: [...currentPlayers, playerId],
        };
      }
      return team;
    });

    // Validate to ensure no duplicates across teams
    const validatedTeams = validateAndCleanTeams(updatedTeams);

    const success = await updateEvent(id, { teams: validatedTeams });

    if (success) {
      setEvent({
        ...event,
        teams: validatedTeams,
      });
    }
  };

  const handleSwitchPlayers = async (sourceTeamId: string, sourcePlayerId: string, targetTeamId: string, targetPlayerId: string) => {
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

    // Validate to ensure no duplicates across teams
    const validatedTeams = validateAndCleanTeams(updatedTeams);

    const success = await updateEvent(id, { teams: validatedTeams });

    if (success) {
      setEvent({
        ...event,
        teams: validatedTeams,
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
              {formatDate(event.date)} 🕐 {event.startTime}
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
                const isDragOver = dragOverTeamId === team.id;
                
                return (
                  <TeamCard
                    key={team.id}
                    team={team}
                    maxPlayersPerTeam={event.maxPlayersPerTeam}
                    isDragOver={isDragOver}
                    dragOverPlayerId={dragOverPlayerId}
                    onEditTeam={handleEditTeamName}
                    onRemovePlayer={handleRemovePlayerFromTeam}
                    onSwitchPlayers={handleSwitchPlayers}
                    onAddPlayerToTeam={handleAddPlayerToTeam}
                    onDragOverTeam={setDragOverTeamId}
                    onDragOverPlayer={setDragOverPlayerId}
                  />
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
        players={players}
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