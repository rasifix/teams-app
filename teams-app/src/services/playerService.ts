import type { Player } from '../types';
// Import localStorage utilities (temporary - will be replaced with API calls)
import * as localStorage from '../utils/localStorage';

// This service layer abstracts data access - easy to swap localStorage for API

export async function getPlayers(): Promise<Player[]> {
  // Simulate async API call (for future backend compatibility)
  return new Promise((resolve) => {
    const players = localStorage.getPlayers();
    setTimeout(() => resolve(players), 0); // Simulate network delay in dev
  });
}

export async function addPlayer(playerData: Omit<Player, 'id'>): Promise<Player> {
  return new Promise((resolve, reject) => {
    const newPlayer: Player = {
      ...playerData,
      id: crypto.randomUUID(),
    };
    
    const success = localStorage.addPlayer(newPlayer);
    if (success) {
      setTimeout(() => resolve(newPlayer), 0);
    } else {
      setTimeout(() => reject(new Error('Failed to add player')), 0);
    }
  });
}

export async function updatePlayer(id: string, updates: Partial<Omit<Player, 'id'>>): Promise<void> {
  return new Promise((resolve, reject) => {
    const success = localStorage.updatePlayer(id, updates);
    if (success) {
      setTimeout(() => resolve(), 0);
    } else {
      setTimeout(() => reject(new Error('Failed to update player')), 0);
    }
  });
}

export async function deletePlayer(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const success = localStorage.deletePlayer(id);
    if (success) {
      setTimeout(() => resolve(), 0);
    } else {
      setTimeout(() => reject(new Error('Failed to delete player')), 0);
    }
  });
}

export function getPlayerById(id: string): Player | null {
  // This one can remain synchronous as it's just a lookup
  return localStorage.getPlayerById(id);
}