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

## Lifecycle

1. A Group is created with a clear name and optional description.
2. Players are assigned to or removed from the Group.
3. Events are created under the Group timeline.
4. Invitations and team selection run within Group boundaries.
5. Statistics are evaluated for fairness across the Group's historical events.

## Invariants And Rules

- A Player may only be invited to an Event if the Player belongs to the Event's
	Group (unless an explicit guest flow exists).
- Fair-selection history should be calculated from prior Events in the same
	Group to keep comparisons meaningful.
- Team balancing constraints (level distribution, trainer assignment, shirt
	allocation) apply per Event, while Group membership defines candidate players.
- Deleting a Group should be restricted or guarded when dependent Events,
	Invitations, or statistics records exist.

## Scope Boundaries

The Group does:

- define member scope,
- provide historical context for fairness,
- partition event planning and reporting.

The Group does not:

- store per-event attendance outcomes directly,
- replace Team entities,
- decide invitation status by itself.

## Practical Example

"U12" is a Group. Weekly sessions are Events in that Group. Team A and
Team B are generated inside each Event. Invitation responses and selection
history are tracked per Event, then aggregated across the Group for fairness
metrics.

