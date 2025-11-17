import { useState } from 'react';
import { getPlayerStats } from '../utils/playerStats';
import type { Invitation, Event, Player } from '../types';
import Level from './Level';

interface PlayerInvitationsCardProps {
  invitations: Invitation[];
  currentEvent: Event;
  players: Player[];
  events: Event[];
  onInviteClick: () => void;
  onStatusChange: (invitationId: string, newStatus: 'open' | 'accepted' | 'declined') => void;
  onRemoveInvitation: (invitationId: string) => void;
  assignedPlayerIds?: string[];
}

type TabType = 'accepted' | 'declined' | 'open' | 'assigned';

export default function PlayerInvitationsCard({
  invitations,
  currentEvent,
  players,
  events,
  onInviteClick,
  onStatusChange,
  onRemoveInvitation,
  assignedPlayerIds = [],
}: PlayerInvitationsCardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('accepted');

  // Function to calculate real-time statistics including current event state
  const getPlayerStatsWithCurrent = (playerId: string) => {
    // Get historical stats from all events except current one
    const historicalEvents = events.filter((e: Event) => e.id !== currentEvent.id);
    const historicalStats = getPlayerStats(playerId, historicalEvents);

    // Check current event status
    const currentInvitation = currentEvent.invitations.find(inv => inv.playerId === playerId);
    const isCurrentlySelected = currentEvent.teams.some(team =>
      (team.selectedPlayers || []).includes(playerId)
    );

    // Add current event to stats
    const acceptedCount = historicalStats.acceptedCount +
      (currentInvitation?.status === 'accepted' ? 1 : 0);
    const selectedCount = historicalStats.selectedCount +
      (isCurrentlySelected ? 1 : 0);

    return { acceptedCount, selectedCount };
  };

  const acceptedCount = invitations.filter(inv => inv.status === 'accepted').filter(inv => !assignedPlayerIds.includes(inv.playerId)).length;
  const openCount = invitations.filter(inv => inv.status === 'open').length;
  const declinedCount = invitations.filter(inv => inv.status === 'declined').length;
  const assignedCount = assignedPlayerIds.length;

  // Get invitations for the current tab
  const tabInvitations = activeTab === 'assigned' 
    ? invitations.filter(inv => assignedPlayerIds.includes(inv.playerId))
    : invitations.filter(inv => inv.status === activeTab);

  // Filter by availability only on accepted tab when toggle is enabled
  const filteredInvitations = activeTab === 'accepted'
    ? tabInvitations.filter(inv => !assignedPlayerIds.includes(inv.playerId))
    : tabInvitations;

  return (
    <div className="bg-white lg:shadow shadow-none lg:rounded-lg rounded-none lg:p-6 p-4 lg:border border-0">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Players</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={onInviteClick}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
          >
            Invite
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="-mb-px flex space-x-4 lg:space-x-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('assigned')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap lg:hidden ${activeTab === 'assigned'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Assigned <span className="hidden lg:inline">({assignedCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('accepted')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'accepted'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Accepted <span className="hidden lg:inline">({acceptedCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('open')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'open'
                ? 'border-yellow-500 text-yellow-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Open <span className="hidden lg:inline">({openCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('declined')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'declined'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Declined <span className="hidden lg:inline">({declinedCount})</span>
          </button>
        </nav>
      </div>

      {filteredInvitations.length === 0 ? (
        <div className="text-gray-500 text-center py-4">
          {invitations.length === 0 ? (
            <p>No invitations sent yet.</p>
          ) : tabInvitations.length === 0 ? (
            <p>No players have {
              activeTab === 'accepted' ? 'accepted' : 
              activeTab === 'declined' ? 'declined' : 
              activeTab === 'assigned' ? 'been assigned' : 
              'open'} invitations.</p>
          ) : activeTab === 'accepted' ? (
            <p>No available players. All accepted players are already assigned to teams.</p>
          ) : activeTab === 'assigned' ? (
            <p>No players assigned to teams yet.</p>
          ) : (
            <p>No players in this category.</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {[...filteredInvitations]
            .sort((a, b) => {
              const playerA = players.find(p => p.id === a.playerId);
              const playerB = players.find(p => p.id === b.playerId);

              if (!playerA || !playerB) return 0;

              const lastNameCompare = playerA.lastName.toLowerCase().localeCompare(playerB.lastName.toLowerCase());
              if (lastNameCompare !== 0) return lastNameCompare;

              return playerA.firstName.toLowerCase().localeCompare(playerB.firstName.toLowerCase());
            })
            .map((invitation) => {
              const player = players.find(p => p.id === invitation.playerId);
              const isAccepted = invitation.status === 'accepted';
              const isAssigned = assignedPlayerIds.includes(invitation.playerId);
              // Only allow dragging if we're on the accepted tab, player is accepted, and not assigned
              const isDraggable = activeTab === 'accepted' && isAccepted && !isAssigned;
              // Only dim assigned players on the accepted tab since we have separate tabs now
              const shouldDim = activeTab === 'accepted' && isAssigned;

              // Calculate player statistics including current event real-time state
              const stats = getPlayerStatsWithCurrent(invitation.playerId);

              return (
                <div
                  key={invitation.id}
                  className={`border border-gray-200 rounded-lg p-3 transition-all ${isDraggable ? 'cursor-move hover:border-green-300 hover:bg-green-50' : ''
                    } ${shouldDim ? 'opacity-40' : ''}`}
                  draggable={isDraggable}
                  onDragStart={(e) => {
                    if (isDraggable) {
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('playerId', invitation.playerId);
                    }
                  }}
                >
                  <div className="flex justify-between items-center gap-3">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          {isDraggable && (
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9h8M8 15h8" />
                            </svg>
                          )}
                          <span className="text-sm text-gray-900">
                            {player ? `${player.firstName} ${player.lastName}` : `Player ID: ${invitation.playerId}`}
                          </span>
                          {player && <Level level={player.level} className="text-sm" />}
                          <span className="text-xs text-gray-500 font-mono" title={`Accepted invitations: ${stats.acceptedCount}, Selected for teams: ${stats.selectedCount}`}>
                            {stats.acceptedCount}/{stats.selectedCount}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={invitation.status}
                        onChange={(e) => onStatusChange(invitation.id, e.target.value as 'open' | 'accepted' | 'declined')}
                        className={`text-xs px-2 py-1 rounded border focus:outline-none focus:ring-2 focus:ring-green-500 ${invitation.status === 'accepted' ? 'bg-green-100 text-green-800 border-green-300' :
                            invitation.status === 'declined' ? 'bg-red-100 text-red-800 border-red-300' :
                              'bg-yellow-100 text-yellow-800 border-yellow-300'
                          }`}
                      >
                        <option value="open">open</option>
                        <option value="accepted">accepted</option>
                        <option value="declined">declined</option>
                      </select>
                      {activeTab == 'open' && <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveInvitation(invitation.id);
                        }}
                        disabled={isAssigned}
                        className={`p-1 rounded transition-colors ${isAssigned
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-red-500 hover:text-red-700 hover:bg-red-50'
                          }`}
                        title={isAssigned ? "Cannot remove assigned player" : "Remove invitation"}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                      }
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
