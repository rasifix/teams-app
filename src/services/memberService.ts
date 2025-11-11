import { apiClient } from './apiClient';
import type { Player, Trainer } from '../types';

export interface MembersResponse {
  players: Player[];
  trainers: Trainer[];
}

// Get all members (players and trainers) in one call
export async function getAllMembers(): Promise<MembersResponse> {
  return apiClient.request<MembersResponse>(
    apiClient.getGroupEndpoint('/members')
  );
}

// Player-specific operations
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

// Trainer-specific operations
export async function getTrainers(): Promise<Trainer[]> {
  return apiClient.request<Trainer[]>(
    apiClient.getGroupEndpoint('/members?role=trainer')
  );
}

export async function addTrainer(trainerData: Omit<Trainer, 'id'>): Promise<Trainer> {
  return apiClient.request<Trainer>(
    apiClient.getGroupEndpoint('/members'),
    {
      method: 'POST',
      body: JSON.stringify({ ...trainerData, role: 'trainer' })
    }
  );
}

export async function updateTrainer(id: string, trainerData: Partial<Trainer>): Promise<Trainer> {
  return apiClient.request<Trainer>(
    apiClient.getGroupEndpoint(`/members/${id}`),
    {
      method: 'PUT',
      body: JSON.stringify(trainerData)
    }
  );
}

export async function deleteTrainer(id: string): Promise<void> {
  return apiClient.request<void>(
    apiClient.getGroupEndpoint(`/members/${id}`),
    { method: 'DELETE' }
  );
}

export async function getTrainerById(id: string): Promise<Trainer | null> {
  try {
    return await apiClient.request<Trainer>(
      apiClient.getGroupEndpoint(`/members/${id}`)
    );
  } catch (error) {
    // If trainer not found, return null
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    throw error;
  }
}