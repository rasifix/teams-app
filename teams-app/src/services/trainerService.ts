import { apiClient } from './apiClient';
import type { Trainer } from '../types';

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