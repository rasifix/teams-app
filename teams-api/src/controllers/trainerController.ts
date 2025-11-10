import { Request, Response } from 'express';
import { dataStore } from '../data/store';
import type { Trainer } from '../types';

// GET /api/trainers
export const getTrainers = (_req: Request, res: Response): void => {
  res.json(dataStore.getAllTrainers());
};

// GET /api/trainers/:id
export const getTrainerById = (req: Request, res: Response): void => {
  const { id } = req.params;
  const trainer = dataStore.getTrainerById(id);
  
  if (!trainer) {
    res.status(404).json({ message: 'Trainer not found' });
    return;
  }
  
  res.json(trainer);
};

// POST /api/trainers
export const createTrainer = (req: Request, res: Response): void => {
  const { firstName, lastName } = req.body;
  
  if (!firstName || !lastName) {
    res.status(400).json({ message: 'firstName and lastName are required' });
    return;
  }
  
  const newTrainer: Trainer = {
    id: crypto.randomUUID(),
    firstName,
    lastName,
  };
  
  const createdTrainer = dataStore.createTrainer(newTrainer);
  res.status(201).json(createdTrainer);
};

// PUT /api/trainers/:id
export const updateTrainer = (req: Request, res: Response): void => {
  const { id } = req.params;
  const { firstName, lastName } = req.body;
  
  if (!firstName || !lastName) {
    res.status(400).json({ message: 'firstName and lastName are required' });
    return;
  }
  
  const updatedTrainer = dataStore.updateTrainer(id, { firstName, lastName });
  
  if (!updatedTrainer) {
    res.status(404).json({ message: 'Trainer not found' });
    return;
  }
  
  res.json(updatedTrainer);
};

// DELETE /api/trainers/:id
export const deleteTrainer = (req: Request, res: Response): void => {
  const { id } = req.params;
  const success = dataStore.deleteTrainer(id);
  
  if (!success) {
    res.status(404).json({ message: 'Trainer not found' });
    return;
  }
  
  res.status(204).send();
};