import { Request, Response } from 'express';
import { dataStore } from '../data/store';
import type { ShirtSet } from '../types';

// GET /api/shirt-sets
export const getShirtSets = (_req: Request, res: Response): void => {
  res.json(dataStore.getAllShirtSets());
};

// GET /api/shirt-sets/:id
export const getShirtSetById = (req: Request, res: Response): void => {
  const { id } = req.params;
  const shirtSet = dataStore.getShirtSetById(id);
  
  if (!shirtSet) {
    res.status(404).json({ message: 'Shirt set not found' });
    return;
  }
  
  res.json(shirtSet);
};

// POST /api/shirt-sets
export const createShirtSet = (req: Request, res: Response): void => {
  const { sponsor, color, shirts } = req.body;
  
  if (!sponsor || !color || !Array.isArray(shirts)) {
    res.status(400).json({ message: 'sponsor, color, and shirts array are required' });
    return;
  }
  
  const newShirtSet: ShirtSet = {
    id: crypto.randomUUID(),
    sponsor,
    color,
    shirts,
  };
  
  const createdShirtSet = dataStore.createShirtSet(newShirtSet);
  res.status(201).json(createdShirtSet);
};

// PUT /api/shirt-sets/:id
export const updateShirtSet = (req: Request, res: Response): void => {
  const { id } = req.params;
  const { sponsor, color, shirts } = req.body;
  
  if (!sponsor || !color || !Array.isArray(shirts)) {
    res.status(400).json({ message: 'sponsor, color, and shirts array are required' });
    return;
  }
  
  const updatedShirtSet = dataStore.updateShirtSet(id, { sponsor, color, shirts });
  
  if (!updatedShirtSet) {
    res.status(404).json({ message: 'Shirt set not found' });
    return;
  }
  
  res.json(updatedShirtSet);
};

// DELETE /api/shirt-sets/:id
export const deleteShirtSet = (req: Request, res: Response): void => {
  const { id } = req.params;
  const success = dataStore.deleteShirtSet(id);
  
  if (!success) {
    res.status(404).json({ message: 'Shirt set not found' });
    return;
  }
  
  res.status(204).send();
};