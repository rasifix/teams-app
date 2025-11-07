import { useState, useEffect } from 'react';
import type { Event } from '../types';
import * as eventService from '../services/eventService';

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const loadedEvents = await eventService.getEvents();
        const sortedEvents = loadedEvents.sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        setEvents(sortedEvents);
        setError(null);
      } catch (err) {
        setError('Failed to load events');
        console.error('Error loading events:', err);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  const addEvent = async (eventData: Omit<Event, 'id'>): Promise<boolean> => {
    try {
      const newEvent: Event = {
        ...eventData,
        id: crypto.randomUUID(),
      };

      await eventService.addEvent(newEvent);
      setEvents(prev => {
        const updated = [...prev, newEvent];
        return updated.sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
      });
      setError(null);
      return true;
    } catch (err) {
      setError('Failed to add event');
      console.error('Error adding event:', err);
      return false;
    }
  };

  const updateEvent = async (eventId: string, updates: Partial<Omit<Event, 'id'>>): Promise<boolean> => {
    try {
      await eventService.updateEvent(eventId, updates);
      setEvents(prev => {
        const updated = prev.map(event => 
          event.id === eventId ? { ...event, ...updates } : event
        );
        return updated.sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
      });
      setError(null);
      return true;
    } catch (err) {
      setError('Failed to update event');
      console.error('Error updating event:', err);
      return false;
    }
  };

  const deleteEvent = async (eventId: string): Promise<boolean> => {
    try {
      await eventService.deleteEvent(eventId);
      setEvents(prev => prev.filter(event => event.id !== eventId));
      setError(null);
      return true;
    } catch (err) {
      setError('Failed to delete event');
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
