export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  birthYear: number;
  score: number; // 1-5
}

export interface Team {
  id: string;
  name: string;
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