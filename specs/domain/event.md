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
- When its Group has match planning enabled, an Event may reference one of
	the Group's Playing Modes, which then governs how many periods its Teams
	can plan lineups for.

## Key Responsibilities

- define planning metadata (name, date, max players per team),
- collect invitation responses for in-scope Players,
- provide the candidate pool for team selection,
- store the final selected Players per Team,
- serve as the atomic record for attendance and selection history,
- when match planning is enabled for its Group, optionally reference a
	Playing Mode that Teams use to plan per-period lineups.

## Lifecycle

1. An Event is created inside a Group with date and configuration.
2. If the Group has match planning enabled, the Event is auto-assigned the
	Group's default Playing Mode (still optional and resettable to none).
3. Invitations are generated for eligible Players.
4. Players respond (for example, open, accepted, declined).
5. Teams are created and filled manually or via selection logic.
6. If a Playing Mode is assigned, Teams may select a Formation and plan a
	per-period lineup.
7. Final selections are stored and used for statistics.
8. The Event is considered historical after completion, but remains queryable.

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
- An Event's Playing Mode, if set, must belong to the same Group as the
	Event.
- An Event's Playing Mode remains optional at all times; it can be reset to
	none even after being auto-assigned on creation.
- An Event can only reference a Playing Mode when its Group has match
	planning enabled.

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

"Saturday Match - 2026-05-02" is an Event in Group "D7", which has match
planning enabled. It is auto-assigned the Group's default Playing Mode
"4x20". Team A selects Formation "3-3" and plans a lineup for each of the
four periods, with unassigned selected Players implicitly on the bench for
that period.

