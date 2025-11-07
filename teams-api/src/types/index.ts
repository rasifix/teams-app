export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  birthYear: number;
  level: number; // 1-5
}

export interface Invitation {
  playerId: string;
  status: 'open' | 'accepted' | 'declined';
}

export interface Team {
  id: string;
  name: string;
  strength: number; // 1-5
  selectedPlayers: string[]; // Array of player IDs
}

export interface Event {
  id: string;
  name: string;
  date: string; // ISO date string
  startTime: string;
  maxPlayersPerTeam: number;
  teams: Team[];
  invitations: Invitation[];
}
