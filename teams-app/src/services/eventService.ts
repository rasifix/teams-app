import type { Event } from '../types';
import * as localStorage from '../utils/localStorage';

/**
 * Service layer for event data operations.
 * This provides an abstraction layer over localStorage that can be easily
 * replaced with API calls when we migrate to a backend.
 * 
 * All methods are async to simulate future API behavior and provide
 * a consistent interface for the frontend.
 */

export async function getEvents(): Promise<Event[]> {
  return new Promise((resolve) => {
    // Simulate network delay for development/testing
    setTimeout(() => {
      const events = localStorage.getEvents();
      resolve(events);
    }, Math.random() * 100 + 50); // 50-150ms delay
  });
}

export async function addEvent(event: Event): Promise<Event> {
  return new Promise((resolve, reject) => {
    // Validate required fields
    if (!event.name || !event.date || !event.startTime) {
      setTimeout(() => reject(new Error('Event name, date, and start time are required')), 0);
      return;
    };
    
    const success = localStorage.addEvent(event);
    if (success) {
      setTimeout(() => resolve(event), 0);
    } else {
      setTimeout(() => reject(new Error('Failed to add event')), 0);
    }
  });
}

export async function updateEvent(id: string, updates: Partial<Omit<Event, 'id'>>): Promise<void> {
  return new Promise((resolve, reject) => {
    const success = localStorage.updateEvent(id, updates);
    if (success) {
      setTimeout(() => resolve(), 0);
    } else {
      setTimeout(() => reject(new Error('Failed to update event')), 0);
    }
  });
}

export async function deleteEvent(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const success = localStorage.deleteEvent(id);
    if (success) {
      setTimeout(() => resolve(), 0);
    } else {
      setTimeout(() => reject(new Error('Failed to delete event')), 0);
    }
  });
}

export function getEventById(id: string): Event | null {
  // This one can remain synchronous as it's just a lookup
  return localStorage.getEventById(id);
}