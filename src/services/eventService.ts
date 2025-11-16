import { apiClient } from './apiClient';
import type { Event } from '../types';

/**
 * Service layer for event data operations.
 * This provides an abstraction layer that handles API communication
 * for event-related operations.
 */

export async function getEvents(groupId: string): Promise<Event[]> {
  return apiClient.request<Event[]>(
    apiClient.getGroupEndpoint(groupId, '/events')
  );
}

export async function addEvent(groupId: string, eventData: Omit<Event, 'id'>): Promise<Event> {
  return apiClient.request<Event>(
    apiClient.getGroupEndpoint(groupId, '/events'),
    {
      method: 'POST',
      body: JSON.stringify(eventData)
    }
  );
}

export async function updateEvent(groupId: string, id: string, eventData: Partial<Event>): Promise<Event> {
  return apiClient.request<Event>(
    apiClient.getGroupEndpoint(groupId, `/events/${id}`),
    {
      method: 'PUT',
      body: JSON.stringify(eventData)
    }
  );
}

export async function deleteEvent(groupId: string, id: string): Promise<void> {
  return apiClient.request<void>(
    apiClient.getGroupEndpoint(groupId, `/events/${id}`),
    { method: 'DELETE' }
  );
}

export async function getEventById(groupId: string, id: string): Promise<Event | null> {
  try {
    return await apiClient.request<Event>(
      apiClient.getGroupEndpoint(groupId, `/events/${id}`)
    );
  } catch (error) {
    // If event not found, return null
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    throw error;
  }
}