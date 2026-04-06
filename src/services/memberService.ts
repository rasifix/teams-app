import { apiClient } from './apiClient';
import type { Guardian, Player, Trainer } from '../types';

export interface MembersResponse {
  players: Player[];
  trainers: Trainer[];
}

const normalizePlayer = (player: Player): Player => ({
  ...player,
  status: player.status || 'active',
});

// Get all members (players and trainers) in one call
export async function getAllMembers(groupId: string): Promise<MembersResponse> {
  const response = await apiClient.request<MembersResponse>(
    apiClient.getGroupEndpoint(groupId, '/members')
  );

  return {
    ...response,
    players: response.players.map(normalizePlayer),
  };
}

// Player-specific operations
export async function getPlayers(groupId: string): Promise<Player[]> {
  const players = await apiClient.request<Player[]>(
    apiClient.getGroupEndpoint(groupId, '/members?role=player')
  );

  return players.map(normalizePlayer);
}

export async function addPlayer(groupId: string, playerData: Omit<Player, 'id'>): Promise<Player> {
  const player = await apiClient.request<Player>(
    apiClient.getGroupEndpoint(groupId, '/members'),
    {
      method: 'POST',
      body: JSON.stringify({ ...playerData, role: 'player' })
    }
  );

  return normalizePlayer(player);
}

export async function updatePlayer(groupId: string, id: string, playerData: Partial<Player>): Promise<Player> {
  const player = await apiClient.request<Player>(
    apiClient.getGroupEndpoint(groupId, `/members/${id}`),
    {
      method: 'PUT',
      body: JSON.stringify({ ...playerData, role: 'player' })
    }
  );

  return normalizePlayer(player);
}

export async function deletePlayer(groupId: string, id: string): Promise<void> {
  return apiClient.request<void>(
    apiClient.getGroupEndpoint(groupId, `/members/${id}`),
    { method: 'DELETE' }
  );
}

export async function getPlayerById(groupId: string, id: string): Promise<Player | null> {
  try {
    const player = await apiClient.request<Player>(
      apiClient.getGroupEndpoint(groupId, `/members/${id}`)
    );

    return normalizePlayer(player);
  } catch (error) {
    // If player not found, return null
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    throw error;
  }
}

export type CreateGuardianPayload = Pick<Guardian, 'firstName' | 'lastName' | 'email'>;

export async function addGuardianToPlayer(groupId: string, playerId: string, guardianData: CreateGuardianPayload): Promise<Player> {
  return apiClient.request<Player>(
    apiClient.getGroupEndpoint(groupId, `/members/${playerId}/guardians`),
    {
      method: 'POST',
      body: JSON.stringify(guardianData),
    }
  );
}

export async function deleteGuardianFromPlayer(groupId: string, playerId: string, guardianId: string): Promise<Player> {
  return apiClient.request<Player>(
    apiClient.getGroupEndpoint(groupId, `/members/${playerId}/guardians/${guardianId}`),
    {
      method: 'DELETE',
    }
  );
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