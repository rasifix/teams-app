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
  useEffect(() => {
    const loadTrainers = async () => {
      try {
        const storedTrainers = await trainerService.getTrainers();
        setTrainers(sortTrainers(storedTrainers));
        setError(null);
      } catch (err) {
        setError('Failed to load trainers from storage');
        console.error('Error loading trainers:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTrainers();
  }, []);

  const handleAddTrainer = async (trainerData: Omit<Trainer, 'id'>): Promise<boolean> => {
    try {
      const newTrainer: Trainer = {
        ...trainerData,
        id: crypto.randomUUID(),
      };

      await trainerService.addTrainer(newTrainer);
      // Re-fetch from service to ensure consistency
      const allTrainers = await trainerService.getTrainers();
      setTrainers(sortTrainers(allTrainers));
      setError(null);
      return true;
    } catch (err) {
      setError('Failed to add trainer');
      console.error('Error adding trainer:', err);
      return false;
    }
  };

  const handleUpdateTrainer = async (trainerId: string, updates: Partial<Omit<Trainer, 'id'>>): Promise<boolean> => {
    try {
      await trainerService.updateTrainer(trainerId, updates);
      // Re-fetch from service to ensure consistency
      const allTrainers = await trainerService.getTrainers();
      setTrainers(sortTrainers(allTrainers));
      setError(null);
      return true;
    } catch (err) {
      setError('Failed to update trainer');
      console.error('Error updating trainer:', err);
      return false;
    }
  };

  const handleDeleteTrainer = async (trainerId: string): Promise<boolean> => {
    try {
      await trainerService.deleteTrainer(trainerId);
      // Re-fetch from service to ensure consistency
      const allTrainers = await trainerService.getTrainers();
      setTrainers(sortTrainers(allTrainers));
      setError(null);
      return true;
    } catch (err) {
      setError('Failed to delete trainer');
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