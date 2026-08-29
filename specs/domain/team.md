# Team

## Purpose

A Team is an event-scoped roster unit that groups selected Players for actual
participation in one specific Event.

In business terms, a Team answers: "Which selected players, trainer assignment,
and shirt setup define this lineup for this event?"

## Core Concept

A Team belongs to exactly one Event and represents one operational lineup
within that Event. It captures final selection outcomes and execution details
such as assigned Trainer, optional Shirt Set, relative strength, and start
time.

## Relationships

- A Team belongs to one Event.
- A Team has many selected Players.
- A Team may have one assigned Trainer.
- A Team may have one assigned Shirt Set.
- Team participation outcomes contribute to Event-level, Group-level, and
  Player-level fairness metrics.
- When its Event has a Playing Mode assigned, a Team may select one of the
  Group's Formations and plan a per-period lineup of Formation slot
  assignments for its selected Players.

## Key Responsibilities

- hold the final selected player roster for one lineup,
- store execution metadata (for example, strength and start time),
- capture staff/equipment assignments (trainer and optional shirt set),
- act as the atomic unit used when comparing balance across teams in an event,
- persist final selection outcomes for later statistics and auditability,
- when its Event has a Playing Mode, optionally hold a chosen Formation and
  a per-period lineup of position assignments for selected Players.

## Lifecycle

1. A Team is created within an Event.
2. Eligible accepted Players are assigned manually or via selection logic.
3. Trainer and optional Shirt Set are assigned.
4. Team balance and roster validity are verified.
5. If the Event has a Playing Mode, the Team may select a Formation and plan
	position assignments (or bench) for each period; the Formation stays fixed
	for the whole match while assignments can change every period.
6. Final roster is locked for event execution and later statistics.

## Invariants And Rules

- Every Team must reference exactly one Event.
- Team membership is scoped to its Event only.
- A Player must not be selected into multiple Teams within the same Event
  unless explicitly supported by business rules.
- Selected Players should come from the Event's invitation/eligibility context.
- Team size should respect Event roster constraints (for example, max players
  per team).
- Team assignments (players, trainer, shirt set) should remain auditable after
  event completion.
- A Team's Formation, if set, must belong to the same Group as the Event.
- A Team can only select a Formation when its Event has a Playing Mode
  assigned.
- Each lineup position assignment must reference a Player currently in the
  Team's selected Players and a slot that exists in the Team's chosen
  Formation; a Player must not be assigned to more than one slot within the
  same period.
- A selected Player absent from a period's assignments is implicitly on the
  bench for that period; no explicit bench list is stored.
- A period number in the lineup must not exceed the assigned Playing Mode's
  number of periods.
- A mismatch between filled slots plus benched Players and the Team's total
  selected Players (for example after a late roster change) is a warning,
  not a blocking error.

## Scope Boundaries

The Team does:

- model one concrete lineup inside an Event,
- own event-local player selections,
- store lineup-level assignments and execution parameters.

The Team does not:

- define long-term membership outside the Event,
- replace Player, Trainer, or Shirt Set master data,
- manage invitation workflows directly.

## Practical Example

In Event "Saturday Training - 2026-04-11", Team "A" contains 8 selected
Players, has Trainer "Alex Meyer", Shirt Set "Blue Sponsor Kit", strength
level 2, and start time 10:00. This Team record becomes part of the Event's
final participation history and future fairness calculations.

In Event "Saturday Match - 2026-05-02" (Playing Mode "4x20"), Team "A"
selects Formation "3-3" and, for each of the four periods, assigns selected
Players to slots `GK`, `LB`, `CB`, `RB`, `LM`, `CM`, `RM`; any remaining
selected Players are implicitly on the bench for that period.

## Related Reference

- Team lead assignment plan (trainer or guardian):
  [../team-guardian-assignment-plan.md](../team-guardian-assignment-plan.md)