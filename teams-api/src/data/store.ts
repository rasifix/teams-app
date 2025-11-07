import { Player, Event } from '../types';

// In-memory storage (will be replaced with a database later)
class DataStore {
  private players: Map<string, Player> = new Map();
  private events: Map<string, Event> = new Map();

  // Player operations
  getAllPlayers(): Player[] {
    return Array.from(this.players.values());
  }

  getPlayerById(id: string): Player | undefined {
    return this.players.get(id);
  }

  createPlayer(player: Player): Player {
    this.players.set(player.id, player);
    return player;
  }

  updatePlayer(id: string, updates: Partial<Omit<Player, 'id'>>): Player | null {
    const player = this.players.get(id);
    if (!player) return null;
    
    const updatedPlayer = { ...player, ...updates };
    this.players.set(id, updatedPlayer);
    return updatedPlayer;
  }

  deletePlayer(id: string): boolean {
    return this.players.delete(id);
  }

  // Event operations
  getAllEvents(): Event[] {
    return Array.from(this.events.values());
  }

  getEventById(id: string): Event | undefined {
    return this.events.get(id);
  }

  createEvent(event: Event): Event {
    this.events.set(event.id, event);
    return event;
  }

  updateEvent(id: string, updates: Partial<Omit<Event, 'id'>>): Event | null {
    const event = this.events.get(id);
    if (!event) return null;
    
    const updatedEvent = { ...event, ...updates };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }

  deleteEvent(id: string): boolean {
    return this.events.delete(id);
  }
}

export const dataStore = new DataStore();
