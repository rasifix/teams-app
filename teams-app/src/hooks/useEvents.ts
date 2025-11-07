import { useState, useEffect } from 'react';
import type { Event } from '../types';
import { getEvents, addEvent as addEventToStorage, deleteEvent as deleteEventFromStorage, updateEvent as updateEventInStorage } from '../utils/localStorage';

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const loadedEvents = getEvents();
    const sortedEvents = loadedEvents.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    setEvents(sortedEvents);
  }, []);

  const addEvent = (eventData: Omit<Event, 'id'>): boolean => {
    const newEvent: Event = {
      ...eventData,
      id: crypto.randomUUID(),
    };

    const success = addEventToStorage(newEvent);
    if (success) {
      setEvents(prev => {
        const updated = [...prev, newEvent];
        return updated.sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
      });
    }
    return success;
  };

  const updateEvent = (eventId: string, updates: Partial<Omit<Event, 'id'>>): boolean => {
    const success = updateEventInStorage(eventId, updates);
    if (success) {
      setEvents(prev => {
        const updated = prev.map(event => 
          event.id === eventId ? { ...event, ...updates } : event
        );
        return updated.sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
      });
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
