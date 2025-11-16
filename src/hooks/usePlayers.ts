import { useState, useEffect, useCallback } from 'react';
import type { Player } from '../types';
import * as memberService from '../services/memberService';
import { useGroup } from '../store/useStore';

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
  const group = useGroup();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load players from service on mount
  const loadPlayers = useCallback(async () => {
    if (!group) return;
    
    try {
      setLoading(true);
      const apiPlayers = await memberService.getPlayers(group.id);
      setPlayers(sortPlayers(apiPlayers));
      setError(null);
    } catch (err) {
      setError('Failed to load players from server');
      console.error('Error loading players:', err);
    } finally {
      setLoading(false);
    }
  }, [group]);

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  const handleAddPlayer = async (playerData: Omit<Player, 'id'>): Promise<boolean> => {
    if (!group) return false;
    
    try {
      await memberService.addPlayer(group.id, playerData);
      await loadPlayers(); // Refresh from API
      setError(null);
      return true;
    } catch (err) {
      setError('Failed to save player to server');
      console.error('Error adding player:', err);
      return false;
    }
  };

  const handleUpdatePlayer = async (playerId: string, updates: Partial<Omit<Player, 'id'>>): Promise<boolean> => {
    if (!group) return false;
    
    try {
      await memberService.updatePlayer(group.id, playerId, updates);
      await loadPlayers(); // Refresh from API
      setError(null);
      return true;
    } catch (err) {
      setError('Failed to update player on server');
      console.error('Error updating player:', err);
      return false;
    }
  };

  const handleDeletePlayer = async (playerId: string): Promise<boolean> => {
    if (!group) return false;
    
    try {
      await memberService.deletePlayer(group.id, playerId);
      await loadPlayers(); // Refresh from API
      setError(null);
      return true;
    } catch (err) {
      setError('Failed to delete player on server');
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