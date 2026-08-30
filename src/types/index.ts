export interface Period {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

export type GroupCategory = 'A' | 'B' | 'C' | 'D9' | 'D7' | 'E' | 'F' | 'G' | 'FF9' | 'FF11' | 'FF14' | 'FF17';

export type PositionCode =
  | 'GK'
  | 'LB' | 'CB' | 'RB' | 'LWB' | 'RWB'
  | 'CDM' | 'CM' | 'CAM' | 'LM' | 'RM'
  | 'LW' | 'RW' | 'CF' | 'ST';

export interface FormationSlot {
  id: string;
  positionCode: PositionCode;
}

export interface Formation {
  id: string;
  name: string; // e.g. "3-3"
  slots: FormationSlot[]; // exactly one slot must have positionCode GK
}

export interface PlayingMode {
  id: string;
  name: string; // e.g. "4x20"
  numberOfPeriods: number;
  periodLengthMinutes: number;
  isDefault?: boolean;
}

export interface Group {
  id: string;
  name: string;
  club?: string;
  description?: string;
  category?: GroupCategory | null;
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
  matchPlanningEnabled?: boolean;
  playingModes?: PlayingMode[]; // group-scoped only, never shared across groups
  formations?: Formation[]; // group-scoped only, never shared across groups
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateGroupRequest {
  name: string;
  club?: string;
  description?: string;
  category?: GroupCategory | null;
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

export interface LineupPositionAssignment {
  slotId: string; // references a FormationSlot in the Team's selected Formation
  playerId: string; // must be in the Team's selectedPlayers
}

export interface TeamLineupPeriod {
  periodNumber: number; // 1-based, bounded by the Event's Playing Mode numberOfPeriods
  assignments: LineupPositionAssignment[]; // selected players absent here are implicitly benched
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
  formationId?: string | null; // only settable while the Event has a playingModeId; fixed for the whole match
  lineup?: TeamLineupPeriod[]; // one entry per planned period
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
  playingModeId?: string | null; // only usable when the group has matchPlanningEnabled; always optional
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
  status?: 'available' | 'unavailable';
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
