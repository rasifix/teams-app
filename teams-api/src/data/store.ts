import { mongoConnection } from '../database/connection';
import { Player, Event, Trainer, ShirtSet } from '../types';
import { 
  PersonDocument, 
  EventDocument, 
  ShirtSetDocument
} from '../types/mongodb';
import {
  personDocumentToPlayer,
  personDocumentToTrainer,
  playerToPersonDocument,
  trainerToPersonDocument,
  eventDocumentToEvent,
  eventToEventDocument,
  shirtSetDocumentToShirtSet,
  shirtSetToShirtSetDocument
} from '../types/mappers';

// MongoDB-based data store
class DataStore {
  // Player operations
  async getAllPlayers(): Promise<Player[]> {
    const membersCollection = mongoConnection.getMembersCollection();
    const playerDocs = await membersCollection.find({ role: 'player' }).toArray();
    return playerDocs
      .map(personDocumentToPlayer)
      .filter((player): player is Player => player !== null);
  }

  async getPlayerById(id: string): Promise<Player | undefined> {
    const membersCollection = mongoConnection.getMembersCollection();
    const playerDoc = await membersCollection.findOne({ 
      _id: id, 
      role: 'player' 
    });
    
    return playerDoc ? personDocumentToPlayer(playerDoc) || undefined : undefined;
  }

  async createPlayer(player: Player): Promise<Player> {
    const membersCollection = mongoConnection.getMembersCollection();
    const personDoc = playerToPersonDocument(player);
    const now = new Date();
    
    const newDoc: PersonDocument = {
      _id: player.id,
      ...personDoc,
      createdAt: now,
      updatedAt: now
    };
    
    await membersCollection.insertOne(newDoc);
    return player;
  }

  async updatePlayer(id: string, updates: Partial<Omit<Player, 'id'>>): Promise<Player | null> {
    const membersCollection = mongoConnection.getMembersCollection();
    const updateDoc = {
      ...updates,
      updatedAt: new Date()
    };
    
    const result = await membersCollection.findOneAndUpdate(
      { _id: id, role: 'player' },
      { $set: updateDoc },
      { returnDocument: 'after' }
    );
    
    return result ? personDocumentToPlayer(result) : null;
  }

  async deletePlayer(id: string): Promise<boolean> {
    const membersCollection = mongoConnection.getMembersCollection();
    const result = await membersCollection.deleteOne({ 
      _id: id, 
      role: 'player' 
    });
    
    return result.deletedCount > 0;
  }

  // Event operations
  async getAllEvents(): Promise<Event[]> {
    const eventsCollection = mongoConnection.getEventsCollection();
    const eventDocs = await eventsCollection.find({}).sort({ eventDate: -1 }).toArray();
    return eventDocs.map(eventDocumentToEvent);
  }

  async getEventById(id: string): Promise<Event | undefined> {
    const eventsCollection = mongoConnection.getEventsCollection();
    const eventDoc = await eventsCollection.findOne({ _id: id });
    
    return eventDoc ? eventDocumentToEvent(eventDoc) : undefined;
  }

  async createEvent(event: Event): Promise<Event> {
    const eventsCollection = mongoConnection.getEventsCollection();
    const eventDoc = eventToEventDocument(event);
    const now = new Date();
    
    const newDoc: EventDocument = {
      _id: event.id,
      ...eventDoc,
      createdAt: now,
      updatedAt: now
    };
    
    await eventsCollection.insertOne(newDoc);
    return event;
  }

  async updateEvent(id: string, updates: Partial<Omit<Event, 'id'>>): Promise<Event | null> {
    const eventsCollection = mongoConnection.getEventsCollection();
    
    // Convert updates to MongoDB format
    const updateDoc: any = { updatedAt: new Date() };
    
    if (updates.name !== undefined) updateDoc.name = updates.name;
    if (updates.date !== undefined) updateDoc.eventDate = new Date(updates.date);
    if (updates.maxPlayersPerTeam !== undefined) updateDoc.maxPlayersPerTeam = updates.maxPlayersPerTeam;
    if (updates.teams !== undefined) {
      const { teamToEmbedded } = await import('../types/mappers');
      updateDoc.teams = updates.teams.map(teamToEmbedded);
    }
    if (updates.invitations !== undefined) {
      const { invitationToEmbedded } = await import('../types/mappers');
      updateDoc.invitations = updates.invitations.map(invitationToEmbedded);
    }
    
    const result = await eventsCollection.findOneAndUpdate(
      { _id: id },
      { $set: updateDoc },
      { returnDocument: 'after' }
    );
    
    return result ? eventDocumentToEvent(result) : null;
  }

