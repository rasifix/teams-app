import { useState, useEffect } from 'react';
import type { Player } from '../types';
import * as playerService from '../services/playerService';

// Helper function to sort players by lastName, then by firstName
function sortPlayers(players: Player[]): Player[] {
  return [...players].sort((a, b) => {
    // First sort by lastName (ascending - alphabetical)
    const lastNameCompare = a.lastName.toLowerCase().localeCompare(b.lastName.toLowerCase());
    if (lastNameCompare !== 0) {
      return lastNameCompare;
    }
    // Then sort by firstName (ascending - alphabetical)
    return a.firstName.toLowerCase().localeCompare(b.firstName.toLowerCase());
  });
}

export function usePlayers() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load players from service on mount
  useEffect(() => {
    const loadPlayers = async () => {
      try {
        const storedPlayers = await playerService.getPlayers();
        setPlayers(sortPlayers(storedPlayers));
        setError(null);
      } catch (err) {
        setError('Failed to load players from storage');
        console.error('Error loading players:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPlayers();
  }, []);

  const handleAddPlayer = async (playerData: Omit<Player, 'id'>): Promise<boolean> => {
    try {
      const newPlayer: Player = {
        ...playerData,
        id: crypto.randomUUID(),
      };

      await playerService.addPlayer(newPlayer);
      // Re-fetch from service to ensure consistency
      const allPlayers = await playerService.getPlayers();
      setPlayers(sortPlayers(allPlayers));
      setError(null);
      return true;
    } catch (err) {
      setError('Failed to add player');
      console.error('Error adding player:', err);
      return false;
    }
  };

  const handleUpdatePlayer = async (playerId: string, updates: Partial<Omit<Player, 'id'>>): Promise<boolean> => {
    try {
      await playerService.updatePlayer(playerId, updates);
      // Re-fetch from service to ensure consistency
      const allPlayers = await playerService.getPlayers();
      setPlayers(sortPlayers(allPlayers));
      setError(null);
      return true;
    } catch (err) {
      setError('Failed to update player');
      console.error('Error updating player:', err);
      return false;
    }
  };

  const handleDeletePlayer = async (playerId: string): Promise<boolean> => {
    try {
      await playerService.deletePlayer(playerId);
      // Re-fetch from service to ensure consistency
      const allPlayers = await playerService.getPlayers();
      setPlayers(sortPlayers(allPlayers));
      setError(null);
      return true;
    } catch (err) {
      setError('Failed to delete player');
      console.error('Error deleting player:', err);
      return false;
    }
  };

  return {
    players,
    loading,
    error,
    addPlayer: handleAddPlayer,
    updatePlayer: handleUpdatePlayer,
    deletePlayer: handleDeletePlayer,
  };
}