import { usePlayers as usePlayersFromStore, useStore } from '../store';
import type { Player } from '../types';

export function usePlayers() {
  const {
    players,
    getPlayerById,
    getPlayerStats,
    addPlayer: addPlayerToStore,
    updatePlayer: updatePlayerInStore,
    deletePlayer: deletePlayerFromStore,
  } = usePlayersFromStore();

  const loading = useStore((state) => state.loading.players);
  const error = useStore((state) => state.errors.players);

  const addPlayer = async (playerData: Omit<Player, 'id'>): Promise<boolean> => {
    return addPlayerToStore(playerData);
  };

  const updatePlayer = async (playerId: string, updates: Partial<Omit<Player, 'id'>>): Promise<boolean> => {
    return updatePlayerInStore(playerId, updates);
  };

  const deletePlayer = async (playerId: string): Promise<boolean> => {
    return deletePlayerFromStore(playerId);
  };

  return {
    players,
    loading,
    error,
    addPlayer,
    updatePlayer,
    deletePlayer,
    getPlayerById,
    getPlayerStats,
  };
}