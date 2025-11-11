import type { Event } from '../types';

export interface PlayerStats {
  acceptedCount: number;
  selectedCount: number;
}

export function getPlayerStats(playerId: string, events: Event[]): PlayerStats {
  let acceptedCount = 0;
  let selectedCount = 0;

  events.forEach((event: Event) => {
    // Check if player has accepted an invitation for this event
    const invitation = event.invitations.find(inv => inv.playerId === playerId);
    if (invitation && invitation.status === 'accepted') {
      acceptedCount++;
    }

    // Check if player has been selected for any team in this event
    const isSelected = event.teams.some(team => 
      team.selectedPlayers?.includes(playerId) || false
    );
    if (isSelected) {
      selectedCount++;
    }
  });

  return {
    acceptedCount,
    selectedCount
  };
}