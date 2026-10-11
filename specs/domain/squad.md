# Squad

## Purpose

A Squad is a stable roster context that organizes players over time so events,
selection fairness, and attendance analysis can be scoped to the correct set of
members.

In business terms, a Squad answers: "Which players belong together for planning,
invitation, and team generation?"

## Core Concept

A Squad represents a recurring training or match cohort (for example, an age
band, skill pool, or squad). It is not a single event and not a generated team.
Instead, it is the long-lived container that events reference.

## Relationships

- A Squad has many Players.
- A Squad has many Events.
- Teams are created inside Events, not directly on the Squad.
- Invitations are created per Event for Players that are in scope of the Squad.
- Trainers can be assigned to Teams in Squad Events.
- A Squad may enable match planning and, when enabled, owns many Playing
	Modes and many Formations. Match Formats and Formations are subresources
	of exactly one Squad; they are never shared or referenced across Squads.
- Events reference one of the Squad's Match Formats; Teams reference one of
	the Squad's Formations. Both references are only valid within the same
	Squad.
- A Squad may be linked to at most one Spond group through `spondId`.
- A Squad owns reusable date periods. These periods are managed in Group
  Settings and may define the date range for a Spond event synchronization or
  filter statistics.

## Lifecycle

1. A Squad is created with a clear name and optional description.
2. Players are assigned to or removed from the Squad.
3. Events are created under the Squad timeline.
4. Invitations and team selection run within Squad boundaries.
5. Statistics are evaluated for fairness across the Squad's historical events.
6. Optionally, a Squad Manager enables match planning (`matchPlanningEnabled`)
	and defines Match Formats and Formations for the Squad. This is relevant
	mainly for older youth categories (for example D, C, B, A) that play
	timed periods with break-only substitutions; younger categories can leave
	it disabled.
7. Optionally, a Squad Manager links one Spond group and uses that fixed link
   for later player and event synchronization.

## Invariants And Rules

- A Player may only be invited to an Event if the Player belongs to the Event's
	Squad (unless an explicit guest flow exists).
- Fair-selection history should be calculated from prior Events in the same
	Squad to keep comparisons meaningful.
- Team balancing constraints (level distribution, trainer assignment, shirt
	allocation) apply per Event, while Squad membership defines candidate players.
- Deleting a Squad should be restricted or guarded when dependent Events,
	Invitations, or statistics records exist.
- Match Formats and Formations only exist as embedded collections on their
	owning Squad; there is no top-level catalog, so cross-Squad sharing is not
	possible.
- Exactly one Match Format per Squad may be marked as the default.
- Turning `matchPlanningEnabled` off hides match-planning management and
	inputs but must not delete existing Match Formats, Formations, or Team
	lineup data.
- Deleting a Match Format or Formation that is still referenced by an Event
	or Team in the Squad should be restricted, mirroring the Squad's own
	dependent-record deletion guard.
- A linked `spondId` identifies the only Spond group that may be used by the
  scoped Players and Events synchronization flows. Those flows must not offer
  a different group selector.
- Unlinking Spond clears only the Squad's group link. It does not delete local
  Players, Guardians, Events, or their existing external identifiers.
- Spond credentials and access tokens are request-scoped secrets and must not
  be persisted or logged.

## Scope Boundaries

The Squad does:

- define member scope,
- provide historical context for fairness,
- partition event planning and reporting,
- optionally own the catalog of Match Formats and Formations available to
	its own Events and Teams,
- own date periods used by statistics and synchronization,
- hold the optional link to one Spond group.

The Squad does not:

- store per-event attendance outcomes directly,
- replace Team entities,
- decide invitation status by itself,
- share Match Formats or Formations with other Squads.

## Practical Example

"U12" is a Squad. Weekly sessions are Events in that Squad. Team A and
Team B are generated inside each Event. Invitation responses and selection
history are tracked per Event, then aggregated across the Squad for fairness
metrics.

"D7" is a Squad with `matchPlanningEnabled` set to true. It defines Playing
Mode "4x20" (4 periods of 20 minutes) as its default, and Formation "3-3".
Match Events in "D7" default to the "4x20" Match Format, and Teams in those
Events select the "3-3" Formation for per-period lineup planning.
