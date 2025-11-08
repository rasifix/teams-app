import type { Trainer } from '../types';
// Import localStorage utilities (temporary - will be replaced with API calls)
import * as localStorage from '../utils/localStorage';

// This service layer abstracts data access - easy to swap localStorage for API

export async function getTrainers(): Promise<Trainer[]> {
  // Simulate async API call (for future backend compatibility)
  return new Promise((resolve) => {
    const trainers = localStorage.getTrainers();
    setTimeout(() => resolve(trainers), 0); // Simulate network delay in dev
  });
}

export async function addTrainer(trainerData: Omit<Trainer, 'id'>): Promise<Trainer> {
  return new Promise((resolve, reject) => {
    const newTrainer: Trainer = {
      ...trainerData,
      id: crypto.randomUUID(),
    };
    
    const success = localStorage.addTrainer(newTrainer);
    if (success) {
      setTimeout(() => resolve(newTrainer), 0);
    } else {
      setTimeout(() => reject(new Error('Failed to add trainer')), 0);
    }
  });
}

export async function updateTrainer(id: string, updates: Partial<Omit<Trainer, 'id'>>): Promise<void> {
  return new Promise((resolve, reject) => {
    const success = localStorage.updateTrainer(id, updates);
    if (success) {
      setTimeout(() => resolve(), 0);
    } else {
      setTimeout(() => reject(new Error('Failed to update trainer')), 0);
    }
  });
}

export async function deleteTrainer(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const success = localStorage.deleteTrainer(id);
    if (success) {
      setTimeout(() => resolve(), 0);
    } else {
      setTimeout(() => reject(new Error('Failed to delete trainer')), 0);
    }
  });
}

export function getTrainerById(id: string): Trainer | null {
  // This one can remain synchronous as it's just a lookup
  return localStorage.getTrainerById(id);
}