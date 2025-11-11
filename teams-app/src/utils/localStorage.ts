import type { Player, Event, ShirtSet, Trainer } from '../types';

const STORAGE_KEYS = {
  PLAYERS: 'players',
  EVENTS: 'events',
  TEAMS: 'teams',
  INVITATIONS: 'invitations',
  SHIRT_SETS: 'shirtSets',
  TRAINERS: 'trainers',
} as const;

// Generic localStorage utility functions
function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error);
    return false;
  }
}

// Player-specific localStorage functions
export function getPlayers(): Player[] {
  return getFromStorage(STORAGE_KEYS.PLAYERS, []);
}

export function savePlayers(players: Player[]): boolean {
  return saveToStorage(STORAGE_KEYS.PLAYERS, players);
}

export function addPlayer(player: Player): boolean {
  const players = getPlayers();
  const updatedPlayers = [...players, player];
  return savePlayers(updatedPlayers);
}

export function updatePlayer(playerId: string, updates: Partial<Omit<Player, 'id'>>): boolean {
  const players = getPlayers();
  const playerIndex = players.findIndex(p => p.id === playerId);
  
  if (playerIndex === -1) {
    console.error(`Player with id ${playerId} not found`);
    return false;
  }
  
  const updatedPlayers = [...players];
  updatedPlayers[playerIndex] = { ...updatedPlayers[playerIndex], ...updates };
  return savePlayers(updatedPlayers);
}

export function deletePlayer(playerId: string): boolean {
  const players = getPlayers();
  const filteredPlayers = players.filter(p => p.id !== playerId);
  return savePlayers(filteredPlayers);
}

export function getPlayerById(playerId: string): Player | null {
  const players = getPlayers();
  return players.find(p => p.id === playerId) || null;
}

// Event-specific localStorage functions
export function getEvents(): Event[] {
  return getFromStorage(STORAGE_KEYS.EVENTS, []);
}

export function saveEvents(events: Event[]): boolean {
  return saveToStorage(STORAGE_KEYS.EVENTS, events);
}

export function addEvent(event: Event): boolean {
  const events = getEvents();
  const updatedEvents = [...events, event];
  return saveEvents(updatedEvents);
}

export function updateEvent(eventId: string, updates: Partial<Omit<Event, 'id'>>): boolean {
  const events = getEvents();
  const eventIndex = events.findIndex(e => e.id === eventId);
  
  if (eventIndex === -1) {
    console.error(`Event with id ${eventId} not found`);
    return false;
  }
  
  const updatedEvents = [...events];
  updatedEvents[eventIndex] = { ...updatedEvents[eventIndex], ...updates };
  return saveEvents(updatedEvents);
}

export function deleteEvent(eventId: string): boolean {
  const events = getEvents();
  const filteredEvents = events.filter(e => e.id !== eventId);
  return saveEvents(filteredEvents);
}

export function getEventById(eventId: string): Event | null {
  const events = getEvents();
  return events.find(e => e.id === eventId) || null;
}

// Export all data from localStorage
export function exportAllData(): Record<string, any> {
  const data: Record<string, any> = {};
  
  // Export all storage keys
  Object.values(STORAGE_KEYS).forEach(key => {
    const item = localStorage.getItem(key);
    if (item) {
      try {
        data[key] = JSON.parse(item);
      } catch (error) {
        console.error(`Error parsing ${key}:`, error);
        data[key] = item; // Store as string if parsing fails
      }
    }
  });
  
  return data;
}

// Download data as JSON file
export function downloadDataAsJSON(): void {
  const data = exportAllData();
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  link.download = `my-teams-data-${timestamp}.json`;
  
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ShirtSet-specific localStorage functions
export function getShirtSets(): ShirtSet[] {
  return getFromStorage(STORAGE_KEYS.SHIRT_SETS, []);
}

export function saveShirtSets(shirtSets: ShirtSet[]): boolean {
  return saveToStorage(STORAGE_KEYS.SHIRT_SETS, shirtSets);
}

export function addShirtSet(shirtSet: ShirtSet): boolean {
  const shirtSets = getShirtSets();
  const updatedShirtSets = [...shirtSets, shirtSet];
  return saveShirtSets(updatedShirtSets);
}

export function updateShirtSet(shirtSetId: string, updates: Partial<Omit<ShirtSet, 'id'>>): boolean {
  const shirtSets = getShirtSets();
  const shirtSetIndex = shirtSets.findIndex(s => s.id === shirtSetId);
  
  if (shirtSetIndex === -1) {
    console.error(`Shirt set with ID ${shirtSetId} not found`);
    return false;
  }

  const updatedShirtSet = { ...shirtSets[shirtSetIndex], ...updates };
  const updatedShirtSets = [...shirtSets];
  updatedShirtSets[shirtSetIndex] = updatedShirtSet;
  
  return saveShirtSets(updatedShirtSets);
}

export function deleteShirtSet(shirtSetId: string): boolean {
  const shirtSets = getShirtSets();
  const filteredShirtSets = shirtSets.filter(s => s.id !== shirtSetId);
  
  if (filteredShirtSets.length === shirtSets.length) {
    console.error(`Shirt set with ID ${shirtSetId} not found`);
    return false;
  }
  
  return saveShirtSets(filteredShirtSets);
}

export function getShirtSetById(shirtSetId: string): ShirtSet | null {
  const shirtSets = getShirtSets();
  return shirtSets.find(s => s.id === shirtSetId) || null;
}

// Trainer-specific localStorage functions
export function getTrainers(): Trainer[] {
  return getFromStorage(STORAGE_KEYS.TRAINERS, []);
}

export function saveTrainers(trainers: Trainer[]): boolean {
  return saveToStorage(STORAGE_KEYS.TRAINERS, trainers);
}

export function addTrainer(trainer: Trainer): boolean {
  const trainers = getTrainers();
  const updatedTrainers = [...trainers, trainer];
  return saveTrainers(updatedTrainers);
}

export function updateTrainer(trainerId: string, updates: Partial<Omit<Trainer, 'id'>>): boolean {
  const trainers = getTrainers();
  const trainerIndex = trainers.findIndex(t => t.id === trainerId);
  
  if (trainerIndex === -1) {
    console.error(`Trainer with id ${trainerId} not found`);
    return false;
  }
  
  const updatedTrainers = [...trainers];
  updatedTrainers[trainerIndex] = { ...updatedTrainers[trainerIndex], ...updates };
  return saveTrainers(updatedTrainers);
}

export function deleteTrainer(trainerId: string): boolean {
  const trainers = getTrainers();
  const filteredTrainers = trainers.filter(t => t.id !== trainerId);
  return saveTrainers(filteredTrainers);
}

export function getTrainerById(trainerId: string): Trainer | null {
  const trainers = getTrainers();
  return trainers.find(t => t.id === trainerId) || null;
}