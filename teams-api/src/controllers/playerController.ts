import { Request, Response } from 'express';
import { dataStore } from '../data/store';
import { Player } from '../types';
import { randomUUID } from 'crypto';

export const getAllPlayers = (req: Request, res: Response) => {
  const players = dataStore.getAllPlayers();
  res.json(players);
};

export const getPlayerById = (req: Request, res: Response) => {
  const { id } = req.params;
  const player = dataStore.getPlayerById(id);
  
  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }
  
  res.json(player);
};

export const createPlayer = (req: Request, res: Response) => {
  const { firstName, lastName, birthYear, level } = req.body;
  
  // Validation
  if (!firstName || !lastName || !birthYear || level === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  if (level < 1 || level > 5) {
    return res.status(400).json({ error: 'Level must be between 1 and 5' });
  }
  
  const newPlayer: Player = {
    id: randomUUID(),
    firstName,
    lastName,
    birthYear: Number(birthYear),
    level: Number(level)
  };
  
  const createdPlayer = dataStore.createPlayer(newPlayer);
  res.status(201).json(createdPlayer);
};

export const updatePlayer = (req: Request, res: Response) => {
  const { id } = req.params;
  const { firstName, lastName, birthYear, level } = req.body;
  
  const updates: Partial<Omit<Player, 'id'>> = {};
  
  if (firstName !== undefined) updates.firstName = firstName;
  if (lastName !== undefined) updates.lastName = lastName;
  if (birthYear !== undefined) updates.birthYear = Number(birthYear);
  if (level !== undefined) {
    if (level < 1 || level > 5) {
      return res.status(400).json({ error: 'Level must be between 1 and 5' });
    }
    updates.level = Number(level);
  }
  
  const updatedPlayer = dataStore.updatePlayer(id, updates);
  
  if (!updatedPlayer) {
    return res.status(404).json({ error: 'Player not found' });
  }
  
  res.json(updatedPlayer);
};

export const deletePlayer = (req: Request, res: Response) => {
  const { id } = req.params;
  const success = dataStore.deletePlayer(id);
  
  if (!success) {
    return res.status(404).json({ error: 'Player not found' });
  }
  
  res.status(204).send();
};
