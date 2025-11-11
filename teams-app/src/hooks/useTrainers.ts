import { useState, useEffect } from 'react';
import type { Trainer } from '../types';
import * as trainerService from '../services/trainerService';

// Helper function to sort trainers by lastName, then by firstName
function sortTrainers(trainers: Trainer[]): Trainer[] {
  return [...trainers].sort((a, b) => {
    // First sort by lastName (ascending - alphabetical)
    const lastNameCompare = a.lastName.toLowerCase().localeCompare(b.lastName.toLowerCase());
    if (lastNameCompare !== 0) {
      return lastNameCompare;
    }
    // Then sort by firstName (ascending - alphabetical)
    return a.firstName.toLowerCase().localeCompare(b.firstName.toLowerCase());
  });
}

export function useTrainers() {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load trainers from service on mount
  const loadTrainers = async () => {
    try {
      setLoading(true);
      const apiTrainers = await trainerService.getTrainers();
      setTrainers(sortTrainers(apiTrainers));
      setError(null);
    } catch (err) {
      setError('Failed to load trainers from server');
      console.error('Error loading trainers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrainers();
  }, []);

  const handleAddTrainer = async (trainerData: Omit<Trainer, 'id'>): Promise<boolean> => {
    try {
      await trainerService.addTrainer(trainerData);
      await loadTrainers(); // Refresh from API
      setError(null);
      return true;
    } catch (err) {
      setError('Failed to save trainer to server');
      console.error('Error adding trainer:', err);
      return false;
    }
  };

  const handleUpdateTrainer = async (trainerId: string, updates: Partial<Omit<Trainer, 'id'>>): Promise<boolean> => {
    try {
      await trainerService.updateTrainer(trainerId, updates);
      await loadTrainers(); // Refresh from API
      setError(null);
      return true;
    } catch (err) {
      setError('Failed to update trainer on server');
      console.error('Error updating trainer:', err);
      return false;
    }
  };

  const handleDeleteTrainer = async (trainerId: string): Promise<boolean> => {
    try {
      await trainerService.deleteTrainer(trainerId);
      await loadTrainers(); // Refresh from API
      setError(null);
      return true;
    } catch (err) {
      setError('Failed to delete trainer on server');
      console.error('Error deleting trainer:', err);
      return false;
    }
  };

  return {
    trainers,
    loading,
    error,
    addTrainer: handleAddTrainer,
    updateTrainer: handleUpdateTrainer,
    deleteTrainer: handleDeleteTrainer,
  };
}