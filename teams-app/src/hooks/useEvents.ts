import { useState, useEffect } from 'react';
import type { Event } from '../types';
import * as eventService from '../services/eventService';

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const loadedEvents = await eventService.getEvents();
      const sortedEvents = loadedEvents.sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      setEvents(sortedEvents);
      setError(null);
    } catch (err) {
      setError('Failed to load events from server');
      console.error('Error loading events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const addEvent = async (eventData: Omit<Event, 'id'>): Promise<boolean> => {
    try {
      await eventService.addEvent(eventData);
      await loadEvents(); // Refresh from API
      setError(null);
      return true;
    } catch (err) {
      setError('Failed to save event to server');
      console.error('Error adding event:', err);
      return false;
    }
  };

  const updateEvent = async (eventId: string, updates: Partial<Omit<Event, 'id'>>): Promise<boolean> => {
    try {
      await eventService.updateEvent(eventId, updates);
      await loadEvents(); // Refresh from API
      setError(null);
      return true;
    } catch (err) {
      setError('Failed to update event on server');
      console.error('Error updating event:', err);
      return false;
    }
  };

  const deleteEvent = async (eventId: string): Promise<boolean> => {
    try {
      await eventService.deleteEvent(eventId);
      await loadEvents(); // Refresh from API
      setError(null);
      return true;
    } catch (err) {
      setError('Failed to delete event on server');
      console.error('Error deleting event:', err);
      return false;
    }
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
