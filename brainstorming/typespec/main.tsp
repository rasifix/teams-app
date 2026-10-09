import "./decorators.js";

/**
 * Frontend domain model (TypeSpec trial).
 *
 * Conventions:
 *  - A property marked `@owns` is a composition: the owner deletes its parts.
 *  - Any other property typed with a model is an association to that entity.
 *  - `?` marks optional properties; `@minItems(1)` encodes "1..*".
 *  - Rules that cannot be expressed structurally are stated in doc comments.
 */
namespace TeamsDomain;

extern dec owns(target: Reflection.ModelProperty);

// ---------- Squad, people and authorization ----------

/**
 * Official SFV category: reference data maintained by the application, not by
 * users. It defines the official match formats of that category.
 */
model SfvCategory {
  /** Identifier is the category code, e.g. A, B, C, D9, D7, E, F, G, FF9, FF11, FF14, FF17. */
  code: string;
  name: string;

  /** Whether the category plays regular matches or only tournaments. */
  activityType: "match" | "tournament";

  /** Absent for tournament-only categories (e.g. E, F, G). */
  officialMatchFormat?: OfficialMatchFormat;
}

/** Reference data defined by the SFV; the template for a Squad's MatchFormat. */
model OfficialMatchFormat {
  name: string;

  /** Players per team on the field, e.g. 7 for D7. */
  playersOnField: int32;
  minPlayersPerTeam: int32;
  maxPlayersPerTeam: int32;
  numberOfPeriods: int32;
  periodLengthMinutes: int32;
}
enum SquadRole { admin, trainer, guardian, player }
enum PlayerStatus { active, trial, inactive }

model Period {
  id: string;
  name: string;
  startDate: plainDate;
  endDate: plainDate;
}


/** Owns its activities: deleting a Squad deletes them. */
model Squad {
  id: string;
  name: string;
  club?: string;
  description?: string;

  /**
   * Chosen when the Squad is created. The category's official match formats
   * are then copied into `matchFormats` (each keeping a link to its origin).
   */
  category?: SfvCategory;

  /** Match-planning configuration only applies when true. */
  matchPlanningEnabled?: boolean;

  createdAt?: utcDateTime;
  updatedAt?: utcDateTime;

  @owns members: Person[];
  @owns periods: Period[];
  @owns matchFormats: MatchFormat[];
  @owns formations: Formation[];
  @owns shirtSets: ShirtSet[];
  @owns activities: ScheduledActivity[];
}

model LoginAccount {
  id: string;
  email: string;
}

/**
 * A Person is a member record owned by exactly one Squad (the API stores
 * members per squad; the same human in two squads is two Persons).
 */
@discriminator("kind")
model Person {
  kind: string;
  id: string;
  firstName: string;
  lastName: string;

  /**
   * `trainer` is official Squad Trainer authorization. It is distinct from a
   * TrainingSession trainer or a Team's responsible person. A person may hold
   * multiple roles.
   */
  roles: SquadRole[];

  /** Contact data; independent of the login. */
  email?: string;
  phone?: string;

  /**
   * A person does not necessarily have a login. The login is an independent
   * account that is associated with the Person, not owned by it.
   */
  login?: LoginAccount;
}

model Player extends Person {
  kind: "player";
  birthDate: plainDate;
  @minValue(1)
  @maxValue(5)
  level: int32;
  status: PlayerStatus;
  preferredShirtNumber?: int32;
  guardians: Guardian[];
}

model Guardian extends Person {
  kind: "guardian";

  /** True when only recorded as contact, without app access. */
  isDocumentedOnly?: boolean;
}

// ---------- Scheduled activities and participation ----------

enum InvitationResponse { open, accepted, declined }
enum InvitationReason { sick, injured, unavailable }
enum AttendanceStatus { present, absent, excused }

/** Invitation send time is out of scope. `reason` is only valid when declined. */
model Invitation {
  id: string;
  person: Person;
  response: InvitationResponse;
  declineReason?: InvitationReason;
  respondedAt?: utcDateTime;
  respondedBy?: Person;
}

/** Recorded after the activity; never inferred from acceptance or selection. */
model Attendance {
  id: string;
  person: Person;
  status: AttendanceStatus;
}

/**
 * Free-form helper task of one activity (e.g. "Kiosk", "Set up goals"),
 * created by a Squad Trainer. It states how many people are needed; Players
 * and Guardians sign up for it, and a trainer may also sign people up.
 * Belongs to the activity, never to a Team.
 */
model ActivityTask {
  id: string;
  name: string;
  description?: string;

  @minValue(1)
  requiredPeople: int32;

  @owns signups: TaskSignup[];

  /** Derived: `signups` reach `requiredPeople`. */
  @visibility(Lifecycle.Read)
  isFulfilled: boolean;
}

model TaskSignup {
  id: string;
  person: Person;
  signedUpAt: utcDateTime;
}

