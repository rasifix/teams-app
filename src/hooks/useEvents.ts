import { useState, useEffect } from 'react';
import type { Event } from '../types';
import { getEvents, addEvent as addEventToStorage, deleteEvent as deleteEventFromStorage, updateEvent as updateEventInStorage } from '../utils/localStorage';

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const loadedEvents = getEvents();
    setEvents(loadedEvents);
  }, []);

  const addEvent = (eventData: Omit<Event, 'id'>): boolean => {
    const newEvent: Event = {
      ...eventData,
      id: crypto.randomUUID(),
    };

    const success = addEventToStorage(newEvent);
    if (success) {
      setEvents(prev => [...prev, newEvent]);
    }
    return success;
  };

  const updateEvent = (eventId: string, updates: Partial<Omit<Event, 'id'>>): boolean => {
    const success = updateEventInStorage(eventId, updates);
    if (success) {
      setEvents(prev => prev.map(event => 
        event.id === eventId ? { ...event, ...updates } : event
      ));
    }
    return success;
  };

  const deleteEvent = (eventId: string): boolean => {
    const success = deleteEventFromStorage(eventId);
    if (success) {
      setEvents(prev => prev.filter(event => event.id !== eventId));
    }
    return success;
  };

  return {
    events,
    addEvent,
    updateEvent,
    deleteEvent,
  };
}
