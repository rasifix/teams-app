# Player

## Purpose

A Player is a selectable participant profile used for invitations, team
selection, and fairness tracking across Events in a Squad.

In business terms, a Player answers: "Who can be invited and selected to play,
and what profile attributes are relevant for balanced team planning?"

## Core Concept

A Player is a long-lived member entity, not tied to one Event. The Player
provides stable identity and selection-relevant attributes (for example level
and birth year), while participation decisions and outcomes are captured in
Invitation and Team records.

## Relationships

- A Player belongs to one or more Squads (depending on membership rules).
- A Player has many Invitations across Events.
- A Player can be selected into Teams through Event-scoped selection.
- Player participation history contributes to fairness and attendance metrics.
- A Player may carry a `spondId` linking it to one member of the Squad's linked
  Spond group.
- A Player may have documented Guardians imported from Spond.

## Key Responsibilities

- store core participant profile data (first name, last name, birth year,
  level),
- provide eligibility context for invitation and selection workflows,
- serve as the stable identity for historical attendance and selection
  analytics,
- support team balancing decisions through skill/level attributes.

## Lifecycle

1. A Player profile is created.
2. The Player is assigned to one or more Squads.
3. The Player receives Invitations for Squad Events.
4. The Player may be selected into Event Teams based on eligibility and
   availability.
5. Participation history accumulates and is used in fairness calculations for
   future selections.

## Invariants And Rules

- A Player must have a valid identity (first name and last name).
- A Player level should stay within the defined domain range (1-5).
- Birth year should be valid and plausible for youth/team planning.
- A Player should not be selectable for an Event without valid Squad scope and
  invitation context (unless explicit guest rules exist).
- A Player must not be selected into multiple Teams in the same Event
- A Spond-linked Player must not share the same `spondId` with another local
  member in the Squad.
- Player matching from Spond normalizes Unicode and common apostrophe variants
  before comparing names, so typographic and encoded apostrophes do not create
  false changes.
- Creating a Player from Spond requires a complete birth date and a valid
  level from 1 through 5.

## Scope Boundaries

The Player does:

- define the participant profile,
- provide attributes used for team balance,
- anchor historical participation metrics.

The Player does not:

- store per-Event response state directly (Invitation does that),
- own event-specific team assignment records (Team does that),
- manage Squad-level roster policy.

## Practical Example

"Mila Novak" (birth year 2014, level 3) is a Player in Squad "U12". Her
accepted Spond RSVP is synchronized for an Event, and she is selected into Team
B. This Event outcome increases her participation history used for future
fair-selection decisions.
