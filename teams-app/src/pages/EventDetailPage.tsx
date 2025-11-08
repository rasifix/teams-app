import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useEvents } from '../hooks/useEvents';
import { usePlayers } from '../hooks/usePlayers';
import { useTrainers } from '../hooks/useTrainers';
import { useShirtSets } from '../hooks/useShirtSets';
import { getEventById } from '../services/eventService';
import type { Event, Team, Invitation } from '../types';
import InvitePlayersModal from '../components/InvitePlayersModal';
import PlayerInvitationsCard from '../components/PlayerInvitationsCard';
import EditTeamModal from '../components/EditTeamModal';
import AssignShirtsModal from '../components/AssignShirtsModal';
import EditEventModal from '../components/EditEventModal';
import ConfirmDialog from '../components/ConfirmDialog';
import TeamCard from '../components/TeamCard';
import TeamPrintSummary from '../components/TeamPrintSummary';
import { autoSelectTeams } from '../utils/selectionAlgorithm';
import { formatDate } from '../utils/dateFormatter';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { updateEvent, deleteEvent } = useEvents();
  const { players } = usePlayers();
  // Initialize hooks for child components
  useTrainers();
  useShirtSets();
  const [event, setEvent] = useState<Event | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditTeamModalOpen, setIsEditTeamModalOpen] = useState(false);
  const [isAssignShirtsModalOpen, setIsAssignShirtsModalOpen] = useState(false);
  const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isPrintSummaryOpen, setIsPrintSummaryOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<{ id: string; name: string; strength: number; startTime: string; trainerId?: string } | null>(null);
  const [assigningShirtsTeam, setAssigningShirtsTeam] = useState<Team | null>(null);
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
      startTime: '10:00', // Default start time
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

  const handleEditTeamName = (teamId: string, currentName: string, currentStrength: number, currentStartTime: string, currentTrainerId?: string) => {
    setEditingTeam({ id: teamId, name: currentName, strength: currentStrength, startTime: currentStartTime, trainerId: currentTrainerId });
    setIsEditTeamModalOpen(true);
  };

  const handleSaveTeamName = async (newName: string, newStrength: number, newStartTime: string, newTrainerId?: string) => {
    if (!event || !id || !editingTeam) return;

    const updatedTeams = event.teams.map(team =>
      team.id === editingTeam.id ? { ...team, name: newName, strength: newStrength, startTime: newStartTime, trainerId: newTrainerId } : team
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

  const handleAssignShirts = (team: Team) => {
    setAssigningShirtsTeam(team);
    setIsAssignShirtsModalOpen(true);
  };

  const handleSaveShirtAssignments = async (shirtSetId: string, playerShirtAssignments: Array<{ playerId: string; shirtNumber: number }>) => {
    if (!event || !id || !assigningShirtsTeam) return;

    // Update the team with the new shirt set and individual shirt assignments
    const updatedTeams = event.teams.map(team =>
      team.id === assigningShirtsTeam.id 
        ? { ...team, shirtSetId, shirtAssignments: playerShirtAssignments } 
        : team
    );

    const success = await updateEvent(id, { teams: updatedTeams });

    if (success) {
      setEvent({
        ...event,
        teams: updatedTeams,
      });
    }

    setAssigningShirtsTeam(null);
    setIsAssignShirtsModalOpen(false);
  };

  const handleSaveEvent = async (data: { name: string; date: string; maxPlayersPerTeam: number }) => {
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

  const handleRemoveInvitation = async (invitationId: string) => {
    if (!event || !id) return;

    const updatedInvitations = event.invitations.filter(inv => inv.id !== invitationId);

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
              📅 {formatDate(event.date)}
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
            <div className="flex gap-2">
              <button 
                onClick={() => setIsPrintSummaryOpen(true)}
                className="btn-secondary btn-sm"
                disabled={event.teams.length === 0}
              >
                Print Teams
              </button>
              <button 
                onClick={handleAddTeam}
                className="btn-primary btn-sm"
              >
                Add Team
              </button>
            </div>
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
                    onAssignShirts={handleAssignShirts}
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
          onRemoveInvitation={handleRemoveInvitation}
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
        currentStartTime={editingTeam?.startTime || '10:00'}
        currentTrainerId={editingTeam?.trainerId}
      />

      {assigningShirtsTeam && (
        <AssignShirtsModal
          isOpen={isAssignShirtsModalOpen}
          onClose={() => setIsAssignShirtsModalOpen(false)}
          onSave={handleSaveShirtAssignments}
          team={assigningShirtsTeam}
          currentShirtSetId={assigningShirtsTeam?.shirtSetId}
          currentShirtAssignments={assigningShirtsTeam?.shirtAssignments}
        />
      )}

      <EditEventModal
        isOpen={isEditEventModalOpen}
        onClose={() => setIsEditEventModalOpen(false)}
        onSave={handleSaveEvent}
        currentData={{
          name: event.name,
          date: event.date,
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

      <TeamPrintSummary
        event={event}
        teams={event.teams}
        isOpen={isPrintSummaryOpen}
        onClose={() => setIsPrintSummaryOpen(false)}
      />
    </div>
  );
}