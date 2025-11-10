import { Request, Response } from 'express';
import { dataStore } from '../data/store';
import { Player } from '../types';
import { randomUUID } from 'crypto';

export const getAllPlayers = (_req: Request, res: Response): void => {
  const players = dataStore.getAllPlayers();
  res.json(players);
};

export const getPlayerById = (req: Request, res: Response): void => {
  const { id } = req.params;
  const player = dataStore.getPlayerById(id);
  
  if (!player) {
    res.status(404).json({ error: 'Player not found' });
    return;
  }
  
  res.json(player);
};

export const createPlayer = (req: Request, res: Response): void => {
  const { firstName, lastName, birthYear, level } = req.body;
  
  // Validation
  if (!firstName || !lastName || !birthYear || level === undefined) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }
  
  if (level < 1 || level > 5) {
    res.status(400).json({ error: 'Level must be between 1 and 5' });
    return;
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

export const updatePlayer = (req: Request, res: Response): void => {
  const { id } = req.params;
  const { firstName, lastName, birthYear, level } = req.body;
  
  const updates: Partial<Omit<Player, 'id'>> = {};
  
  if (firstName !== undefined) updates.firstName = firstName;
  if (lastName !== undefined) updates.lastName = lastName;
  if (birthYear !== undefined) updates.birthYear = Number(birthYear);
  if (level !== undefined) {
    if (level < 1 || level > 5) {
      res.status(400).json({ error: 'Level must be between 1 and 5' });
      return;
    }
    updates.level = Number(level);
  }
  
  const updatedPlayer = dataStore.updatePlayer(id, updates);
  
  if (!updatedPlayer) {
    res.status(404).json({ error: 'Player not found' });
    return;
  }
  
  res.json(updatedPlayer);
};

export const deletePlayer = (req: Request, res: Response): void => {
  const { id } = req.params;
  const success = dataStore.deletePlayer(id);
  
  if (!success) {
    res.status(404).json({ error: 'Player not found' });
    return;
  }
  
  res.status(204).send();
};
