# Playing Mode

## Purpose

A Playing Mode defines the timed period structure of a match so that lineup
planning can be organized quarter by quarter (or however many periods apply).

In business terms, a Playing Mode answers: "How many periods does a match
have, and how long is each one?"

## Core Concept

A Playing Mode belongs to exactly one Group and is a reusable template (for
example "4x20" for four 20-minute periods, as used in Swiss youth category
D7). Groups typically define one Playing Mode per competition category and
mark one as the default so new Events don't require manual setup.

## Relationships

- A Playing Mode belongs to one Group and is never shared with other Groups.
- A Group may have many Playing Modes, but at most one is marked default.
- An Event may reference one Playing Mode from its own Group.
- A Team's lineup periods are bounded by its Event's Playing Mode
  `numberOfPeriods`.

## Lifecycle

1. A Group Manager enables match planning for the Group.
2. The Group Manager creates one or more Playing Modes (name, number of
   periods, period length in minutes) and marks one as default.
3. New Events in the Group are auto-assigned the default Playing Mode, but
   the assignment can be changed or reset to none at any time.
4. Teams in an Event with a Playing Mode assigned can plan a lineup for each
   period up to `numberOfPeriods`.
5. A Playing Mode can be edited or deleted while unused; deleting one still
   referenced by an Event is restricted.

## Invariants And Rules

- A Playing Mode always belongs to exactly one Group; it has no existence
  outside that Group and cannot be referenced by another Group's Events.
- `numberOfPeriods` must be a positive integer (at least 1).
- `periodLengthMinutes` must be a positive integer (at least 1).
- Exactly one Playing Mode per Group may be marked as default at any time.
- Deleting a Playing Mode that is referenced by any Event in the Group is
  restricted until that reference is removed.

## Scope Boundaries

The Playing Mode does:

- describe the number and length of match periods for lineup planning,
- provide a per-Group default so new Events need no manual setup.

The Playing Mode does not:

- track actual match time, scores, or live substitutions,
- define formations or player positions (see Formation),
- apply to Groups that have not opted into match planning.

## Practical Example

Group "D7" defines Playing Mode "4x20" (4 periods of 20 minutes) and marks it
default. Every new match Event in "D7" is auto-assigned "4x20", letting
Trainers plan a lineup for each of the four periods with substitutions only
between periods.
