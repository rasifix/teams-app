import { apiClient } from './apiClient';
import type { ShirtSet, Shirt } from '../types';

export async function getShirtSets(groupId: string): Promise<ShirtSet[]> {
  return apiClient.request<ShirtSet[]>(
    apiClient.getGroupEndpoint(groupId, '/shirtsets')
  );
}

export async function addShirtSet(groupId: string, shirtData: Omit<ShirtSet, 'id'>): Promise<ShirtSet> {
  return apiClient.request<ShirtSet>(
    apiClient.getGroupEndpoint(groupId, '/shirtsets'),
    {
      method: 'POST',
      body: JSON.stringify(shirtData)
    }
  );
}

export async function updateShirtSet(groupId: string, id: string, shirtData: Partial<ShirtSet>): Promise<ShirtSet> {
  return apiClient.request<ShirtSet>(
    apiClient.getGroupEndpoint(groupId, `/shirtsets/${id}`),
    {
      method: 'PUT',
      body: JSON.stringify(shirtData)
    }
  );
}

export async function deleteShirtSet(groupId: string, id: string): Promise<void> {
  return apiClient.request<void>(
    apiClient.getGroupEndpoint(groupId, `/shirtsets/${id}`),
    { method: 'DELETE' }
  );
}

export async function getShirtSetById(groupId: string, id: string): Promise<ShirtSet | null> {
  try {
    return await apiClient.request<ShirtSet>(
      apiClient.getGroupEndpoint(groupId, `/shirtsets/${id}`)
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
export async function addShirtToSet(groupId: string, shirtSetId: string, shirtData: Shirt): Promise<Shirt> {
  const shirtSet = await getShirtSetById(groupId, shirtSetId);
  if (!shirtSet) {
    throw new Error('Shirt set not found');
  }

  const updatedShirts = [...shirtSet.shirts, shirtData];
  await updateShirtSet(groupId, shirtSetId, { shirts: updatedShirts });
  return shirtData;
}

// Helper function to remove a shirt from a shirt set
export async function removeShirtFromSet(groupId: string, shirtSetId: string, shirtNumber: number): Promise<void> {
  const shirtSet = await getShirtSetById(groupId, shirtSetId);
  if (!shirtSet) {
    throw new Error('Shirt set not found');
  }

  const updatedShirts = shirtSet.shirts.filter(shirt => shirt.number !== shirtNumber);
  await updateShirtSet(groupId, shirtSetId, { shirts: updatedShirts });
}

// Helper function to update a shirt in a shirt set
export async function updateShirt(groupId: string, shirtSetId: string, updatedShirt: Shirt): Promise<void> {
  const shirtSet = await getShirtSetById(groupId, shirtSetId);
  if (!shirtSet) {
    throw new Error('Shirt set not found');
  }

  const updatedShirts = shirtSet.shirts.map(shirt => 
    shirt.number === updatedShirt.number ? updatedShirt : shirt
  );
  await updateShirtSet(groupId, shirtSetId, { shirts: updatedShirts });
}