  async deleteEvent(id: string): Promise<boolean> {
    const eventsCollection = mongoConnection.getEventsCollection();
    const result = await eventsCollection.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }

  // Trainer operations
  async getAllTrainers(): Promise<Trainer[]> {
    const membersCollection = mongoConnection.getMembersCollection();
    const trainerDocs = await membersCollection.find({ role: 'trainer' }).toArray();
    return trainerDocs
      .map(personDocumentToTrainer)
      .filter((trainer): trainer is Trainer => trainer !== null);
  }

  async getTrainerById(id: string): Promise<Trainer | undefined> {
    const membersCollection = mongoConnection.getMembersCollection();
    const trainerDoc = await membersCollection.findOne({ 
      _id: id, 
      role: 'trainer' 
    });
    
    return trainerDoc ? personDocumentToTrainer(trainerDoc) || undefined : undefined;
  }

  async createTrainer(trainer: Trainer): Promise<Trainer> {
    const membersCollection = mongoConnection.getMembersCollection();
    const personDoc = trainerToPersonDocument(trainer);
    const now = new Date();
    
    const newDoc: PersonDocument = {
      _id: trainer.id,
      ...personDoc,
      createdAt: now,
      updatedAt: now
    };
    
    await membersCollection.insertOne(newDoc);
    return trainer;
  }

  async updateTrainer(id: string, updates: Partial<Omit<Trainer, 'id'>>): Promise<Trainer | null> {
    const membersCollection = mongoConnection.getMembersCollection();
    const updateDoc = {
      ...updates,
      updatedAt: new Date()
    };
    
    const result = await membersCollection.findOneAndUpdate(
      { _id: id, role: 'trainer' },
      { $set: updateDoc },
      { returnDocument: 'after' }
    );
    
    return result ? personDocumentToTrainer(result) : null;
  }

  async deleteTrainer(id: string): Promise<boolean> {
    const membersCollection = mongoConnection.getMembersCollection();
    const result = await membersCollection.deleteOne({ 
      _id: id, 
      role: 'trainer' 
    });
    
    return result.deletedCount > 0;
  }

  // Shirt Set operations
  async getAllShirtSets(): Promise<ShirtSet[]> {
    const shirtSetsCollection = mongoConnection.getShirtSetsCollection();
    const shirtSetDocs = await shirtSetsCollection.find({ active: { $ne: false } }).toArray();
    return shirtSetDocs.map(shirtSetDocumentToShirtSet);
  }

  async getShirtSetById(id: string): Promise<ShirtSet | undefined> {
    const shirtSetsCollection = mongoConnection.getShirtSetsCollection();
    const shirtSetDoc = await shirtSetsCollection.findOne({ 
      _id: id, 
      active: { $ne: false } 
    });
    
    return shirtSetDoc ? shirtSetDocumentToShirtSet(shirtSetDoc) : undefined;
  }

  async createShirtSet(shirtSet: ShirtSet): Promise<ShirtSet> {
    const shirtSetsCollection = mongoConnection.getShirtSetsCollection();
    const shirtSetDoc = shirtSetToShirtSetDocument(shirtSet);
    const now = new Date();
    
    const newDoc: ShirtSetDocument = {
      _id: shirtSet.id,
      ...shirtSetDoc,
      createdAt: now,
      updatedAt: now
    };
    
    await shirtSetsCollection.insertOne(newDoc);
    return shirtSet;
  }

  async updateShirtSet(id: string, updates: Partial<Omit<ShirtSet, 'id'>>): Promise<ShirtSet | null> {
    const shirtSetsCollection = mongoConnection.getShirtSetsCollection();
    const updateDoc = {
      ...updates,
      updatedAt: new Date()
    };
    
    const result = await shirtSetsCollection.findOneAndUpdate(
      { _id: id, active: { $ne: false } },
      { $set: updateDoc },
      { returnDocument: 'after' }
    );
    
    return result ? shirtSetDocumentToShirtSet(result) : null;
  }

  async deleteShirtSet(id: string): Promise<boolean> {
    const shirtSetsCollection = mongoConnection.getShirtSetsCollection();
    const result = await shirtSetsCollection.updateOne(
      { _id: id },
      { $set: { active: false, updatedAt: new Date() } }
    );
    
    return result.modifiedCount > 0;
  }
}

export const dataStore = new DataStore();