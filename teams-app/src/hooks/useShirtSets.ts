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
  useEffect(() => {
    const loadShirtSets = async () => {
      try {
        const storedShirtSets = await shirtService.getShirtSets();
        setShirtSets(sortShirtSets(storedShirtSets));
        setError(null);
      } catch (err) {
        setError('Failed to load shirt sets from storage');
        console.error('Error loading shirt sets:', err);
      } finally {
        setLoading(false);
      }
    };

    loadShirtSets();
  }, []);

  // Add new shirt set
  const addShirtSet = async (shirtSetData: Omit<ShirtSet, 'id'>): Promise<ShirtSet | null> => {
    try {
      setError(null);
      const newShirtSet = await shirtService.addShirtSet(shirtSetData);
      setShirtSets(prev => sortShirtSets([...prev, newShirtSet]));
      return newShirtSet;
    } catch (err) {
      setError('Failed to add shirt set');
      console.error('Error adding shirt set:', err);
      return null;
    }
  };

  // Update existing shirt set
  const updateShirtSet = async (id: string, updates: Partial<Omit<ShirtSet, 'id'>>): Promise<boolean> => {
    try {
      setError(null);
      await shirtService.updateShirtSet(id, updates);
      setShirtSets(prev => {
        const updated = prev.map(shirtSet => 
          shirtSet.id === id ? { ...shirtSet, ...updates } : shirtSet
        );
        return sortShirtSets(updated);
      });
      return true;
    } catch (err) {
      setError('Failed to update shirt set');
      console.error('Error updating shirt set:', err);
      return false;
    }
  };

  // Delete shirt set
  const deleteShirtSet = async (id: string): Promise<boolean> => {
    try {
      setError(null);
      await shirtService.deleteShirtSet(id);
      setShirtSets(prev => prev.filter(shirtSet => shirtSet.id !== id));
      return true;
    } catch (err) {
      setError('Failed to delete shirt set');
      console.error('Error deleting shirt set:', err);
      return false;
    }
  };

  // Add shirt to set
  const addShirtToSet = async (shirtSetId: string, shirtData: Omit<Shirt, 'id'>): Promise<Shirt | null> => {
    try {
      setError(null);
      const newShirt = await shirtService.addShirtToSet(shirtSetId, shirtData);
      setShirtSets(prev => 
        prev.map(shirtSet => 
          shirtSet.id === shirtSetId 
            ? { ...shirtSet, shirts: [...shirtSet.shirts, newShirt] }
            : shirtSet
        )
      );
      return newShirt;
    } catch (err) {
      setError('Failed to add shirt to set');
      console.error('Error adding shirt to set:', err);
      return null;
    }
  };

  // Remove shirt from set
  const removeShirtFromSet = async (shirtSetId: string, shirtId: string): Promise<boolean> => {
    try {
      setError(null);
      await shirtService.removeShirtFromSet(shirtSetId, shirtId);
      setShirtSets(prev => 
        prev.map(shirtSet => 
          shirtSet.id === shirtSetId 
            ? { ...shirtSet, shirts: shirtSet.shirts.filter(shirt => shirt.id !== shirtId) }
            : shirtSet
        )
      );
      return true;
    } catch (err) {
      setError('Failed to remove shirt from set');
      console.error('Error removing shirt from set:', err);
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
  };
}