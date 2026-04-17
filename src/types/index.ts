export interface Period {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

export interface Group {
  id: string;
  name: string;
  club?: string;
  description?: string;
  trainers?: Array<{
    id: string;
    email?: string;
  }>;
  members?: Array<{
    id: string;
    email?: string;
    roles?: string[];
  }>;
  periods: Period[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateGroupRequest {
  name: string;
  club?: string;
  description?: string;
}

export type GroupRole = 'admin' | 'trainer' | 'guardian' | 'player';

export interface Player {
  id: string;
  roles?: GroupRole[];
  firstName: string;
  lastName: string;
  birthYear: number;
  birthDate?: string; // ISO date string
  level: number; // 1-5
  status: PlayerStatus;
  preferredShirtNumber?: number;
  guardians?: Guardian[];
}

export type PlayerStatus = 'active' | 'trial' | 'inactive';

export interface Guardian {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  relationship?: string;
  userId?: string;
  isDocumentedOnly?: boolean;
}

export interface Team {
  id: string;
  name: string;
  strength: number; // 1 (highest) to 3 (lowest), default 2
  startTime: string; // HH:MM format - each team can have different start times
  location?: string; // Optional team location
  selectedPlayers: string[]; // Player IDs assigned to this team
  trainerId?: string; // Assigned team lead member ID (trainer or guardian)
  shirtSetId?: string; // Shirt set ID assigned to this team
  shirtAssignments?: Array<{ playerId: string; shirtNumber: number }>; // Individual shirt assignments by number
}

export type InvitationStatus = 'open' | 'accepted' | 'declined' | 'injured' | 'sick' | 'unavailable';

export interface Invitation {
  id: string;
  playerId: string;
  status: InvitationStatus;
}

export interface Event {
  id: string;
  name: string;
  date: string; // ISO date string
  maxPlayersPerTeam: number; // Max players applies to all teams in this event
  minPlayersPerTeam: number; // Minimum players required per team
  location?: string; // Optional event location
  teams: Team[]; // Teams are contained within the event
  invitations: Invitation[];
}

export interface PlayerSelection {
  playerId: string;
  teamId: string;
}

export interface PlayerEventHistoryItem {
  eventId: string;
  eventName: string;
  eventDate: string; // ISO date string
  invitationStatus: InvitationStatus;
  isSelected: boolean;
  teamName?: string;
}

export interface Shirt {
  number: number;
  size: '128' | '140' | '152' | '164' | 'XS' | 'S' | 'M' | 'L' | 'XL';
  isGoalkeeper: boolean;
}

export interface ShirtSet {
  id: string;
  sponsor: string;
  color: string;
  shirts: Shirt[];
}

export interface Trainer {
  id: string;
  roles?: GroupRole[];
  firstName: string;
  lastName: string;
  email?: string;
}

// Auto-selection algorithm types
export interface PlayerWithStats extends Player {
  selectedCount: number; // Number of times selected in previous events
  invitedCount: number; // Total number of invitations received
  acceptedCount: number; // Number of accepted invitations
}

export interface TeamForSelection {
  id: string;
  strength: number; // 1 (highest) to 3 (lowest)
  maxPlayers: number;
}

export interface SelectionResult {
  [playerId: string]: string; // Maps player ID to team ID
}