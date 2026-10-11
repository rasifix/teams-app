# Event

## Purpose

An Event is a dated, executable planning unit where player availability is
known, attendance is confirmed, and teams are formed for a specific session.

In business terms, an Event answers: "Who is available and selected on this
date, and how are they organized into teams?"

## Core Concept

An Event belongs to exactly one Squad and captures a single occurrence
(training, match day, or similar activity). It is temporal and operational:
RSVP data, team setup, and final participation outcomes are all tracked at the
Event level. Event scheduling and the guardian-facing RSVP workflow remain in
Spond.

## Relationships

- An Event belongs to one Squad.
- An Event has many Invitations.
- An Event has many Teams.
- Teams in an Event have selected Players, assigned Trainers, and optional Shirt
	Sets.
- Event statistics contribute to Squad-level and Player-level fairness metrics.
- When its Squad has match planning enabled, an Event may reference one of
	the Squad's Match Formats, which then governs how many periods its Teams
	can plan lineups for.
- An Event may carry a `spondId` linking it to one event in the Squad's linked
  Spond group.

## Key Responsibilities

- define planning metadata (name, date, max players per team),
- retain RSVP data synchronized from Spond or entered by an admin or trainer,
- provide the candidate pool for team selection,
- store the final selected Players per Team,
- serve as the atomic record for attendance and selection history,
- when match planning is enabled for its Squad, optionally reference a
	Match Format that Teams use to plan per-period lineups.

## Lifecycle

1. An Event is created inside a Squad with date and configuration.
2. If the Squad has match planning enabled, the Event is auto-assigned the
	Squad's default Match Format (still optional and resettable to none).
3. RSVP data is synchronized from Spond or entered manually by an admin or
   trainer.
4. The current RSVP state (for example, open, accepted, declined) determines
   the default candidate pool for planning.
5. Teams are created and filled manually or via selection logic.
6. If a Match Format is assigned, Teams may select a Formation and plan a
	per-period lineup.
7. Final selections are stored and used for statistics.
8. The Event is considered historical after completion, but remains queryable.

## Invariants And Rules

- Every Event must reference exactly one Squad.
- An Invitation in an Event must reference one Player and one Event.
- A Player should not have duplicate active Invitations for the same Event.
- Team membership is scoped to the Event; selections do not carry over
	automatically to other Events.
- Fairness calculations should prioritize prior completed Events in the same
	Squad when deciding current selection priority.
- Changes to Event date or roster rules after invitations are sent should trigger
	revalidation of planning assumptions.
- An Event's Match Format, if set, must belong to the same Squad as the
	Event.
- An Event's Match Format remains optional at all times; it can be reset to
	none even after being auto-assigned on creation.
- An Event can only reference a Match Format when its Squad has match
	planning enabled.
- A Spond-linked Event must not share the same `spondId` with another local
  Event in the Squad.
- Spond timestamps represent real instants. They are converted exactly once to
  the application's Europe/Zurich wall-clock convention so synchronization
  does not introduce a UTC/local-time offset.
- Guardians and players cannot respond to invitations or change RSVP status in
  this application. They use Spond for those actions.

## Attendance

- An Event can carry one attendance record per Squad member
  (`present`, `absent` or `excused`), stored as `attendance` on the Event.
- Attendance is independent of invitations and team selection: it records who
  actually took part, so it may differ from who accepted or was selected.
- Attendance can only be recorded after the Event has started.
- Only admins and trainers can record or change attendance; guardians and
  players neither see nor edit it.
- Each recorded person must be a member of the Event's Squad.

## Scope Boundaries

The Event does:

- own date-specific planning and outcomes,
- aggregate invitations and teams for one occurrence,
- provide auditable context for attendance and selection decisions.

The Event does not:

- define long-term membership (that is Squad responsibility),
- replace Player profile data,
- schedule events, notify members, collect guardian/player RSVP responses, or
  manage helper tasks (those workflows remain in Spond),
- directly model shirt inventory outside assignments made in teams.

## Practical Example

"Saturday Training - 2026-04-11" is an Event in Squad "U12". Its RSVP data is
synchronized from Spond. Accepted players are balanced into Team A and Team B,
with trainers and shirt sets assigned. The final participation record from this
single date is then included in fairness statistics for future Events.

"Saturday Match - 2026-05-02" is an Event in Squad "D7", which has match
planning enabled. It is auto-assigned the Squad's default Match Format
"4x20". Team A selects Formation "3-3" and plans a lineup for each of the
four periods, with unassigned selected Players implicitly on the bench for
that period.
