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
  shirtSetToShirtSetDocument,
  toObjectId,
  isValidObjectId
} from '../types/mappers';

// MongoDB-based data store
class DataStore {
  // Player operations
  async getAllPlayers(): Promise<Player[]> {
    const peopleCollection = mongoConnection.getPeopleCollection();
    const playerDocs = await peopleCollection.find({ role: 'player' }).toArray();
    return playerDocs
      .map(personDocumentToPlayer)
      .filter((player): player is Player => player !== null);
  }

  async getPlayerById(id: string): Promise<Player | undefined> {
    if (!isValidObjectId(id)) return undefined;
    
    const peopleCollection = mongoConnection.getPeopleCollection();
    const playerDoc = await peopleCollection.findOne({ 
      _id: toObjectId(id), 
      role: 'player' 
    });
    
    return playerDoc ? personDocumentToPlayer(playerDoc) || undefined : undefined;
  }

  async createPlayer(player: Player): Promise<Player> {
    const peopleCollection = mongoConnection.getPeopleCollection();
    const personDoc = playerToPersonDocument(player);
    const now = new Date();
    
    const newDoc: PersonDocument = {
      _id: toObjectId(player.id),
      ...personDoc,
      createdAt: now,
      updatedAt: now
    };
    
    await peopleCollection.insertOne(newDoc);
    return player;
  }

  async updatePlayer(id: string, updates: Partial<Omit<Player, 'id'>>): Promise<Player | null> {
    if (!isValidObjectId(id)) return null;
    
    const peopleCollection = mongoConnection.getPeopleCollection();
    const updateDoc = {
      ...updates,
      updatedAt: new Date()
    };
    
    const result = await peopleCollection.findOneAndUpdate(
      { _id: toObjectId(id), role: 'player' },
      { $set: updateDoc },
      { returnDocument: 'after' }
    );
    
    return result ? personDocumentToPlayer(result) : null;
  }

