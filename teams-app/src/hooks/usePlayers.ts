import { useState, useEffect } from 'react';
import type { Player } from '../types';
import { getPlayers, addPlayer, updatePlayer, deletePlayer } from '../utils/localStorage';

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

  // Load players from localStorage on mount
  useEffect(() => {
    try {
      const storedPlayers = getPlayers();
      setPlayers(sortPlayers(storedPlayers));
      setError(null);
    } catch (err) {
      setError('Failed to load players from storage');
      console.error('Error loading players:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAddPlayer = (playerData: Omit<Player, 'id'>): boolean => {
    try {
      const newPlayer: Player = {
        ...playerData,
        id: crypto.randomUUID(),
      };

      const success = addPlayer(newPlayer);
      if (success) {
        // Re-fetch from localStorage to ensure consistency
        const allPlayers = getPlayers();
        setPlayers(sortPlayers(allPlayers));
        setError(null);
        return true;
      } else {
        setError('Failed to save player to storage');
        return false;
      }
    } catch (err) {
      setError('Failed to add player');
      console.error('Error adding player:', err);
      return false;
    }
  };

  const handleUpdatePlayer = (playerId: string, updates: Partial<Omit<Player, 'id'>>): boolean => {
    try {
      const success = updatePlayer(playerId, updates);
      if (success) {
        // Re-fetch from localStorage to ensure consistency
        const allPlayers = getPlayers();
        setPlayers(sortPlayers(allPlayers));
        setError(null);
        return true;
      } else {
        setError('Failed to update player in storage');
        return false;
      }
    } catch (err) {
      setError('Failed to update player');
      console.error('Error updating player:', err);
      return false;
    }
  };

  const handleDeletePlayer = (playerId: string): boolean => {
    try {
      const success = deletePlayer(playerId);
      if (success) {
        // Re-fetch from localStorage to ensure consistency
        const allPlayers = getPlayers();
        setPlayers(sortPlayers(allPlayers));
        setError(null);
        return true;
      } else {
        setError('Failed to delete player from storage');
        return false;
      }
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