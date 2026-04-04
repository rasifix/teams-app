# Trainer

## Purpose

A Trainer is a coaching participant profile that can be assigned to Teams in
Events to support planning and execution.

In business terms, a Trainer answers: "Who is responsible for supporting this
team during this event?"

## Core Concept

A Trainer is a long-lived member entity, not bound to a single Event. The
Trainer provides stable identity and assignment context, while concrete work is
captured through Team assignments within Event scope.

## Relationships

- A Trainer belongs to one or more Groups (depending on membership rules).
- A Trainer can be assigned to many Teams across Events.
- A Team may have one assigned Trainer.
- Trainer assignments contribute to operational history and staffing analysis.

## Key Responsibilities

- store core trainer profile data (first name, last name),
- provide assignable coaching capacity for team planning,
- anchor team-level trainer assignments in Event history,
- support operational visibility of who coached which Team and when.

## Lifecycle

1. A Trainer profile is created.
2. The Trainer is assigned to one or more Groups.
3. Event planners assign the Trainer to Team(s) in an Event.
4. Assignments can be adjusted until team finalization.
5. Historical assignments are retained for audit and analysis.

## Invariants And Rules

- A Trainer must have a valid identity (first name and last name).
- A Trainer assignment must reference an existing Team and Event context.
- Trainer assignments are scoped to Event Teams and do not imply permanent team
  ownership.
- Assignment conflicts (for example overlapping start times) should be
  validated by planning rules.
- Changes to assignments after finalization should trigger operational
  revalidation.

## Scope Boundaries

The Trainer does:

- define the coach profile,
- provide assignment identity for Event Teams,
- support staffing traceability across Events.

The Trainer does not:

- own Team roster selection decisions by itself,
- replace Event planning metadata,
- manage shirt inventory or invitation status directly.

## Practical Example

"Alex Meyer" is a Trainer in Group "U12". For Event "Saturday Training -
2026-04-11", Alex is assigned to Team A while another Trainer is assigned to
Team B. These assignments remain part of the Event record for future staffing
analysis.