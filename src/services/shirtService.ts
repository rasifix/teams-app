import { apiClient } from './apiClient';
import type { ShirtSet, Shirt } from '../types';

export async function getShirtSets(squadId: string): Promise<ShirtSet[]> {
  return apiClient.request<ShirtSet[]>(
    apiClient.getSquadEndpoint(squadId, '/shirtsets')
  );
}

export async function addShirtSet(squadId: string, shirtData: Omit<ShirtSet, 'id'>): Promise<ShirtSet> {
  return apiClient.request<ShirtSet>(
    apiClient.getSquadEndpoint(squadId, '/shirtsets'),
    {
      method: 'POST',
      body: JSON.stringify(shirtData)
    }
  );
}

export async function updateShirtSet(squadId: string, id: string, shirtData: Partial<ShirtSet>): Promise<ShirtSet> {
  const shirtSet = await getShirtSetById(squadId, id);
  if (!shirtSet) {
    throw new Error('Shirt set not found');
  }

  const payload: Omit<ShirtSet, 'id'> = {
    sponsor: shirtData.sponsor ?? shirtSet.sponsor,
    color: shirtData.color ?? shirtSet.color,
    shirts: shirtData.shirts ?? shirtSet.shirts
  };

  return apiClient.request<ShirtSet>(
    apiClient.getSquadEndpoint(squadId, `/shirtsets/${id}`),
    {
      method: 'PUT',
      body: JSON.stringify(payload)
    }
  );
}

export async function deleteShirtSet(squadId: string, id: string): Promise<void> {
  return apiClient.request<void>(
    apiClient.getSquadEndpoint(squadId, `/shirtsets/${id}`),
    { method: 'DELETE' }
  );
}

export async function getShirtSetById(squadId: string, id: string): Promise<ShirtSet | null> {
  try {
    return await apiClient.request<ShirtSet>(
      apiClient.getSquadEndpoint(squadId, `/shirtsets/${id}`)
    );
  } catch (error) {
    // If shirt set not found, return null
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    throw error;
  }
}

// Helper function to add a shirt to a shirt set
export async function addShirtToSet(squadId: string, shirtSetId: string, shirtData: Shirt): Promise<Shirt> {
  const shirtSet = await getShirtSetById(squadId, shirtSetId);
  if (!shirtSet) {
    throw new Error('Shirt set not found');
  }

  const updatedShirts = [...shirtSet.shirts, shirtData];
  await updateShirtSet(squadId, shirtSetId, {
    sponsor: shirtSet.sponsor,
    color: shirtSet.color,
    shirts: updatedShirts
  });
  return shirtData;
}

// Helper function to remove a shirt from a shirt set
export async function removeShirtFromSet(squadId: string, shirtSetId: string, shirtNumber: number): Promise<void> {
  const shirtSet = await getShirtSetById(squadId, shirtSetId);
  if (!shirtSet) {
    throw new Error('Shirt set not found');
  }

  const updatedShirts = shirtSet.shirts.filter(shirt => shirt.number !== shirtNumber);
  await updateShirtSet(squadId, shirtSetId, {
    sponsor: shirtSet.sponsor,
    color: shirtSet.color,
    shirts: updatedShirts
  });
}

// Helper function to update a shirt in a shirt set
export async function updateShirt(squadId: string, shirtSetId: string, updatedShirt: Shirt): Promise<void> {
  const shirtSet = await getShirtSetById(squadId, shirtSetId);
  if (!shirtSet) {
    throw new Error('Shirt set not found');
  }

  const updatedShirts = shirtSet.shirts.map(shirt => 
    shirt.number === updatedShirt.number ? updatedShirt : shirt
  );
  await updateShirtSet(squadId, shirtSetId, {
    sponsor: shirtSet.sponsor,
    color: shirtSet.color,
    shirts: updatedShirts
  });
}