/** Frontend history view. */
model ActivityHistoryItem {
  occurredAt: utcDateTime;
  action: string;
  summary: string;
  actor: Person;
}

@discriminator("kind")
model ScheduledActivity {
  kind: string;
  id: string;
  name: string;
  startsAt: utcDateTime;
  endsAt?: utcDateTime;
  location?: string;

  /** Derived: the activity lies in the past. No stored status; cancellation is out of scope. */
  @visibility(Lifecycle.Read)
  isCompleted: boolean;

  @owns invitations: Invitation[];
  @owns attendance: Attendance[];
  @owns tasks: ActivityTask[];
  @owns history: ActivityHistoryItem[];
}

model SocialEvent extends ScheduledActivity {
  kind: "social";
}

model TrainingSession extends ScheduledActivity {
  kind: "training";

  /** Not necessarily Squad Trainers; not an ActivityTask. */
  @minItems(1)
  trainers: Person[];

  @owns subgroups: TrainingGroup[];
}

// ---------- Training groupings ----------

/**
 * Planned from accepted invitations. Ad-hoc regrouping during the session is
 * not retained; only general attendance is recorded afterwards.
 */
model TrainingUnit {
  id: string;
  name: string;
  plannedPlayers: Player[];
}

model TrainingGroup {
  id: string;
  name: string;
  levelOrPurpose?: string;
  @owns units: TrainingUnit[];
}

// ---------- Match / Tournament ----------

/**
 * Limits apply to every Team of the activity. Selected players must have
 * accepted and may be in at most one Team of the same activity.
 */
model CompetitiveActivity extends ScheduledActivity {
  minPlayersPerTeam: int32;
  maxPlayersPerTeam: int32;

  /** Pre-fills the player limits; they remain overridable per activity. */
  matchFormat?: MatchFormat;

  /** Most recent time the selection was communicated. */
  selectionSentAt?: utcDateTime;
}

/** Has exactly one Team. The opponent is only a label. */
model Match extends CompetitiveActivity {
  kind: "match";
  opponentName?: string;
  @owns team: Team;
}

/** Has one or more Teams; no fixtures or lineups are modeled. */
model Tournament extends CompetitiveActivity {
  kind: "tournament";

  @minItems(1)
  @owns teams: Team[];
}

/** A selection in the context of one activity, not a permanent club team. */
model Team {
  id: string;
  name: string;
  selectedPlayers: Player[];

  /** Not necessarily Squad Trainers. */
  @minItems(1)
  responsiblePersons: Person[];

  /** Default 2. Balances Tournament teams. */
  @minValue(1)
  @maxValue(3)
  strength?: int32;

  /** Optional Tournament override of the activity schedule. */
  startTime?: plainTime;

  /** Optional Tournament override of the activity location. */
  location?: string;

  shirtSet?: ShirtSet;
  @owns shirtAssignments: ShirtAssignment[];

  /** Match only. */
  @owns matchPlan?: MatchPlan;
}

// ---------- Match planning ----------

enum PositionCode { GK, LB, CB, RB, LWB, RWB, CDM, CM, CAM, LM, RM, LW, RW, CF, ST }

/**
 * A Squad's format. Copied from an OfficialMatchFormat on Squad creation
 * (`origin` set) or user-defined (`origin` unset). At most one default per
 * Squad. Selecting a format pre-fills the activity's player limits.
 */
model MatchFormat {
  id: string;
  name: string;
  origin?: OfficialMatchFormat;

  /** Players per team on the field, e.g. 7 for D7. */
  playersOnField: int32;
  minPlayersPerTeam: int32;
  maxPlayersPerTeam: int32;
  numberOfPeriods: int32;
  periodLengthMinutes: int32;
  minimumPeriodsPerPlayer?: int32;
  isDefault?: boolean;
}

model FormationSlot {
  id: string;
  positionCode: PositionCode;
}

/** Exactly one GK slot and at least one outfield slot. */
model Formation {
  id: string;
  name: string;

  @minItems(1)
  @owns slots: FormationSlot[];
}

model LineupPositionAssignment {
  slot: FormationSlot;
  player: Player;
}

model TeamLineupPeriod {
  periodNumber: int32;
  @owns assignments: LineupPositionAssignment[];
}

model MatchPlan {
  formation: Formation;
  @owns periods: TeamLineupPeriod[];
}

// ---------- Shirts ----------

enum ShirtSize { `128`, `140`, `152`, `164`, XS, S, M, L, XL }
enum ShirtStatus { available, unavailable }

model Shirt {
  id: string;
  number: int32;
  size: ShirtSize;
  isGoalkeeper: boolean;
  status?: ShirtStatus;
}

model ShirtSet {
  id: string;
  sponsor: string;
  color: string;
  @owns shirts: Shirt[];
}

model ShirtAssignment {
  player: Player;
  shirt: Shirt;
}
