import type { ShirtSet, Shirt } from '../types';
// Import localStorage utilities (temporary - will be replaced with API calls)
import * as localStorage from '../utils/localStorage';

// This service layer abstracts data access - easy to swap localStorage for API

export async function getShirtSets(): Promise<ShirtSet[]> {
  // Simulate async API call (for future backend compatibility)
  return new Promise((resolve) => {
    const shirtSets = localStorage.getShirtSets();
    setTimeout(() => resolve(shirtSets), 0); // Simulate network delay in dev
  });
}

export async function addShirtSet(shirtSetData: Omit<ShirtSet, 'id'>): Promise<ShirtSet> {
  return new Promise((resolve, reject) => {
    const newShirtSet: ShirtSet = {
      ...shirtSetData,
      id: crypto.randomUUID(),
    };
    
    const success = localStorage.addShirtSet(newShirtSet);
    if (success) {
      setTimeout(() => resolve(newShirtSet), 0);
    } else {
      setTimeout(() => reject(new Error('Failed to add shirt set')), 0);
    }
  });
}

export async function updateShirtSet(id: string, updates: Partial<Omit<ShirtSet, 'id'>>): Promise<void> {
  return new Promise((resolve, reject) => {
    const success = localStorage.updateShirtSet(id, updates);
    if (success) {
      setTimeout(() => resolve(), 0);
    } else {
      setTimeout(() => reject(new Error('Failed to update shirt set')), 0);
    }
  });
}

export async function deleteShirtSet(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const success = localStorage.deleteShirtSet(id);
    if (success) {
      setTimeout(() => resolve(), 0);
    } else {
      setTimeout(() => reject(new Error('Failed to delete shirt set')), 0);
    }
  });
}

export function getShirtSetById(id: string): ShirtSet | null {
  // This one can remain synchronous as it's just a lookup
  return localStorage.getShirtSetById(id);
}

// Helper function to add a shirt to a shirt set
export async function addShirtToSet(shirtSetId: string, shirtData: Omit<Shirt, 'id'>): Promise<Shirt> {
  return new Promise((resolve, reject) => {
    const shirtSet = localStorage.getShirtSetById(shirtSetId);
    if (!shirtSet) {
      setTimeout(() => reject(new Error('Shirt set not found')), 0);
      return;
    }

    const newShirt: Shirt = {
      ...shirtData,
      id: crypto.randomUUID(),
    };

    const updatedShirts = [...shirtSet.shirts, newShirt];
    const success = localStorage.updateShirtSet(shirtSetId, { shirts: updatedShirts });
    
    if (success) {
      setTimeout(() => resolve(newShirt), 0);
    } else {
      setTimeout(() => reject(new Error('Failed to add shirt to set')), 0);
    }
  });
}

// Helper function to remove a shirt from a shirt set
export async function removeShirtFromSet(shirtSetId: string, shirtId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const shirtSet = localStorage.getShirtSetById(shirtSetId);
    if (!shirtSet) {
      setTimeout(() => reject(new Error('Shirt set not found')), 0);
      return;
    }

    const updatedShirts = shirtSet.shirts.filter(shirt => shirt.id !== shirtId);
    const success = localStorage.updateShirtSet(shirtSetId, { shirts: updatedShirts });
    
    if (success) {
      setTimeout(() => resolve(), 0);
    } else {
      setTimeout(() => reject(new Error('Failed to remove shirt from set')), 0);
    }
  });
}