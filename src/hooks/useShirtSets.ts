import { useShirtSets as useShirtSetsFromStore, useAppLoading, useAppHasErrors, useAppErrors } from '../store';

export function useShirtSets() {
  const {
    shirtSets,
    addShirtSet: addShirtSetToStore,
    updateShirtSet: updateShirtSetInStore,
    deleteShirtSet: deleteShirtSetFromStore,
    addShirtToSet: addShirtToSetInStore,
    removeShirtFromSet: removeShirtFromSetInStore,
    updateShirt: updateShirtInStore,
  } = useShirtSetsFromStore();
  
  // Use store-wide loading and error states
  const loading = useAppLoading();
  const hasErrors = useAppHasErrors();
  const errors = useAppErrors();
  
  // Use shirt set-specific error if available, otherwise general error indicator
  const error = errors.shirtSets || (hasErrors ? 'Failed to load data' : null);

  // Add new shirt set
  const addShirtSet = async (shirtSetData: Omit<import('../types').ShirtSet, 'id'>): Promise<import('../types').ShirtSet | null> => {
    return await addShirtSetToStore(shirtSetData);
  };

  // Update existing shirt set
  const updateShirtSet = async (id: string, updates: Partial<Omit<import('../types').ShirtSet, 'id'>>): Promise<boolean> => {
    return await updateShirtSetInStore(id, updates);
  };

  // Delete shirt set
  const deleteShirtSet = async (id: string): Promise<boolean> => {
    return await deleteShirtSetFromStore(id);
  };

  // Add shirt to set
  const addShirtToSet = async (shirtSetId: string, shirtData: import('../types').Shirt): Promise<import('../types').Shirt | null> => {
    return await addShirtToSetInStore(shirtSetId, shirtData);
  };

  // Remove shirt from set
  const removeShirtFromSet = async (shirtSetId: string, shirtNumber: number): Promise<boolean> => {
    return await removeShirtFromSetInStore(shirtSetId, shirtNumber);
  };

  // Update shirt in set
  const updateShirt = async (shirtSetId: string, updatedShirt: import('../types').Shirt): Promise<boolean> => {
    return await updateShirtInStore(shirtSetId, updatedShirt);
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