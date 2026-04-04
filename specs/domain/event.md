# Event

## Purpose

An Event is a dated, executable planning unit where invitations are sent,
attendance is confirmed, and teams are formed for a specific session.

In business terms, an Event answers: "Who is available and selected on this
date, and how are they organized into teams?"

## Core Concept

An Event belongs to exactly one Group and captures a single occurrence
(training, match day, or similar activity). It is temporal and operational:
invitations, team setup, and final participation outcomes are all tracked at the
Event level.

## Relationships

- An Event belongs to one Group.
- An Event has many Invitations.
- An Event has many Teams.
- Teams in an Event have selected Players, assigned Trainers, and optional Shirt
	Sets.
- Event statistics contribute to Group-level and Player-level fairness metrics.

## Key Responsibilities

- define planning metadata (name, date, max players per team),
- collect invitation responses for in-scope Players,
- provide the candidate pool for team selection,
- store the final selected Players per Team,
- serve as the atomic record for attendance and selection history.

## Lifecycle

1. An Event is created inside a Group with date and configuration.
2. Invitations are generated for eligible Players.
3. Players respond (for example, open, accepted, declined).
4. Teams are created and filled manually or via selection logic.
5. Final selections are stored and used for statistics.
6. The Event is considered historical after completion, but remains queryable.

## Invariants And Rules

- Every Event must reference exactly one Group.
- An Invitation in an Event must reference one Player and one Event.
- A Player should not have duplicate active Invitations for the same Event.
- Team membership is scoped to the Event; selections do not carry over
	automatically to other Events.
- Fairness calculations should prioritize prior completed Events in the same
	Group when deciding current selection priority.
- Changes to Event date or roster rules after invitations are sent should trigger
	revalidation of planning assumptions.

## Scope Boundaries

The Event does:

- own date-specific planning and outcomes,
- aggregate invitations and teams for one occurrence,
- provide auditable context for attendance and selection decisions.

The Event does not:

- define long-term membership (that is Group responsibility),
- replace Player profile data,
- directly model shirt inventory outside assignments made in teams.

## Practical Example

"Saturday Training - 2026-04-11" is an Event in Group "U12". Invitations are
sent to Group players. Accepted players are balanced into Team A and Team B,
with trainers and shirt sets assigned. The final participation record from this
single date is then included in fairness statistics for future Events.

