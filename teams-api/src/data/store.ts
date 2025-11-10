import { Player, Event, Trainer, ShirtSet } from '../types';

// In-memory storage (will be replaced with a database later)
class DataStore {
  private players: Map<string, Player> = new Map();
  private events: Map<string, Event> = new Map();
  private trainers: Map<string, Trainer> = new Map();
  private shirtSets: Map<string, ShirtSet> = new Map();

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

  // Trainer operations
  getAllTrainers(): Trainer[] {
    return Array.from(this.trainers.values());
  }

  getTrainerById(id: string): Trainer | undefined {
    return this.trainers.get(id);
  }

  createTrainer(trainer: Trainer): Trainer {
    this.trainers.set(trainer.id, trainer);
    return trainer;
  }

  updateTrainer(id: string, updates: Partial<Omit<Trainer, 'id'>>): Trainer | null {
    const trainer = this.trainers.get(id);
    if (!trainer) return null;
    
    const updatedTrainer = { ...trainer, ...updates };
    this.trainers.set(id, updatedTrainer);
    return updatedTrainer;
  }

  deleteTrainer(id: string): boolean {
    return this.trainers.delete(id);
  }

  // ShirtSet operations
  getAllShirtSets(): ShirtSet[] {
    return Array.from(this.shirtSets.values());
  }

  getShirtSetById(id: string): ShirtSet | undefined {
    return this.shirtSets.get(id);
  }

  createShirtSet(shirtSet: ShirtSet): ShirtSet {
    this.shirtSets.set(shirtSet.id, shirtSet);
    return shirtSet;
  }

  updateShirtSet(id: string, updates: Partial<Omit<ShirtSet, 'id'>>): ShirtSet | null {
    const shirtSet = this.shirtSets.get(id);
    if (!shirtSet) return null;
    
    const updatedShirtSet = { ...shirtSet, ...updates };
    this.shirtSets.set(id, updatedShirtSet);
    return updatedShirtSet;
  }

  deleteShirtSet(id: string): boolean {
    return this.shirtSets.delete(id);
  }
}

export const dataStore = new DataStore();
