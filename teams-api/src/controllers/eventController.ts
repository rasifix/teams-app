import { Request, Response } from 'express';
import { dataStore } from '../data/store';
import { Event, Invitation } from '../types';
import { randomUUID } from 'crypto';

export const getAllEvents = (req: Request, res: Response) => {
  const events = dataStore.getAllEvents();
  res.json(events);
};

export const getEventById = (req: Request, res: Response) => {
  const { id } = req.params;
  const event = dataStore.getEventById(id);
  
  if (!event) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }
  
  res.json(event);
};

export const createEvent = (req: Request, res: Response): void => {
  const { name, date, maxPlayersPerTeam, teams, invitations } = req.body;
  
  // Validation
  if (!name || !date || !maxPlayersPerTeam || !teams) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }
  
  const newEvent: Event = {
    id: randomUUID(),
    name,
    date,
    maxPlayersPerTeam: Number(maxPlayersPerTeam),
    teams: teams || [],
    invitations: invitations || []
  };
  
  const createdEvent = dataStore.createEvent(newEvent);
  res.status(201).json(createdEvent);
};

export const updateEvent = (req: Request, res: Response): void => {
  const { id } = req.params;
  const { name, date, maxPlayersPerTeam, teams, invitations } = req.body;
  
  const updates: Partial<Omit<Event, 'id'>> = {};
  
  if (name !== undefined) updates.name = name;
  if (date !== undefined) updates.date = date;
  if (maxPlayersPerTeam !== undefined) updates.maxPlayersPerTeam = Number(maxPlayersPerTeam);
  if (teams !== undefined) updates.teams = teams;
  if (invitations !== undefined) updates.invitations = invitations;
  
  const updatedEvent = dataStore.updateEvent(id, updates);
  
  if (!updatedEvent) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }
  
  res.json(updatedEvent);
};

export const deleteEvent = (req: Request, res: Response): void => {
  const { id } = req.params;
  const success = dataStore.deleteEvent(id);
  
  if (!success) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }
  
  res.status(204).send();
};

// PUT /api/events/:id/players - upsert the invitations
export const upsertInvitations = (req: Request, res: Response): void => {
  const { id } = req.params;
  const { playerIds } = req.body; // Array of player IDs
  
  const event = dataStore.getEventById(id);
  if (!event) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }
  
  if (!Array.isArray(playerIds)) {
    res.status(400).json({ error: 'playerIds must be an array' });
    return;
  }
  
  // Create invitations for new players, keep existing ones
  const existingPlayerIds = new Set(event.invitations.map(inv => inv.playerId));
  const newInvitations: Invitation[] = [];
  
  for (const playerId of playerIds) {
    if (!existingPlayerIds.has(playerId)) {
      newInvitations.push({
        id: randomUUID(),
        playerId,
        status: 'open'
      });
    }
  }
  
  const updatedInvitations = [...event.invitations, ...newInvitations];
  const updatedEvent = dataStore.updateEvent(id, { invitations: updatedInvitations });
  
  res.json(updatedEvent);
};

// PUT /api/events/:id/players/:player_id/status - update the invitation status
export const updateInvitationStatus = (req: Request, res: Response): void => {
  const { id, player_id } = req.params;
  const { status } = req.body;
  
  const event = dataStore.getEventById(id);
  if (!event) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }
  
  if (!['open', 'accepted', 'declined'].includes(status)) {
    res.status(400).json({ error: 'Invalid status. Must be open, accepted, or declined' });
    return;
  }
  
  const invitationIndex = event.invitations.findIndex(inv => inv.playerId === player_id);
  if (invitationIndex === -1) {
    res.status(404).json({ error: 'Invitation not found' });
    return;
  }
  
  const updatedInvitations = [...event.invitations];
  updatedInvitations[invitationIndex] = {
    ...updatedInvitations[invitationIndex],
    status
  };
  
  const updatedEvent = dataStore.updateEvent(id, { invitations: updatedInvitations });
  res.json(updatedEvent);
};

// PUT /api/events/:id/selection - upsert the player selection of the event
export const upsertSelection = (req: Request, res: Response): void => {
  const { id } = req.params;
  const { teams } = req.body; // Array of teams with selectedPlayers
  
  const event = dataStore.getEventById(id);
  if (!event) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }
  
  if (!Array.isArray(teams)) {
    res.status(400).json({ error: 'teams must be an array' });
    return;
  }
  
  const updatedEvent = dataStore.updateEvent(id, { teams });
  res.json(updatedEvent);
};
