import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useEvents, usePlayers, useTrainers, useShirtSets, useAppLoading, useAppHasErrors, useAppErrors, useGroup } from '../store';
import type { Event, Team, Invitation, InvitationStatus } from '../types';
import InvitePlayersModal from '../components/InvitePlayersModal';
import PlayerInvitationsCard from '../components/PlayerInvitationsCard';
import EditTeamModal from '../components/EditTeamModal';
import AssignShirtsModal from '../components/AssignShirtsModal';
import EditEventModal from '../components/EditEventModal';
import ConfirmDialog from '../components/ConfirmDialog';
import TeamCard from '../components/TeamCard';
import TeamPrintSummary from '../components/TeamPrintSummary';
import Strength from '../components/Strength';
import { formatDate } from '../utils/dateFormatter';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Use store hooks
  const { events, updateEvent, deleteEvent, getEventById } = useEvents();
  const { players } = usePlayers();
  const { trainers } = useTrainers();
  const { shirtSets } = useShirtSets();
  const group = useGroup();
  const isLoading = useAppLoading();
  const hasErrors = useAppHasErrors();
  const errors = useAppErrors();
  
  // Get event from store
  const event = id ? getEventById(id) : null;
  
  // Get sorted events for navigation
  const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const currentEventIndex = event ? sortedEvents.findIndex(e => e.id === event.id) : -1;
  const previousEvent = currentEventIndex > 0 ? sortedEvents[currentEventIndex - 1] : null;
  const nextEvent = currentEventIndex >= 0 && currentEventIndex < sortedEvents.length - 1 ? sortedEvents[currentEventIndex + 1] : null;
  
  // Determine loading and error states
  const loading = isLoading;
  const error = !id ? 'No event ID provided' : 
               (!event && !loading) ? 'Event not found' :
               errors.events || (hasErrors ? 'Failed to load data' : null);
  
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
  const [swipedTeamId, setSwipedTeamId] = useState<string | null>(null);
  const [teamToDelete, setTeamToDelete] = useState<string | null>(null);
  const [isSwipeGesture, setIsSwipeGesture] = useState(false);

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
    await updateEvent(id, { teams: updatedTeams });
    // Store will automatically update the event data
  };

  const handleTouchStartTeam = (teamId: string, e: React.TouchEvent) => {
    const touch = e.touches[0];
    const startX = touch.clientX;
    setIsSwipeGesture(false);
    
    const handleTouchMove = (moveEvent: TouchEvent) => {
      const moveTouch = moveEvent.touches[0];
      const diffX = startX - moveTouch.clientX;
      
      // If swiped left more than 50px, show delete button
      if (diffX > 50 && swipedTeamId !== teamId) {
        setSwipedTeamId(teamId);
        setIsSwipeGesture(true);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      }
      // If swiped right more than 30px while delete button is showing, hide it
      else if (diffX < -30 && swipedTeamId === teamId) {
        setSwipedTeamId(null);
        setIsSwipeGesture(true);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      }
      // If any movement detected, mark as potential swipe
      else if (Math.abs(diffX) > 5) {
        setIsSwipeGesture(true);
      }
    };
    
    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  };

  const handleDeleteTeam = async () => {
    if (!event || !id || !teamToDelete) return;

    const updatedTeams = event.teams.filter(t => t.id !== teamToDelete);
    await updateEvent(id, { teams: updatedTeams });
    setTeamToDelete(null);
    setSwipedTeamId(null);
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

    await updateEvent(id, { teams: updatedTeams });
    // Store will automatically update the event data

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

    await updateEvent(id, { teams: updatedTeams });
    // Store will automatically update the event data

    setAssigningShirtsTeam(null);
    setIsAssignShirtsModalOpen(false);
  };

  const handleSaveEvent = async (data: { name: string; date: string; maxPlayersPerTeam: number; location?: string }) => {
    if (!event || !id) return;

    await updateEvent(id, data);
    // Store will automatically update the event data

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
    
    await updateEvent(id, { invitations: updatedInvitations });
    // Store will automatically update the event data
  };

  const handleInvitationStatusChange = async (invitationId: string, newStatus: InvitationStatus) => {
    if (!event || !id) return;

    const updatedInvitations = event.invitations.map(inv =>
      inv.id === invitationId ? { ...inv, status: newStatus } : inv
    );

    await updateEvent(id, { invitations: updatedInvitations });
    // Store will automatically update the event data
  };

  const handleRemoveInvitation = async (invitationId: string) => {
    if (!event || !id) return;

    const updatedInvitations = event.invitations.filter(inv => inv.id !== invitationId);

    await updateEvent(id, { invitations: updatedInvitations });
    // Store will automatically update the event data
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

    await updateEvent(id, { teams: updatedTeams });
    // Store will automatically update the event data
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

    await updateEvent(id, { teams: validatedTeams });
    // Store will automatically update the event data
  };

  const handleReplacePlayer = async (teamId: string, oldPlayerId: string, newPlayerId: string) => {
    if (!event || !id) return;

    const updatedTeams = event.teams.map(team => {
      if (team.id === teamId) {
        const currentPlayers = team.selectedPlayers || [];
        // Replace the old player with the new player
        const updatedPlayers = currentPlayers.map(playerId => 
          playerId === oldPlayerId ? newPlayerId : playerId
        );
        return {
          ...team,
          selectedPlayers: updatedPlayers,
        };
      }
      return team;
    });

    await updateEvent(id, { teams: updatedTeams });
    // Store will automatically update the event data
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

    await updateEvent(id, { teams: validatedTeams });
    // Store will automatically update the event data
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <p>Loading event...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 btn-primary btn-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

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
    <div className="page-container lg:px-4 px-0">
      <div className="page-header px-4 lg:px-0 -mt-5 mb-6">
        {/* Navigation links */}
        <div className="flex justify-between items-center mb-4 text-sm">
          <div>
            {previousEvent ? (
              <button
                onClick={() => navigate(`/events/${previousEvent.id}`)}
                className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <span className="block sm:hidden">← Prev</span>
                <span className="hidden sm:block">← {previousEvent.name}</span>
              </button>
            ) : (
              <div className="text-gray-400">
                <span className="block sm:hidden">← Prev</span>
                <span className="hidden sm:block">← No previous event</span>
              </div>
            )}
          </div>
          <div className="text-sm font-medium text-gray-900">
            {event.name}
          </div>
          <div>
            {nextEvent ? (
              <button
                onClick={() => navigate(`/events/${nextEvent.id}`)}
                className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <span className="block sm:hidden">Next →</span>
                <span className="hidden sm:block">{nextEvent.name} →</span>
              </button>
            ) : (
              <div className="text-gray-400">
                <span className="block sm:hidden">Next →</span>
                <span className="hidden sm:block">No next event →</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <p className="page-subtitle">
              📅 {formatDate(event.date)}
              {event.location && (<span className="ml-4">📍 {event.location}</span>)}
            </p>            
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setIsEditEventModalOpen(true)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Edit
            </button>
            <button 
              onClick={handleDeleteEvent}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-6 gap-y-6">
        {/* Teams Section */}
        <div className="card card-body lg:p-6 p-4 lg:border border-0 lg:rounded-lg rounded-none lg:shadow shadow-none">
          <div className="flex justify-between items-center mb-4">
            <h2 className="card-title">Teams</h2>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsPrintSummaryOpen(true)}
                className="btn-secondary btn-sm hidden sm:block"
                disabled={event.teams.length === 0}
              >
                Print Teams
              </button>
              <button 
                onClick={handleAddTeam}
                className="btn-primary btn-sm"
              >
                Add
              </button>
            </div>
          </div>
          {event.teams.length === 0 ? (
            <div className="empty-state">
              <p>No teams configured yet.</p>
            </div>
          ) : (
            <>
              {/* Desktop view - Drag & Drop */}
              <div className="hidden lg:block space-y-3">
                {event.teams.map((team) => {
                  const isDragOver = dragOverTeamId === team.id;
                  
                  return (
                    <TeamCard
                      key={team.id}
                      team={team}
                      players={players}
                      trainers={trainers}
                      shirtSets={shirtSets}
                      events={events}
                      maxPlayersPerTeam={event.maxPlayersPerTeam}
                      isDragOver={isDragOver}
                      dragOverPlayerId={dragOverPlayerId}
                      onEditTeam={handleEditTeamName}
                      onAssignShirts={handleAssignShirts}
                      onRemovePlayer={handleRemovePlayerFromTeam}
                      onSwitchPlayers={handleSwitchPlayers}
                      onAddPlayerToTeam={handleAddPlayerToTeam}
                      onReplacePlayer={handleReplacePlayer}
                      onDragOverTeam={setDragOverTeamId}
                      onDragOverPlayer={setDragOverPlayerId}
                    />
                  );
                })}
              </div>
              
              {/* Mobile view - Simple List */}
              <div className="block lg:hidden">
                {event.teams.map(team => {
                  const playerCount = team.selectedPlayers?.length || 0;
                  const trainer = team.trainerId ? trainers.find(t => t.id === team.trainerId) : null;
                  
                  return (
                    <div
                      key={team.id}
                      className="relative overflow-hidden bg-white border-t border-gray-200 first:border-t-0"
                    >
                      {/* Main content */}
                      <div
                        className={`flex items-center justify-between p-4 transition-transform duration-200 cursor-pointer active:bg-gray-50 ${
                          swipedTeamId === team.id ? '-translate-x-20' : 'translate-x-0'
                        }`}
                        onClick={() => {
                          // Only navigate if it wasn't a swipe gesture
                          if (!isSwipeGesture) {
                            navigate(`/events/${id}/teams/${team.id}`);
                          }
                          // Reset the flag for next interaction
                          setIsSwipeGesture(false);
                        }}
                        onTouchStart={(e) => handleTouchStartTeam(team.id, e)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{team.name}</div>
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
                            <span>👥 {playerCount}/{event.maxPlayersPerTeam}</span>
                            <span>🕐 {team.startTime}</span>
                            <Strength level={team.strength} />
                          </div>
                          {trainer && (
                            <div className="text-xs text-gray-500 mt-1">
                              👤 {trainer.firstName} {trainer.lastName}
                            </div>
                          )}
                        </div>
                        <svg className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </div>

                      {/* Delete button that appears on swipe */}
                      <div 
                        className={`absolute inset-y-0 right-0 flex items-center justify-center w-20 bg-red-600 transition-opacity duration-200 ${
                          swipedTeamId === team.id ? 'opacity-100' : 'opacity-0 pointer-events-none'
                        }`}
                      >
                        <button
                          className="flex items-center justify-center w-full h-full text-white font-medium text-sm"
                          onClick={() => setTeamToDelete(team.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Invitations Section */}
        <PlayerInvitationsCard
          invitations={event.invitations}
          currentEvent={event}
          players={players}
          events={events}
          onInviteClick={() => setIsInviteModalOpen(true)}
          onStatusChange={handleInvitationStatusChange}
          onRemoveInvitation={handleRemoveInvitation}
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
          players={players}
          shirtSets={shirtSets}
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
          location: event.location,
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

      <ConfirmDialog
        isOpen={!!teamToDelete}
        title="Delete Team"
        message={`Are you sure you want to delete this team? All player assignments will be removed.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteTeam}
        onCancel={() => setTeamToDelete(null)}
        confirmButtonColor="red"
      />

      <TeamPrintSummary
        event={event}
        teams={event.teams}
        players={players}
        trainers={trainers}
        shirtSets={shirtSets}
        club={group?.club}
        isOpen={isPrintSummaryOpen}
        onClose={() => setIsPrintSummaryOpen(false)}
      />
    </div>
  );
}