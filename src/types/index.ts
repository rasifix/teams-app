export interface Period {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

export type SquadCategory = 'A' | 'B' | 'C' | 'D9' | 'D7' | 'E' | 'F' | 'G' | 'FF9' | 'FF11' | 'FF14' | 'FF17';

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

export interface MatchFormat {
  id: string;
  name: string; // e.g. "4x20"
  numberOfPeriods: number;
  periodLengthMinutes: number;
  minimumPeriodsPerPlayer?: number; // 0 or omitted means no minimum playing-time rule
  isDefault?: boolean;
  playersOnField?: number;
  minPlayersPerTeam?: number;
  maxPlayersPerTeam?: number;
  /** Set when the format was created from the official SFV catalog. */
  origin?: string;
}

export type SfvActivityType = 'match' | 'tournament';

/** Official match format of an SFV category (template for a squad's format). */
export type OfficialMatchFormat = Omit<MatchFormat, 'id' | 'isDefault' | 'origin'>;

export interface SfvCategoryEntry {
  activityType: SfvActivityType;
  /** Absent for tournament-only categories. */
  matchFormat?: OfficialMatchFormat;
  minPlayersPerTeam?: number;
  maxPlayersPerTeam?: number;
}

export interface SfvCategoryCatalog {
  version: string;
  source: string;
  categories: Partial<Record<SquadCategory, SfvCategoryEntry>>;
}

export interface Squad {
  id: string;
  spondId?: string | null;
  name: string;
  /** Soft lifecycle state; omitted by legacy API records means active. */
  active?: boolean;
  club?: string;
  description?: string;
  category?: SquadCategory | null;
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
  matchFormats?: MatchFormat[]; // squad-scoped only, never shared across squads
  formations?: Formation[]; // squad-scoped only, never shared across squads
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSquadRequest {
  name: string;
  spondId?: string | null;
  club?: string;
  description?: string;
  category?: SquadCategory | null;
}

export type SquadRole = 'admin' | 'trainer' | 'guardian' | 'player';

export interface Player {
  id: string;
  spondId?: string | null;
  roles?: SquadRole[];
  firstName: string;
  lastName: string;
  birthDate: string; // ISO date string
  level: number; // 1-5
  status: PlayerStatus;
  preferredShirtNumber?: number;
  guardians?: Guardian[];
}

export type PlayerStatus = 'active' | 'trial' | 'inactive';

export interface Guardian {
  id: string;
  spondId?: string | null;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  isDocumentedOnly?: boolean;
}

export interface LineupPositionAssignment {
  slotId: string; // references a FormationSlot in the Team's selected Formation
  playerId: string; // must be in the Team's selectedPlayers
}

export interface TeamLineupPeriod {
  periodNumber: number; // 1-based, bounded by the Activity's Match Format numberOfPeriods
  assignments: LineupPositionAssignment[]; // selected players absent here are implicitly benched
}

export type SelectionRemovalReason = 'sick' | 'injured' | 'noShow' | 'other';

export interface SelectionRemoval {
  playerId: string;
  reason: SelectionRemovalReason;
  removedAt: string;
}

export interface Team {
  id: string;
  name: string;
  strength: number; // 1 (highest) to 3 (lowest), default 2
  startTime?: string; // HH:MM override; otherwise use the activity start time
  location?: string; // Optional team location
  selectedPlayers: string[]; // Player IDs assigned to this team
  selectionRemovals?: SelectionRemoval[]; // Audit trail for players removed after the selection was sent
  responsiblePersonId?: string; // At most one trainer or guardian responsible for the team; players are never responsible
  shirtSetId?: string; // Shirt set ID assigned to this team
  shirtAssignments?: Array<{ playerId: string; shirtNumber: number }>; // Individual shirt assignments by number
  formationId?: string | null; // only settable while the Activity has a matchFormatId; fixed for the whole match
  lineup?: TeamLineupPeriod[]; // one entry per planned period
}

export type InvitationStatus = 'open' | 'accepted' | 'declined' | 'injured' | 'sick' | 'unavailable';

export interface PlayerSelection {
  playerId: string;
  teamId: string;
}

export interface PlayerActivityHistoryItem {
  eventId: string;
  eventName: string;
  eventDate: string; // YYYY-MM-DD
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
  spondId?: string | null;
  roles?: SquadRole[];
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

export type ActivityKind = 'match' | 'tournament';
export type ActivityStatus = 'active' | 'cancelled';
export type InvitationResponse = 'open' | 'accepted' | 'declined';
export type InvitationDeclineReason = 'injured' | 'sick' | 'unavailable';

export interface ActivityInvitation {
  id: string;
  playerId: string;
  response: InvitationResponse;
  declineReason?: InvitationDeclineReason;
  respondedBy?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'excused';

export type AttendanceReason = 'sick' | 'injured' | 'noShow' | 'other';

export interface ActivityAttendance {
  personId: string;
  status: AttendanceStatus;
  reason?: AttendanceReason; // optional, used for excused
}

/** Wire model of `/squads/:id/activities`. */
export interface Activity {
  id: string;
  spondId?: string | null;
  squadId: string;
  kind: ActivityKind;
  status: ActivityStatus;
  name: string;
  startsAt: string; // ISO date-time
  endsAt?: string;
  location?: string;
  matchFormatId?: string | null;
  opponentName?: string;
  maxPlayersPerTeam?: number;
  minPlayersPerTeam?: number;
  teams: Team[];
  invitations: ActivityInvitation[];
  selectionSentAt?: string;
  attendance?: ActivityAttendance[];
}

/** Body for creating or updating an activity (server owns `id` and `squadId`). */
export type ActivityPayload = Omit<Activity, 'id' | 'squadId'>;
