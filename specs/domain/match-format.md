# Match Format

## Purpose

A Match Format defines the timed period structure of a match so that lineup
planning can be organized quarter by quarter (or however many periods apply).

In business terms, a Match Format answers: "How many periods does a match
have, and how long is each one?"

## Core Concept

A Match Format belongs to exactly one Squad and is a reusable template (for
example "4x20" for four 20-minute periods, as used in Swiss youth category
D7). Squads typically define one Match Format per competition category and
mark one as the default so new Events don't require manual setup.

## Relationships

- A Match Format belongs to one Squad and is never shared with other Squads.
- A Squad may have many Match Formats, but at most one is marked default.
- An Event may reference one Match Format from its own Squad.
- A Team's lineup periods are bounded by its Event's Match Format
  `numberOfPeriods`.

## Lifecycle

1. A Squad Manager enables match planning for the Squad.
2. The Squad Manager creates one or more Match Formats (name, number of
   periods, period length in minutes) and marks one as default.
3. New Events in the Squad are auto-assigned the default Match Format, but
   the assignment can be changed or reset to none at any time.
4. Teams in an Event with a Match Format assigned can plan a lineup for each
   period up to `numberOfPeriods`.
5. A Match Format can be edited or deleted while unused; deleting one still
   referenced by an Event is restricted.

## Invariants And Rules

- A Match Format always belongs to exactly one Squad; it has no existence
  outside that Squad and cannot be referenced by another Squad's Events.
- `numberOfPeriods` must be a positive integer (at least 1).
- `periodLengthMinutes` must be a positive integer (at least 1).
- Exactly one Match Format per Squad may be marked as default at any time.
- Deleting a Match Format that is referenced by any Event in the Squad is
  restricted until that reference is removed.

## Scope Boundaries

The Match Format does:

- describe the number and length of match periods for lineup planning,
- provide a per-Squad default so new Events need no manual setup.

The Match Format does not:

- track actual match time, scores, or live substitutions,
- define formations or player positions (see Formation),
- apply to Squads that have not opted into match planning.

## Practical Example

Squad "D7" defines Match Format "4x20" (4 periods of 20 minutes) and marks it
default. Every new match Event in "D7" is auto-assigned "4x20", letting
Trainers plan a lineup for each of the four periods with substitutions only
between periods.
