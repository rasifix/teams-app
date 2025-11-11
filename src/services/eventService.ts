import { apiClient } from './apiClient';
import type { Event } from '../types';

/**
 * Service layer for event data operations.
 * This provides an abstraction layer that handles API communication
 * for event-related operations.
 */

export async function getEvents(): Promise<Event[]> {
  return apiClient.request<Event[]>(
    apiClient.getGroupEndpoint('/events')
  );
}

export async function addEvent(eventData: Omit<Event, 'id'>): Promise<Event> {
  return apiClient.request<Event>(
    apiClient.getGroupEndpoint('/events'),
    {
      method: 'POST',
      body: JSON.stringify(eventData)
    }
  );
}

export async function updateEvent(id: string, eventData: Partial<Event>): Promise<Event> {
  return apiClient.request<Event>(
    apiClient.getGroupEndpoint(`/events/${id}`),
    {
      method: 'PUT',
      body: JSON.stringify(eventData)
    }
  );
}

export async function deleteEvent(id: string): Promise<void> {
  return apiClient.request<void>(
    apiClient.getGroupEndpoint(`/events/${id}`),
    { method: 'DELETE' }
  );
}

export async function getEventById(id: string): Promise<Event | null> {
  try {
    return await apiClient.request<Event>(
      apiClient.getGroupEndpoint(`/events/${id}`)
    );
  } catch (error) {
    // If event not found, return null
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    throw error;
  }
}