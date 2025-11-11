import { useEvents as useEventsFromStore, useAppLoading, useAppHasErrors, useAppErrors } from '../store';

export function useEvents() {
  const {
    events,
    addEvent: addEventToStore,
    updateEvent: updateEventInStore,
    deleteEvent: deleteEventFromStore
  } = useEventsFromStore();
  
  // Use store-wide loading and error states
  const loading = useAppLoading();
  const hasErrors = useAppHasErrors();
  const errors = useAppErrors();
  
  // Use event-specific error if available, otherwise general error indicator
  const error = errors.events || (hasErrors ? 'Failed to load data' : null);

  const addEvent = async (eventData: Omit<import('../types').Event, 'id'>): Promise<boolean> => {
    return await addEventToStore(eventData);
  };

  const updateEvent = async (eventId: string, updates: Partial<Omit<import('../types').Event, 'id'>>): Promise<boolean> => {
    return await updateEventInStore(eventId, updates);
  };

  const deleteEvent = async (eventId: string): Promise<boolean> => {
    return await deleteEventFromStore(eventId);
  };

  return {
    events,
    loading,
    error,
    addEvent,
    updateEvent,
    deleteEvent,
  };
}
