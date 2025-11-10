import type { 
  PersonDocument, 
  EventDocument, 
  ShirtSetDocument,
  TeamEmbedded,
  InvitationEmbedded
} from './mongodb';
import type { 
  Player, 
  Trainer, 
  Event, 
  ShirtSet, 
  Team, 
  Invitation 
} from './index';

// Convert MongoDB PersonDocument to API Player
export function personDocumentToPlayer(doc: PersonDocument): Player | null {
  if (doc.role !== 'player' || !doc.birthYear || !doc.level) {
    return null;
  }
  
  return {
    id: doc._id,
    firstName: doc.firstName,
    lastName: doc.lastName,
    birthYear: doc.birthYear,
    level: doc.level
  };
}

// Convert MongoDB PersonDocument to API Trainer
export function personDocumentToTrainer(doc: PersonDocument): Trainer | null {
  if (doc.role !== 'trainer') {
    return null;
  }
  
  return {
    id: doc._id,
    firstName: doc.firstName,
    lastName: doc.lastName
  };
}

// Convert API Player to MongoDB PersonDocument (for creation)
export function playerToPersonDocument(player: Omit<Player, 'id'>): Omit<PersonDocument, '_id' | 'createdAt' | 'updatedAt'> {
  return {
    firstName: player.firstName,
    lastName: player.lastName,
    role: 'player',
    birthYear: player.birthYear,
    level: player.level
  };
}

// Convert API Trainer to MongoDB PersonDocument (for creation)
export function trainerToPersonDocument(trainer: Omit<Trainer, 'id'>): Omit<PersonDocument, '_id' | 'createdAt' | 'updatedAt'> {
  return {
    firstName: trainer.firstName,
    lastName: trainer.lastName,
    role: 'trainer'
  };
}

// Convert embedded invitation from MongoDB to API format
export function embeddedInvitationToInvitation(embedded: InvitationEmbedded): Invitation {
  return {
    id: embedded.id,
    playerId: embedded.playerId,
    status: embedded.status
  };
}

// Convert API invitation to embedded format
export function invitationToEmbedded(invitation: Invitation): InvitationEmbedded {
  return {
    id: invitation.id,
    playerId: invitation.playerId,
    status: invitation.status,
    sentAt: new Date(),
    respondedAt: invitation.status !== 'open' ? new Date() : undefined
  };
}

// Convert embedded team from MongoDB to API format
export function embeddedTeamToTeam(embedded: TeamEmbedded): Team {
  return {
    id: embedded.id,
    name: embedded.name,
    strength: embedded.strength,
    startTime: embedded.startTime,
    selectedPlayers: embedded.selectedPlayers,
    trainerId: embedded.trainerId,
    shirtSetId: embedded.shirtSetId,
    shirtAssignments: embedded.shirtAssignments?.map(assignment => ({
      playerId: assignment.playerId,
      shirtNumber: assignment.shirtNumber
    }))
  };
}

// Convert API team to embedded format
export function teamToEmbedded(team: Team): TeamEmbedded {
  return {
    id: team.id,
    name: team.name,
    strength: team.strength,
    startTime: team.startTime,
    selectedPlayers: team.selectedPlayers,
    trainerId: team.trainerId,
    shirtSetId: team.shirtSetId,
    shirtAssignments: team.shirtAssignments?.map(assignment => ({
      playerId: assignment.playerId,
      shirtNumber: assignment.shirtNumber
    }))
  };
}

// Convert MongoDB EventDocument to API Event
export function eventDocumentToEvent(doc: EventDocument): Event {
  return {
    id: doc._id,
    name: doc.name,
    date: doc.eventDate.toISOString().split('T')[0], // Convert Date to ISO string
    maxPlayersPerTeam: doc.maxPlayersPerTeam,
    teams: doc.teams.map(embeddedTeamToTeam),
    invitations: doc.invitations.map(embeddedInvitationToInvitation)
  };
}

// Convert API Event to MongoDB EventDocument (for creation)
export function eventToEventDocument(event: Omit<Event, 'id'>): Omit<EventDocument, '_id' | 'createdAt' | 'updatedAt'> {
  return {
    name: event.name,
    eventDate: new Date(event.date),
    maxPlayersPerTeam: event.maxPlayersPerTeam,
    teams: event.teams.map(teamToEmbedded),
    invitations: event.invitations.map(invitationToEmbedded)
  };
}

// Convert MongoDB ShirtSetDocument to API ShirtSet
export function shirtSetDocumentToShirtSet(doc: ShirtSetDocument): ShirtSet {
  return {
    id: doc._id,
    sponsor: doc.sponsor,
    color: doc.color,
    shirts: doc.shirts // Shirts are embedded and have the same structure
  };
}

// Convert API ShirtSet to MongoDB ShirtSetDocument (for creation)
export function shirtSetToShirtSetDocument(shirtSet: Omit<ShirtSet, 'id'>): Omit<ShirtSetDocument, '_id' | 'createdAt' | 'updatedAt'> {
  return {
    sponsor: shirtSet.sponsor,
    color: shirtSet.color,
    shirts: shirtSet.shirts, // Shirts have the same structure
    active: true
  };
}