  async deletePlayer(id: string): Promise<boolean> {
    if (!isValidObjectId(id)) return false;
    
    const peopleCollection = mongoConnection.getPeopleCollection();
    const result = await peopleCollection.deleteOne({ 
      _id: toObjectId(id), 
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
    if (!isValidObjectId(id)) return undefined;
    
    const eventsCollection = mongoConnection.getEventsCollection();
    const eventDoc = await eventsCollection.findOne({ _id: toObjectId(id) });
    
    return eventDoc ? eventDocumentToEvent(eventDoc) : undefined;
  }

  async createEvent(event: Event): Promise<Event> {
    const eventsCollection = mongoConnection.getEventsCollection();
    const eventDoc = eventToEventDocument(event);
    const now = new Date();
    
    const newDoc: EventDocument = {
      _id: toObjectId(event.id),
      ...eventDoc,
      createdAt: now,
      updatedAt: now
    };
    
    await eventsCollection.insertOne(newDoc);
    return event;
  }

  async updateEvent(id: string, updates: Partial<Omit<Event, 'id'>>): Promise<Event | null> {
    if (!isValidObjectId(id)) return null;
    
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
      { _id: toObjectId(id) },
      { $set: updateDoc },
      { returnDocument: 'after' }
    );
    
    return result ? eventDocumentToEvent(result) : null;
  }

  async deleteEvent(id: string): Promise<boolean> {
    if (!isValidObjectId(id)) return false;
    
    const eventsCollection = mongoConnection.getEventsCollection();
    const result = await eventsCollection.deleteOne({ _id: toObjectId(id) });
    
    return result.deletedCount > 0;
  }

  // Trainer operations
  async getAllTrainers(): Promise<Trainer[]> {
    const peopleCollection = mongoConnection.getPeopleCollection();
    const trainerDocs = await peopleCollection.find({ role: 'trainer' }).toArray();
    return trainerDocs
      .map(personDocumentToTrainer)
      .filter((trainer): trainer is Trainer => trainer !== null);
  }

  async getTrainerById(id: string): Promise<Trainer | undefined> {
    if (!isValidObjectId(id)) return undefined;
    
    const peopleCollection = mongoConnection.getPeopleCollection();
    const trainerDoc = await peopleCollection.findOne({ 
      _id: toObjectId(id), 
      role: 'trainer' 
    });
    
    return trainerDoc ? personDocumentToTrainer(trainerDoc) || undefined : undefined;
  }

  async createTrainer(trainer: Trainer): Promise<Trainer> {
    const peopleCollection = mongoConnection.getPeopleCollection();
    const personDoc = trainerToPersonDocument(trainer);
    const now = new Date();
    
    const newDoc: PersonDocument = {
      _id: toObjectId(trainer.id),
      ...personDoc,
      createdAt: now,
      updatedAt: now
    };
    
    await peopleCollection.insertOne(newDoc);
    return trainer;
  }

  async updateTrainer(id: string, updates: Partial<Omit<Trainer, 'id'>>): Promise<Trainer | null> {
    if (!isValidObjectId(id)) return null;
    
    const peopleCollection = mongoConnection.getPeopleCollection();
    const updateDoc = {
      ...updates,
      updatedAt: new Date()
    };
    
    const result = await peopleCollection.findOneAndUpdate(
      { _id: toObjectId(id), role: 'trainer' },
      { $set: updateDoc },
      { returnDocument: 'after' }
    );
    
    return result ? personDocumentToTrainer(result) : null;
  }

  async deleteTrainer(id: string): Promise<boolean> {
    if (!isValidObjectId(id)) return false;
    
    const peopleCollection = mongoConnection.getPeopleCollection();
    const result = await peopleCollection.deleteOne({ 
      _id: toObjectId(id), 
      role: 'trainer' 
    });
    
    return result.deletedCount > 0;
  }

  // ShirtSet operations
  async getAllShirtSets(): Promise<ShirtSet[]> {
    const shirtSetsCollection = mongoConnection.getShirtSetsCollection();
    const shirtSetDocs = await shirtSetsCollection.find({ active: { $ne: false } }).sort({ createdAt: -1 }).toArray();
    return shirtSetDocs.map(shirtSetDocumentToShirtSet);
  }

  async getShirtSetById(id: string): Promise<ShirtSet | undefined> {
    if (!isValidObjectId(id)) return undefined;
    
    const shirtSetsCollection = mongoConnection.getShirtSetsCollection();
    const shirtSetDoc = await shirtSetsCollection.findOne({ 
      _id: toObjectId(id),
      active: { $ne: false }
    });
    
    return shirtSetDoc ? shirtSetDocumentToShirtSet(shirtSetDoc) : undefined;
  }

  async createShirtSet(shirtSet: ShirtSet): Promise<ShirtSet> {
    const shirtSetsCollection = mongoConnection.getShirtSetsCollection();
    const shirtSetDoc = shirtSetToShirtSetDocument(shirtSet);
    const now = new Date();
    
    const newDoc: ShirtSetDocument = {
      _id: toObjectId(shirtSet.id),
      ...shirtSetDoc,
      createdAt: now,
      updatedAt: now
    };
    
    await shirtSetsCollection.insertOne(newDoc);
    return shirtSet;
  }

  async updateShirtSet(id: string, updates: Partial<Omit<ShirtSet, 'id'>>): Promise<ShirtSet | null> {
    if (!isValidObjectId(id)) return null;
    
    const shirtSetsCollection = mongoConnection.getShirtSetsCollection();
    const updateDoc = {
      ...updates,
      updatedAt: new Date()
    };
    
    const result = await shirtSetsCollection.findOneAndUpdate(
      { _id: toObjectId(id), active: { $ne: false } },
      { $set: updateDoc },
      { returnDocument: 'after' }
    );
    
    return result ? shirtSetDocumentToShirtSet(result) : null;
  }

  async deleteShirtSet(id: string): Promise<boolean> {
    if (!isValidObjectId(id)) return false;
    
    const shirtSetsCollection = mongoConnection.getShirtSetsCollection();
    // Soft delete - mark as inactive instead of physical deletion
    const result = await shirtSetsCollection.updateOne(
      { _id: toObjectId(id) },
      { 
        $set: { 
          active: false, 
          updatedAt: new Date() 
        } 
      }
    );
    
    return result.modifiedCount > 0;
  }
}

export const dataStore = new DataStore();