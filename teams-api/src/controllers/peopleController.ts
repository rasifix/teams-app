import { Request, Response } from 'express';
import { dataStore } from '../data/store';
import { Player, Trainer } from '../types';
import { randomUUID } from 'crypto';

// GET /api/people?role=player|trainer or GET /api/people (returns all)
export const getAllPeople = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role } = req.query;
    
    if (role === 'player') {
      const players = await dataStore.getAllPlayers();
      res.json(players);
    } else if (role === 'trainer') {
      const trainers = await dataStore.getAllTrainers();
      res.json(trainers);
    } else if (!role) {
      // Return both players and trainers
      const [players, trainers] = await Promise.all([
        dataStore.getAllPlayers(),
        dataStore.getAllTrainers()
      ]);
      res.json({
        players,
        trainers
      });
    } else {
      res.status(400).json({ error: 'Invalid role. Must be "player" or "trainer"' });
    }
  } catch (error) {
    console.error('Error fetching people:', error);
    res.status(500).json({ error: 'Failed to fetch people' });
  }
};

// GET /api/people/:id
export const getPersonById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Try to find as player first, then as trainer
    const player = await dataStore.getPlayerById(id);
    if (player) {
      res.json({ ...player, role: 'player' });
      return;
    }
    
    const trainer = await dataStore.getTrainerById(id);
    if (trainer) {
      res.json({ ...trainer, role: 'trainer' });
      return;
    }
    
    res.status(404).json({ error: 'Person not found' });
  } catch (error) {
    console.error('Error fetching person:', error);
    res.status(500).json({ error: 'Failed to fetch person' });
  }
};

// POST /api/people
export const createPerson = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, firstName, lastName, birthYear, level } = req.body;
    
    if (!role || !firstName || !lastName) {
      res.status(400).json({ error: 'role, firstName, and lastName are required' });
      return;
    }
    
    if (!['player', 'trainer'].includes(role)) {
      res.status(400).json({ error: 'role must be "player" or "trainer"' });
      return;
    }
    
    if (role === 'player') {
      if (typeof birthYear !== 'number' || typeof level !== 'number') {
        res.status(400).json({ error: 'birthYear and level are required for players' });
        return;
      }
      
      if (level < 1 || level > 5) {
        res.status(400).json({ error: 'Player level must be between 1 and 5' });
        return;
      }
      
      const newPlayer: Player = {
        id: randomUUID(),
        firstName,
        lastName,
        birthYear,
        level
      };
      
      const createdPlayer = await dataStore.createPlayer(newPlayer);
      res.status(201).json({ ...createdPlayer, role: 'player' });
    } else {
      const newTrainer: Trainer = {
        id: randomUUID(),
        firstName,
        lastName
      };
      
      const createdTrainer = await dataStore.createTrainer(newTrainer);
      res.status(201).json({ ...createdTrainer, role: 'trainer' });
    }
  } catch (error) {
    console.error('Error creating person:', error);
    res.status(500).json({ error: 'Failed to create person' });
  }
};

// PUT /api/people/:id
export const updatePerson = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role, firstName, lastName, birthYear, level } = req.body;
    
    if (!role || !firstName || !lastName) {
      res.status(400).json({ error: 'role, firstName, and lastName are required' });
      return;
    }
    
    if (!['player', 'trainer'].includes(role)) {
      res.status(400).json({ error: 'role must be "player" or "trainer"' });
      return;
    }
    
    if (role === 'player') {
      if (typeof birthYear !== 'number' || typeof level !== 'number') {
        res.status(400).json({ error: 'birthYear and level are required for players' });
        return;
      }
      
      if (level < 1 || level > 5) {
        res.status(400).json({ error: 'Player level must be between 1 and 5' });
        return;
      }
      
      const updatedPlayer = await dataStore.updatePlayer(id, {
        firstName,
        lastName,
        birthYear,
        level
      });
      
      if (!updatedPlayer) {
        res.status(404).json({ error: 'Player not found' });
        return;
      }
      
      res.json({ ...updatedPlayer, role: 'player' });
    } else {
      const updatedTrainer = await dataStore.updateTrainer(id, {
        firstName,
        lastName
      });
      
      if (!updatedTrainer) {
        res.status(404).json({ error: 'Trainer not found' });
        return;
      }
      
      res.json({ ...updatedTrainer, role: 'trainer' });
    }
  } catch (error) {
    console.error('Error updating person:', error);
    res.status(500).json({ error: 'Failed to update person' });
  }
};

// DELETE /api/people/:id
export const deletePerson = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Try to delete as player first, then as trainer
    const playerDeleted = await dataStore.deletePlayer(id);
    if (playerDeleted) {
      res.status(204).send();
      return;
    }
    
    const trainerDeleted = await dataStore.deleteTrainer(id);
    if (trainerDeleted) {
      res.status(204).send();
      return;
    }
    
    res.status(404).json({ error: 'Person not found' });
  } catch (error) {
    console.error('Error deleting person:', error);
    res.status(500).json({ error: 'Failed to delete person' });
  }
};