import { useOutletContext } from 'react-router-dom';
import type { Player } from '../types';
import PlayerStatisticsTable from '../components/PlayerStatisticsTable';
import type { Event } from '../types';
import { usePlayers } from '../hooks/usePlayers';

interface StatisticsOutletContext {
  filteredEvents: Event[];
}

interface PlayerStats {
  player: Player;
  invitedCount: number;
  acceptedCount: number;
  selectedCount: number;
  acceptanceRate: number;
  selectionRate: number;
}

export default function PlayerStatisticsPage() {
  const { filteredEvents } = useOutletContext<StatisticsOutletContext>();
  const { players } = usePlayers();

  // Calculate stats directly in render - no useEffect needed!
  const playerStats: PlayerStats[] = players.map(player => {
    // Count invitations
    const invitedCount = filteredEvents.filter(event =>
      event.invitations.some(inv => inv.playerId === player.id)
    ).length;

    // Count accepted invitations
    const acceptedCount = filteredEvents.filter(event =>
      event.invitations.some(inv => inv.playerId === player.id && inv.status === 'accepted')
    ).length;

    // Count selections (player assigned to a team)
    const selectedCount = filteredEvents.filter(event =>
      event.teams.some(team => (team.selectedPlayers || []).includes(player.id))
    ).length;

    const acceptanceRate = invitedCount > 0 ? (acceptedCount / invitedCount) * 100 : 0;
    const selectionRate = acceptedCount > 0 ? (selectedCount / acceptedCount) * 100 : 0;

    return {
      player,
      invitedCount,
      acceptedCount,
      selectedCount,
      acceptanceRate,
      selectionRate,
    };
  }).sort((a, b) => {
    // Sort by last name, then first name
    const lastNameCompare = a.player.lastName.toLowerCase().localeCompare(b.player.lastName.toLowerCase());
    if (lastNameCompare !== 0) {
      return lastNameCompare;
    }
    return a.player.firstName.toLowerCase().localeCompare(b.player.firstName.toLowerCase());
  });

  return <PlayerStatisticsTable playerStats={playerStats} />;
}
