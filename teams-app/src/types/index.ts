export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  birthYear: number;
  level: number; // 1-5
}

export interface Team {
  id: string;
  name: string;
  strength: number; // 1 (highest) to 3 (lowest), default 2
  selectedPlayers: string[]; // Player IDs assigned to this team
}

export interface Invitation {
  id: string;
  playerId: string;
  status: 'open' | 'accepted' | 'declined';
}

export interface Event {
  id: string;
  name: string;
  date: string; // ISO date string
  startTime: string; // HH:MM format
  maxPlayersPerTeam: number; // Max players applies to all teams in this event
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
  eventStartTime: string; // HH:MM format
  invitationStatus: 'open' | 'accepted' | 'declined';
  isSelected: boolean;
  teamName?: string;
}

export interface Shirt {
  id: string;
  number: number;
  size: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
  isGoalkeeper: boolean;
}

export interface ShirtSet {
  id: string;
  sponsor: string;
  color: string;
  shirts: Shirt[];
}