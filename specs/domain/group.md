# Group

## Purpose

A Group is a stable roster context that organizes players over time so events,
selection fairness, and attendance analysis can be scoped to the correct set of
members.

In business terms, a Group answers: "Which players belong together for planning,
invitation, and team generation?"

## Core Concept

A Group represents a recurring training or match cohort (for example, an age
band, skill pool, or squad). It is not a single event and not a generated team.
Instead, it is the long-lived container that events reference.

## Relationships

- A Group has many Players.
- A Group has many Events.
- Teams are created inside Events, not directly on the Group.
- Invitations are created per Event for Players that are in scope of the Group.
- Trainers can be assigned to Teams in Group Events.
- A Group may enable match planning and, when enabled, owns many Playing
	Modes and many Formations. Playing Modes and Formations are subresources
	of exactly one Group; they are never shared or referenced across Groups.
- Events reference one of the Group's Playing Modes; Teams reference one of
	the Group's Formations. Both references are only valid within the same
	Group.

## Lifecycle

1. A Group is created with a clear name and optional description.
2. Players are assigned to or removed from the Group.
3. Events are created under the Group timeline.
4. Invitations and team selection run within Group boundaries.
5. Statistics are evaluated for fairness across the Group's historical events.
6. Optionally, a Group Manager enables match planning (`matchPlanningEnabled`)
	and defines Playing Modes and Formations for the Group. This is relevant
	mainly for older youth categories (for example D, C, B, A) that play
	timed periods with break-only substitutions; younger categories can leave
	it disabled.

## Invariants And Rules

- A Player may only be invited to an Event if the Player belongs to the Event's
	Group (unless an explicit guest flow exists).
- Fair-selection history should be calculated from prior Events in the same
	Group to keep comparisons meaningful.
- Team balancing constraints (level distribution, trainer assignment, shirt
	allocation) apply per Event, while Group membership defines candidate players.
- Deleting a Group should be restricted or guarded when dependent Events,
	Invitations, or statistics records exist.
- Playing Modes and Formations only exist as embedded collections on their
	owning Group; there is no top-level catalog, so cross-Group sharing is not
	possible.
- Exactly one Playing Mode per Group may be marked as the default.
- Turning `matchPlanningEnabled` off hides match-planning management and
	inputs but must not delete existing Playing Modes, Formations, or Team
	lineup data.
- Deleting a Playing Mode or Formation that is still referenced by an Event
	or Team in the Group should be restricted, mirroring the Group's own
	dependent-record deletion guard.

## Scope Boundaries

The Group does:

- define member scope,
- provide historical context for fairness,
- partition event planning and reporting,
- optionally own the catalog of Playing Modes and Formations available to
	its own Events and Teams.

The Group does not:

- store per-event attendance outcomes directly,
- replace Team entities,
- decide invitation status by itself,
- share Playing Modes or Formations with other Groups.

## Practical Example

"U12" is a Group. Weekly sessions are Events in that Group. Team A and
Team B are generated inside each Event. Invitation responses and selection
history are tracked per Event, then aggregated across the Group for fairness
metrics.

"D7" is a Group with `matchPlanningEnabled` set to true. It defines Playing
Mode "4x20" (4 periods of 20 minutes) as its default, and Formation "3-3".
Match Events in "D7" default to the "4x20" Playing Mode, and Teams in those
Events select the "3-3" Formation for per-period lineup planning.

