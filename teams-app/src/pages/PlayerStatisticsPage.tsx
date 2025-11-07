import { useEffect, useState } from 'react';
import { getPlayers, getEvents } from '../utils/localStorage';
import type { Player } from '../types';
import PlayerStatisticsTable from '../components/PlayerStatisticsTable';

interface PlayerStats {
  player: Player;
  invitedCount: number;
  acceptedCount: number;
  selectedCount: number;
  acceptanceRate: number;
  selectionRate: number;
}

export default function PlayerStatisticsPage() {
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);

  useEffect(() => {
    const players = getPlayers();
    const events = getEvents();

    const stats: PlayerStats[] = players.map(player => {
      // Count invitations
      const invitedCount = events.filter(event =>
        event.invitations.some(inv => inv.playerId === player.id)
      ).length;

      // Count accepted invitations
      const acceptedCount = events.filter(event =>
        event.invitations.some(inv => inv.playerId === player.id && inv.status === 'accepted')
      ).length;

      // Count selections (player assigned to a team)
      const selectedCount = events.filter(event =>
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
    });

    // Sort by last name, then first name
    stats.sort((a, b) => {
      const lastNameCompare = a.player.lastName.toLowerCase().localeCompare(b.player.lastName.toLowerCase());
      if (lastNameCompare !== 0) {
        return lastNameCompare;
      }
      return a.player.firstName.toLowerCase().localeCompare(b.player.firstName.toLowerCase());
    });

    setPlayerStats(stats);
  }, []);

  return <PlayerStatisticsTable playerStats={playerStats} />;
}
