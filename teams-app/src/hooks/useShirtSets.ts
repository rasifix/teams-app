import { useState, useEffect } from 'react';
import type { ShirtSet, Shirt } from '../types';
import * as shirtService from '../services/shirtService';

// Helper function to sort shirt sets by sponsor, then by color
function sortShirtSets(shirtSets: ShirtSet[]): ShirtSet[] {
  return [...shirtSets].sort((a, b) => {
    // First sort by sponsor (ascending - alphabetical)
    const sponsorCompare = a.sponsor.toLowerCase().localeCompare(b.sponsor.toLowerCase());
    if (sponsorCompare !== 0) {
      return sponsorCompare;
    }
    // Then sort by color (ascending - alphabetical)
    return a.color.toLowerCase().localeCompare(b.color.toLowerCase());
  });
}

export function useShirtSets() {
  const [shirtSets, setShirtSets] = useState<ShirtSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load shirt sets from service on mount
  const loadShirtSets = async () => {
    try {
      setLoading(true);
      const apiShirtSets = await shirtService.getShirtSets();
      setShirtSets(sortShirtSets(apiShirtSets));
      setError(null);
    } catch (err) {
      setError('Failed to load shirt sets from server');
      console.error('Error loading shirt sets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShirtSets();
  }, []);

  // Add new shirt set
  const addShirtSet = async (shirtSetData: Omit<ShirtSet, 'id'>): Promise<ShirtSet | null> => {
    try {
      setError(null);
      const newShirtSet = await shirtService.addShirtSet(shirtSetData);
      await loadShirtSets(); // Refresh from API
      return newShirtSet;
    } catch (err) {
      setError('Failed to save shirt set to server');
      console.error('Error adding shirt set:', err);
      return null;
    }
  };

  // Update existing shirt set
  const updateShirtSet = async (id: string, updates: Partial<Omit<ShirtSet, 'id'>>): Promise<boolean> => {
    try {
      setError(null);
      await shirtService.updateShirtSet(id, updates);
      await loadShirtSets(); // Refresh from API
      return true;
    } catch (err) {
      setError('Failed to update shirt set on server');
      console.error('Error updating shirt set:', err);
      return false;
    }
  };

  // Delete shirt set
  const deleteShirtSet = async (id: string): Promise<boolean> => {
    try {
      setError(null);
      await shirtService.deleteShirtSet(id);
      await loadShirtSets(); // Refresh from API
      return true;
    } catch (err) {
      setError('Failed to delete shirt set on server');
      console.error('Error deleting shirt set:', err);
      return false;
    }
  };

  // Add shirt to set
  const addShirtToSet = async (shirtSetId: string, shirtData: Shirt): Promise<Shirt | null> => {
    try {
      setError(null);
      const newShirt = await shirtService.addShirtToSet(shirtSetId, shirtData);
      await loadShirtSets(); // Refresh from API
      return newShirt;
    } catch (err) {
      setError('Failed to add shirt to set on server');
      console.error('Error adding shirt to set:', err);
      return null;
    }
  };

  // Remove shirt from set
  const removeShirtFromSet = async (shirtSetId: string, shirtNumber: number): Promise<boolean> => {
    try {
      setError(null);
      await shirtService.removeShirtFromSet(shirtSetId, shirtNumber);
      await loadShirtSets(); // Refresh from API
      return true;
    } catch (err) {
      setError('Failed to remove shirt from set on server');
      console.error('Error removing shirt from set:', err);
      return false;
    }
  };

  // Update shirt in set
  const updateShirt = async (shirtSetId: string, updatedShirt: Shirt): Promise<boolean> => {
    try {
      setError(null);
      await shirtService.updateShirt(shirtSetId, updatedShirt);
      await loadShirtSets(); // Refresh from API
      return true;
    } catch (err) {
      setError('Failed to update shirt on server');
      console.error('Error updating shirt:', err);
      return false;
    }
  };

  return {
    shirtSets,
    loading,
    error,
    addShirtSet,
    updateShirtSet,
    deleteShirtSet,
    addShirtToSet,
    removeShirtFromSet,
    updateShirt,
  };
}