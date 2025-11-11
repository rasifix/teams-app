import { apiClient } from './apiClient';
import type { Player } from '../types';

export async function getPlayers(): Promise<Player[]> {
  return apiClient.request<Player[]>(
    apiClient.getGroupEndpoint('/members?role=player')
  );
}

export async function addPlayer(playerData: Omit<Player, 'id'>): Promise<Player> {
  return apiClient.request<Player>(
    apiClient.getGroupEndpoint('/members'),
    {
      method: 'POST',
      body: JSON.stringify({ ...playerData, role: 'player' })
    }
  );
}

export async function updatePlayer(id: string, playerData: Partial<Player>): Promise<Player> {
  return apiClient.request<Player>(
    apiClient.getGroupEndpoint(`/members/${id}`),
    {
      method: 'PUT',
      body: JSON.stringify(playerData)
    }
  );
}

export async function deletePlayer(id: string): Promise<void> {
  return apiClient.request<void>(
    apiClient.getGroupEndpoint(`/members/${id}`),
    { method: 'DELETE' }
  );
}

export async function getPlayerById(id: string): Promise<Player | null> {
  try {
    return await apiClient.request<Player>(
      apiClient.getGroupEndpoint(`/members/${id}`)
    );
  } catch (error) {
    // If player not found, return null
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    throw error;
  }
}