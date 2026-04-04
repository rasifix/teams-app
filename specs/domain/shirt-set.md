# Shirt Set

## Purpose

A Shirt Set models a reusable kit inventory used to equip teams for events with
consistent sponsor, color, and shirt-number availability.

In business terms, a Shirt Set answers: "Which physical shirts can be assigned
to players for a team on event day?"

## Core Concept

A Shirt Set is an inventory container, not an event result. It groups multiple
Shirts under shared metadata (for example sponsor and color) and makes those
shirts assignable to Teams in Events.

## Relationships

- A Shirt Set has many Shirts.
- A Shirt Set can be assigned to many Teams over time.
- A Team references at most one Shirt Set at a time.
- Shirt assignments are executed in team context, not globally.

## Key Responsibilities

- define kit identity via sponsor and color,
- store available shirt items with number and size,
- distinguish goalkeeper and field-player shirts,
- provide assignable inventory for team planning,
- preserve reusable inventory across many events.

## Data Model

A Shirt Set contains:

- sponsor,
- color,
- shirts array.

Each Shirt contains:

- number,
- size: one of 128, 140, 152, 164, XS, S, M, L, XL,
- isGoalkeeper: boolean.

## Lifecycle

1. Shirt Set is created with sponsor and color.
2. Shirt items are added, edited, or removed.
3. A Team in an Event references the Shirt Set.
4. Individual shirts are assigned to selected players.
5. After the Event, assignments can be reviewed and inventory reused.

## Invariants And Rules

- Shirt numbers should be unique within one Shirt Set.
- A Shirt must belong to exactly one Shirt Set.
- A Shirt can be assigned to at most one player per Team context.
- Goalkeeper shirts should only be assigned where goalkeeper role exists.
- Removing a Shirt Set that is referenced by active or historical Team records
  should be restricted or require safe migration.
- Size values should be validated against the supported size domain.

## Scope Boundaries

The Shirt Set does:

- model reusable kit inventory,
- support shirt allocation in team workflows,
- provide sponsor/color identity for operational clarity.

The Shirt Set does not:

- decide team composition,
- track invitation responses,
- replace event-level attendance or fairness metrics.

## Practical Example

Shirt Set "Acme Blue" contains numbers 1 to 14, with number 1 marked as
goalkeeper and mixed youth/adult sizes. For Event "Saturday Training -
2026-04-11", Team A references "Acme Blue" and assigns shirts to selected
players. The same Shirt Set is reused for future Events unless inventory changes.
