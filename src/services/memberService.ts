import { apiClient } from './apiClient';
import type { Player, Trainer } from '../types';

export interface MembersResponse {
  players: Player[];
  trainers: Trainer[];
}

// Get all members (players and trainers) in one call
export async function getAllMembers(groupId: string): Promise<MembersResponse> {
  return apiClient.request<MembersResponse>(
    apiClient.getGroupEndpoint(groupId, '/members')
  );
}

// Player-specific operations
export async function getPlayers(groupId: string): Promise<Player[]> {
  return apiClient.request<Player[]>(
    apiClient.getGroupEndpoint(groupId, '/members?role=player')
  );
}

export async function addPlayer(groupId: string, playerData: Omit<Player, 'id'>): Promise<Player> {
  return apiClient.request<Player>(
    apiClient.getGroupEndpoint(groupId, '/members'),
    {
      method: 'POST',
      body: JSON.stringify({ ...playerData, role: 'player' })
    }
  );
}

export async function updatePlayer(groupId: string, id: string, playerData: Partial<Player>): Promise<Player> {
  return apiClient.request<Player>(
    apiClient.getGroupEndpoint(groupId, `/members/${id}`),
    {
      method: 'PUT',
      body: JSON.stringify({ ...playerData, role: 'player' })
    }
  );
}

export async function deletePlayer(groupId: string, id: string): Promise<void> {
  return apiClient.request<void>(
    apiClient.getGroupEndpoint(groupId, `/members/${id}`),
    { method: 'DELETE' }
  );
}

export async function getPlayerById(groupId: string, id: string): Promise<Player | null> {
  try {
    return await apiClient.request<Player>(
      apiClient.getGroupEndpoint(groupId, `/members/${id}`)
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
export async function getTrainers(groupId: string): Promise<Trainer[]> {
  return apiClient.request<Trainer[]>(
    apiClient.getGroupEndpoint(groupId, '/members?role=trainer')
  );
}

export async function addTrainer(groupId: string, trainerData: Omit<Trainer, 'id'>): Promise<Trainer> {
  return apiClient.request<Trainer>(
    apiClient.getGroupEndpoint(groupId, '/members'),
    {
      method: 'POST',
      body: JSON.stringify({ ...trainerData, role: 'trainer' })
    }
  );
}

export async function updateTrainer(groupId: string, id: string, trainerData: Partial<Trainer>): Promise<Trainer> {
  return apiClient.request<Trainer>(
    apiClient.getGroupEndpoint(groupId, `/members/${id}`),
    {
      method: 'PUT',
      body: JSON.stringify(trainerData)
    }
  );
}

export async function deleteTrainer(groupId: string, id: string): Promise<void> {
  return apiClient.request<void>(
    apiClient.getGroupEndpoint(groupId, `/members/${id}`),
    { method: 'DELETE' }
  );
}

export async function getTrainerById(groupId: string, id: string): Promise<Trainer | null> {
  try {
    return await apiClient.request<Trainer>(
      apiClient.getGroupEndpoint(groupId, `/members/${id}`)
    );
  } catch (error) {
    // If trainer not found, return null
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    throw error;
  }
}